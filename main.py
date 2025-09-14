# main.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import Chatbot
import smtplib
from email.mime.text import MIMEText
import os
from datetime import datetime # Import datetime
import json

# Firebase Admin SDK imports
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Get allowed origins for CORS from environment variable or default to localhost
CORS_ALLOWED_ORIGINS_STR = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_STR.split(',')

app = Flask(__name__)
CORS(app, origins=CORS_ALLOWED_ORIGINS)
chatbot_instance = Chatbot()

# Initialize Firebase Admin SDK
# IMPORTANT: Replace 'path/to/your/serviceAccountKey.json' with the actual path to your service account key file.
# For local development, place this file in the root of your project.
# For production, consider more secure ways to handle credentials (e.g., environment variables, Google Cloud credentials).
try:
    # Try to load from environment variable first
    firebase_config_json = os.getenv('FIREBASE_ADMIN_SDK_CONFIG')

    if firebase_config_json:
        # Parse the JSON string from the environment variable
        cred_dict = json.loads(firebase_config_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # Fallback for local development if 'serviceAccountKey.json' exists
        # This block will be skipped on Render if the environment variable is set
        try:
            cred = credentials.Certificate("serviceAccountKey.json")
        except FileNotFoundError:
            print("serviceAccountKey.json not found, and FIREBASE_ADMIN_SDK_CONFIG env var is not set.")
            print("Firebase Admin SDK will not be initialized.")
            cred = None # Or handle this error appropriately

    if cred:
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Admin SDK initialized successfully.")
    else:
        db = None # Ensure db is None if not initialized
        print("Firebase Admin SDK not initialized. Firestore operations will be unavailable.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
    # Exit or handle the error appropriately if Firestore is critical


# Email configuration (replace with environment variables in production)
EMAIL_ADDRESS = os.getenv('EMAIL_USER') or "57ds2324@rkgit.edu.in"
EMAIL_PASSWORD = os.getenv('EMAIL_PASS') or "mlzy tedn ubqk xrgr"
SMTP_SERVER = os.getenv('SMTP_HOST') or "smtp.gmail.com" # Example for Gmail
SMTP_PORT = int(os.getenv('SMTP_PORT') or 587)

# Removed samplePosts as they will be fetched from Firestore

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    if not user_input:
        return jsonify({'error': 'No message provided'}), 400

    response = chatbot_instance.get_response(user_input)
    return jsonify({'response': response})
    
@app.route("/")
def home():
    return "✅ Manobal API is running! Try POST /chat with JSON { 'message': 'hi' }"


@app.route('/confirm_booking', methods=['POST'])
def confirm_booking():
    booking_details = request.json
    user_email = booking_details.get('userEmail')

    if not user_email:
        print("Error: User email not provided for booking confirmation")
        return jsonify({'error': 'User email not provided for booking confirmation'}), 400

    therapist_name = booking_details.get('therapistName', 'N/A')
    session_type = booking_details.get('sessionType', 'N/A')
    date = booking_details.get('date', 'N/A')
    time = booking_details.get('time', 'N/A')
    duration = booking_details.get('duration', 'N/A')
    price = booking_details.get('price', 'N/A')
    user_name = booking_details.get('userName', 'Client')

    subject = "Manobal: Your Therapy Session Booking Confirmation"
    body = f"""
    Dear {user_name},

    Your therapy session has been successfully booked with Manobal!

    Here are your session details:
    Therapist: {therapist_name}
    Session Type: {session_type}
    Date: {date}
    Time: {time}
    Duration: {duration}
    Total: ${price}

    We look forward to supporting you on your journey to mental wellness.

    Best regards,
    The Manobal Team
    """
    
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = user_email

    print(f"Attempting to send email from {EMAIL_ADDRESS} to {user_email} via {SMTP_SERVER}:{SMTP_PORT}")

    try:
        # Generate a mock booking ID
        mock_booking_id = "booking_" + str(hash(f"{user_email}_{therapist_name}_{date}_{time}"))
        
        # Add booking details to Firestore (synchronously)
        if 'db' in globals(): # Ensure db is initialized
            booking_doc_ref = db.collection('bookings').document(mock_booking_id)
            try:
                booking_doc_ref.set({
                    **booking_details, # Spread existing booking details
                    "bookingId": mock_booking_id, # Ensure bookingId is stored
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now(),
                    "hasRated": False, # Initial state for rating system
                    "ratingId": None,
                    "ratingReminderSent": False,
                    "lastReminderDate": None,
                })
                print(f"Firestore: Successfully created booking document {mock_booking_id}.")
            except Exception as firestore_error:
                print(f"Firestore Error: Failed to create booking document {mock_booking_id}. Error: {firestore_error}")
                # Re-raise the error or handle it as appropriate
                raise firestore_error # Re-raise to ensure the HTTP 500 is sent back to the client if Firestore fails
        else:
            print("Firestore DB not initialized. Booking not saved to Firestore.")
            return jsonify({'error': 'Backend Firestore not initialized. Booking not saved.'}), 500 # Return error to client

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls() # Enable TLS encryption
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"Confirmation email sent successfully to {user_email}")
        
        return jsonify({'message': 'Booking confirmed and email sent', 'bookingId': mock_booking_id}), 200
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: Failed to log in to the SMTP server. Check EMAIL_ADDRESS and EMAIL_PASSWORD. Error: {e}")
        return jsonify({'error': f'Failed to send confirmation email (authentication error): {e}'}), 500
    except smtplib.SMTPServerDisconnected as e:
        print(f"SMTP Server Disconnected: The SMTP server unexpectedly disconnected. Check SMTP_SERVER and SMTP_PORT. Error: {e}")
        return jsonify({'error': f'Failed to send confirmation email (server disconnected): {e}'}), 500
    except Exception as e:
        print(f"An unexpected error occurred while sending email to {user_email}: {e}")
        return jsonify({'error': f'Failed to send confirmation email: {e}'}), 500

def main():
    print("Starting Flask server...")
    # Start the scheduler when the application starts
    # scheduler.start()
    # print("Scheduler started.")

    # Ensure environment variables are loaded if running directly
    # For production, use a tool like 'dotenv' or set system-wide variables
    if not all([EMAIL_ADDRESS != "your_email@example.com", EMAIL_PASSWORD != "your_email_password"]):
        print("WARNING: Email credentials are not configured. Emails will not be sent.")
        print("Please set EMAIL_USER, EMAIL_PASS, SMTP_HOST, and SMTP_PORT environment variables.")
        print("For Gmail, you might need an App Password: https://support.google.com/accounts/answer/185833")

    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)

if __name__ == "__main__":
    main()
