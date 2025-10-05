# chatbot.py

import os
import cohere
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS

from dotenv import load_dotenv
import re # Import re for regex operations
import requests
import PyPDF2
import io
from bs4 import BeautifulSoup # Import BeautifulSoup
import google.generativeai as genai
load_dotenv() # Load environment variables from .env file

app = Flask(__name__)
CORS(app) # Enable CORS for all routes


# YouTube Data API configuration lines removed as requested
# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
# YOUTUBE_API_SERVICE_NAME = "youtube"
# YOUTUBE_API_VERSION = "v3"

# Initialize YouTube API client outside of the request to avoid re-initialization
# youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=YOUTUBE_API_KEY)

class Chatbot:
    def __init__(self):
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=GEMINI_API_KEY)

        # Initialize Gemini model
        self.model = genai.GenerativeModel("gemini-2.5-flash-lite")  # or gemini-1.5-pro for better reasoning

        # Initialize conversation state
        self.conversation_state = {"state": "idle", "selected_college_id": None}

        # System role prompt with multilingual support
        self.system_prompt = """
        You are Manobal, a compassionate mental health companion for students. 
        Your role combines:
        - A **Medical Assistant**: provide safe, general health information on stress, sleep, anxiety, and lifestyle.
        - A **Psychologist/Therapist**: listen empathetically, guide coping strategies, mindfulness, and motivational support.

        Guidelines:
        - Always be warm, supportive, and non-judgmental.
        - Provide self-care suggestions, healthy routines, and emotional guidance.
        - Encourage professional help when needed (counselor, doctor, helplines).
        - If the student expresses harmful thoughts (suicidal or self-harm), immediately show a crisis response with helpline numbers.
        - Never replace professional medical or psychological treatment.

        🌍 Multilingual rule:
        - Always detect the language of the student.
        - Reply in the **same language** they used (example: if the student writes in Hindi, reply in Hindi).
        - Keep messages short, clear, and caring.
        """

        # Crisis response message (only in English for clarity)
        self.crisis_message = (
            "⚠️ I hear that you’re going through something very painful right now.\n\n"
            "👉 You are not alone. If you are in immediate danger, please call your local emergency number.\n\n"
            "Here are some helplines:\n"
            "📞 India: AASRA – 91-22-27546669 or 1800-599-0019\n"
            "📞 USA: 988 (Suicide & Crisis Lifeline)\n"
            "📞 UK: Samaritans – 116 123\n\n"
            "💙 Please reach out to someone who can support you immediately. Your life matters."
        )

        # Crisis keywords
        self.crisis_keywords = [
            "suicide", "kill myself", "end my life", "self harm", "hurt myself",
            "i want to die", "i want to end it", "i can't go on",
            "आत्महत्या", "मैं मरना चाहता हूँ", "自殺", "自分を殺す", "me quiero morir", "vou me matar"
        ]

        self.forbidden_keywords = [
            "porn", "sex", "nude", "erotic", "explicit", "adult content",
            "drug", "alcohol abuse", "illegal", "violence", "hate speech",
            "gore", "discrimination", "harassment", "spam", "scam"
        ]

    def get_response(self, user_input: str) -> str:
        user_input_lower = user_input.lower()

        # 🚨 Crisis detection
        if any(word in user_input_lower for word in self.crisis_keywords):
            return self.crisis_message

        # Handle counsellor/doctor selection flow
        if self.conversation_state["state"] == "idle":
            if "counsellor" in user_input_lower:
                self.conversation_state["state"] = "selecting_counsellor_college"
                return self._get_colleges_list_message()
            elif "doctor" in user_input_lower:
                self.conversation_state["state"] = "selecting_doctor"
                return self._get_doctors_list_message()
        elif self.conversation_state["state"] == "selecting_counsellor_college":
            selected_college = next((c for c in DUMMY_COLLEGES if user_input_lower in c['name'].lower()), None)
            if selected_college:
                self.conversation_state["selected_college_id"] = selected_college['id']
                self.conversation_state["state"] = "selecting_counsellor"
                return self._get_counsellors_list_message(selected_college['id'])
            else:
                return "I couldn't find that college. Please try again or select from the list: " + self._get_colleges_list_message()
        elif self.conversation_state["state"] == "selecting_counsellor":
            self.conversation_state = {"state": "idle", "selected_college_id": None}
            return "Thank you for selecting a counsellor. I'll connect you with them shortly."
        elif self.conversation_state["state"] == "selecting_doctor":
            self.conversation_state = {"state": "idle", "selected_college_id": None}
            return "Thank you for selecting a doctor. I'll connect you with them shortly."

        # Reset state if conversation diverts
        self.conversation_state = {"state": "idle", "selected_college_id": None}

        try:
            # 💬 Use Gemini instead of Cohere
            prompt = f"{self.system_prompt}\n\nUser: {user_input}\nAssistant:"
            response = self.model.generate_content(prompt)
            return response.text.strip() if response.text else "⚠️ Sorry, I couldn't generate a response right now."
        except Exception as e:
            return f"⚠️ Sorry, something went wrong with the AI: {str(e)}"

    def _get_colleges_list_message(self) -> str:
        colleges_names = [college['name'] for college in DUMMY_COLLEGES]
        return "Please select your college from the following: " + ", ".join(colleges_names) + ". You can type the full name or part of it."

    def _get_counsellors_list_message(self, college_id: str) -> str:
        filtered_counsellors = [c for c in DUMMY_COUNSELLORS if c['collegeId'] == college_id]
        if not filtered_counsellors:
            return "No counsellors found for your college. Please choose another college or type 'Counsellor' to restart."
        counsellor_names = [c['name'] + f" (Specialty: {c['specialty']})" for c in filtered_counsellors]
        return f"Here are the counsellors available at {next(c['name'] for c in DUMMY_COLLEGES if c['id'] == college_id)}: " + "; ".join(counsellor_names) + ". Please type the name of the counsellor you'd like to choose."

    def _get_doctors_list_message(self) -> str:
        doctor_names = [d['name'] + f" (Specialty: {d['specialty']})" for d in DUMMY_DOCTORS]
        return "Here are our available doctors: " + "; ".join(doctor_names) + ". Please type the name of the doctor you'd like to choose."


