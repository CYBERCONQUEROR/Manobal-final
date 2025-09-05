# # chatbot.py

# import os
# import google.generativeai as genai

# class Chatbot:
#     def __init__(self):
#         # Load Cohere API key from env variable or fallback
#         API_KEY = os.getenv("COHERE_API_KEY") or "9oL7Pglo1bBdWptAP2TaWC5kbbB5P6XjKxp6snHZ"
#         genai.configure(api_key=API_KEY)

#         # ✅ System prompt: Medical Assistant + Psychologist
#         self.system_prompt = """
#         You are Manobal, a compassionate mental health companion for students.
#         Your role combines:
#         - A **Medical Assistant**: provide safe, general health information on stress, sleep, anxiety, and lifestyle.
#         - A **Psychologist/Therapist**: listen empathetically, guide coping strategies, mindfulness, and motivational support.

#         Guidelines:
#         - Always be warm, supportive, and non-judgmental.
#         - Provide self-care suggestions, healthy routines, and emotional guidance.
#         - Encourage professional help when needed (counselor, doctor, helplines).
#         - If the student expresses harmful thoughts (suicidal or self-harm), immediately show a crisis response with helpline numbers.
#         - Never replace professional medical or psychological treatment.

#         You are speaking to a student who may be stressed, anxious, or seeking support. Respond in short, clear, caring messages.
#         """

#         # Crisis response
#         self.crisis_message = (
#             "⚠️ I hear that you’re going through something very painful right now.\n\n"
#             "👉 You are not alone. If you are in immediate danger, please call your local emergency number.\n\n"
#             "Here are some helplines:\n"
#             "📞 India: AASRA – 91-22-27546669 or 1800-599-0019\n"
#             "📞 USA: 988 (Suicide & Crisis Lifeline)\n"
#             "📞 UK: Samaritans – 116 123\n\n"
#             "💙 Please reach out to someone who can support you immediately. Your life matters."
#         )

#         # Crisis keywords
#         self.crisis_keywords = [
#             "suicide", "kill myself", "end my life", "self harm", "hurt myself"
#         ]

#         # Load model
#         self.model = genai.GenerativeModel("gemini-1.5-flash")

#     def get_response(self, user_input: str) -> str:
#         user_input_lower = user_input.lower()

#         # Crisis detection
#         if any(word in user_input_lower for word in self.crisis_keywords):
#             return self.crisis_message

#         try:
#             response = self.model.generate_content([self.system_prompt, user_input])
#             return response.text.strip()
#         except Exception as e:
#             return f"⚠️ Sorry, something went wrong: {str(e)}"



# chatbot.py

import os
import cohere

class Chatbot:
    def __init__(self):
        API_KEY = os.getenv("COHERE_API_KEY") 
        self.co = cohere.Client(API_KEY)

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

        # Crisis keywords for detection
        self.crisis_keywords = [
            "suicide", "kill myself", "end my life", "self harm", "hurt myself",
            "i want to die", "i want to end it", "i can't go on",
            "आत्महत्या", "मैं मरना चाहता हूँ", "自殺", "自分を殺す", "me quiero morir", "vou me matar"
        ]

    def get_response(self, user_input: str) -> str:
        user_input_lower = user_input.lower()

        # 🚨 Crisis detection
        if any(word in user_input_lower for word in self.crisis_keywords):
            return self.crisis_message

        try:
            # Use Cohere chat endpoint with multilingual support
            response = self.co.chat(
                model="command-r-plus",
                message=user_input,
                preamble=self.system_prompt
            )
            return response.text.strip()
        except Exception as e:
            return f"⚠️ Sorry, something went wrong with the AI: {str(e)}"
