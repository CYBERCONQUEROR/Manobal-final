# main.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import Chatbot
import smtplib
from email.mime.text import MIMEText
import os


app = Flask(__name__)
CORS(app)
chatbot_instance = Chatbot()

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
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls() # Enable TLS encryption
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"Confirmation email sent successfully to {user_email}")
        return jsonify({'message': 'Booking confirmed and email sent'}), 200
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