def contains_forbidden_keywords(text: str, forbidden_keywords: list[str]) -> bool:
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in forbidden_keywords)

# @app.route('/fetch_youtube_metadata', methods=['POST'])
# def fetch_youtube_metadata():
#     data = request.get_json()
#     youtube_url = data.get('youtube_url')

#     if not youtube_url:
#         return jsonify({"error": "Missing youtube_url"}), 400

#     video_id = None
#     # Extract video ID from various YouTube URL formats
#     if "youtube.com/watch?v=" in youtube_url:
#         video_id = youtube_url.split("v=")[1].split("&")[0]
#     elif "youtu.be/" in youtube_url:
#         video_id = youtube_url.split("youtu.be/")[1].split("&")[0]

#     if not video_id:
#         return jsonify({"error": "Invalid YouTube URL"}), 400

#     try:
#         request = youtube.videos().list(
#             part="snippet,contentDetails,statistics",
#             id=video_id
#         )
#         response = request.execute()

#         if not response['items']:
#             return jsonify({"error": "YouTube video not found"}), 404

#         video = response['items'][0]
#         snippet = video['snippet']
#         content_details = video['contentDetails']
#         statistics = video['statistics']

#         # Parse ISO 8601 duration to seconds
#         duration_iso = content_details['duration']
#         # Example: PT1H30M15S -> 1 hour 30 minutes 15 seconds
#         hours = re.search(r'(\d+)H', duration_iso)
#         minutes = re.search(r'(\d+)M', duration_iso)
#         seconds = re.search(r'(\d+)S', duration_iso)

#         total_seconds = (int(hours.group(1)) * 3600 if hours else 0) + \
#                       (int(minutes.group(1)) * 60 if minutes else 0) + \
#                       (int(seconds.group(1)) if seconds else 0)

#         video_description = snippet.get('description', '')
#         if Chatbot().contains_forbidden_keywords(video_description, Chatbot().forbidden_keywords):
#             return jsonify({"error": "YouTube video description contains inappropriate content."}), 400

#         metadata = {
#             "title": snippet['title'],
#             "thumbnail": snippet['thumbnails']['high']['url'] if 'high' in snippet['thumbnails'] else snippet['thumbnails']['default']['url'],
#             "duration": total_seconds,
#             "viewCount": int(statistics['viewCount']) if 'viewCount' in statistics else 0,
#             "uploadDate": snippet['publishedAt'], # ISO 8601 string
#             "description": video_description
#         }
#         return jsonify(metadata), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route("/check-key")
def check_key():
    import os
    key = os.getenv("GEMINI_API_KEY")
    return {"key_loaded": bool(key), "first_chars": key[:5] if key else None}


@app.route('/fetch_pdf_metadata', methods=['POST'])
def fetch_pdf_metadata():
    data = request.get_json()
    pdf_url = data.get('pdf_url')

    if not pdf_url or not pdf_url.endswith('.pdf'):
        return jsonify({"error": "Missing or invalid PDF URL"}), 400

    try:
        response = requests.get(pdf_url, stream=True)
        response.raise_for_status() # Raise an exception for HTTP errors

        # Read PDF content from the response stream
        pdf_file = io.BytesIO(response.content)
        reader = PyPDF2.PdfReader(pdf_file)
        
        pdf_info = reader.metadata

        metadata = {
            "title": pdf_info.get('/Title', 'No Title'),
            "authors": pdf_info.get('/Author', 'Unknown Author').split(', '), # Simple split, might need refinement
            "publishDate": None, # PDF metadata usually doesn't have a direct publish date
            "summary": "", # Not directly available from PyPDF2
        }

        # Attempt to find publish date from title or other fields if available
        # This is a very basic heuristic and might not always be accurate
        if "date" in metadata["title"].lower():
            date_match = re.search(r'\b(19|20)\d{2}\b', metadata["title"])
            if date_match: 
                metadata["publishDate"] = date_match.group(0)
        
        # Extract text from first page for a potential abstract/summary
        # This is a very rudimentary approach and needs significant improvement for actual abstract extraction
        if len(reader.pages) > 0:
            first_page_text = reader.pages[0].extract_text()
            # Heuristic: Take the first few sentences as a summary
            sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', first_page_text)
            pdf_summary = " ".join(sentences[:3]) if sentences else ""
            
            if contains_forbidden_keywords(pdf_summary, Chatbot().forbidden_keywords):
                return jsonify({"error": "PDF summary contains inappropriate content."}), 400
            metadata["summary"] = pdf_summary
            

        return jsonify(metadata), 200

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to download PDF: {str(e)}"}), 500
    except PyPDF2.errors.PdfReadError:
        return jsonify({"error": "Invalid PDF file or corrupted content."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/fetch_article_metadata', methods=['POST'])
def fetch_article_metadata():
    data = request.get_json()
    article_url = data.get('article_url')

    if not article_url:
        return jsonify({"error": "Missing article_url"}), 400

    try:
        response = requests.get(article_url, timeout=10) # Add a timeout
        response.raise_for_status() # Raise an exception for HTTP errors

        soup = BeautifulSoup(response.content, 'html.parser')

        title = soup.find('meta', property="og:title") or soup.find('meta', attrs={'name': 'title'})
        title = title['content'] if title else soup.title.string if soup.title else "No Title"

        description = soup.find('meta', property="og:description") or soup.find('meta', attrs={'name': 'description'})
        description = description['content'] if description else "No Description"

        image = soup.find('meta', property="og:image")
        image_url = image['content'] if image else None

        # Basic content extraction (can be improved with libraries like `newspaper3k`)
        paragraphs = soup.find_all('p')
        article_text = '\n'.join([p.get_text() for p in paragraphs])
        summary = article_text[:500] + "..." if len(article_text) > 500 else article_text # Simple summary

        if contains_forbidden_keywords(summary, Chatbot().forbidden_keywords):
            return jsonify({"error": "Article summary contains inappropriate content."}), 400

        metadata = {
            "title": title,
            "description": description,
            "thumbnail": image_url,
            "summary": summary,
            "publishDate": None, # Needs more advanced parsing
            "authors": [], # Needs more advanced parsing
        }

        return jsonify(metadata), 200

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch article: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/submit_rating_comment', methods=['POST'])
def submit_rating_comment():
    data = request.get_json()
    comment = data.get('comment', '')

    if not comment:
        return jsonify({"error": "Comment is empty"}), 400

    if contains_forbidden_keywords(comment, Chatbot().forbidden_keywords):
        return jsonify({"error": "Comment contains inappropriate content."}), 400
    
    return jsonify({"message": "Comment is acceptable."}), 200

@app.route('/get_colleges', methods=['GET'])
def get_colleges():
    return jsonify(DUMMY_COLLEGES)

@app.route('/get_counsellors/<college_id>', methods=['GET'])
def get_counsellors(college_id):
    filtered_counsellors = [c for c in DUMMY_COUNSELLORS if c['collegeId'] == college_id]
    return jsonify(filtered_counsellors)

@app.route('/get_doctors', methods=['GET'])
def get_doctors():
    return jsonify(DUMMY_DOCTORS)

# The chatbot instance should be created and used separately if this file is imported as a module.
# For running the Flask app, we'll keep the __main__ block.
if __name__ == '__main__':
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
