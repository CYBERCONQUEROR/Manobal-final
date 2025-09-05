# utils.py
import random

def generate_self_care_tip():
    tips = [
        "Remember to take short breaks throughout your study sessions.",
        "Stay hydrated by drinking plenty of water.",
        "Get at least 7-8 hours of sleep per night.",
        "Practice deep breathing exercises for a few minutes each day.",
        "Spend some time in nature to clear your mind."
    ]
    return random.choice(tips)

def get_health_info(topic):
    health_info_data = {
        "stress": "Stress is your body's reaction to a challenge or demand. It can be positive (e.g., meeting a deadline) or negative (e.g., chronic overwork). Symptoms include fatigue, headaches, irritability, and difficulty concentrating.",
        "sleep": "Adequate sleep is crucial for physical and mental health. Most adults need 7-9 hours of sleep per night. Poor sleep can lead to mood swings, decreased cognitive function, and weakened immunity.",
        "anxiety": "Anxiety is a feeling of worry, nervousness, or unease, typically about an event or something with an uncertain outcome. Symptoms include restlessness, fatigue, difficulty concentrating, and muscle tension.",
        "lifestyle": "A healthy lifestyle involves balanced nutrition, regular physical activity, sufficient sleep, and stress management. These factors significantly impact your overall well-being."
    }
    return health_info_data.get(topic.lower(), "I don't have specific information on that topic, but I can provide general health information on stress, sleep, anxiety, and lifestyle.")

def get_professional_help_resources(type_of_help):
    resources = {
        "counselor": "You can find counselors at your university's \'Student Counseling Center\' or through local mental health services.",
        "psychologist": "Licensed psychologists can be found through national psychological associations or by asking for a referral from a general practitioner.",
        "doctor": "For any physical symptoms related to stress or anxiety, please consult your general practitioner or a family doctor.",
        "helpline": "For immediate support, consider contacting a mental health helpline such as the National Suicide Prevention Lifeline (1-800-273-8255) or Crisis Text Line (text HOME to 741741)."
    }
    return resources.get(type_of_help.lower(), "I can direct you to resources for counselors, psychologists, doctors, or helplines. Which one are you interested in?")

def get_relaxation_exercise(exercise_type):
    exercises = {
        "breathing": "Try the 4-7-8 breathing technique: Breathe in for 4 counts, hold for 7, and exhale for 8. Repeat a few times.",
        "mindfulness": "Find a quiet spot, focus on your breath, and observe any thoughts or sensations without judgment. Let them pass like clouds in the sky."
    }
    return exercises.get(exercise_type.lower(), "I can guide you through breathing exercises or mindfulness exercises. Which would you prefer?")

def get_coping_strategy(issue):
    strategies = {
        "exam stress": "Break down your study material into smaller, manageable chunks. Take regular breaks and reward yourself for progress. Remember to prioritize sleep and nutrition.",
        "loneliness": "Reach out to a friend or family member. Join a club or a group with shared interests. Volunteering can also help you connect with others and find purpose.",
        "anxiety": "Practice grounding techniques like identifying 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.",
        "general": "Engage in hobbies, exercise regularly, maintain a healthy diet, and ensure you get enough sleep. Talking to a trusted person can also be very helpful."
    }
    return strategies.get(issue.lower(), "I can offer coping strategies for exam stress, loneliness, or general anxiety. What specific challenge are you facing?")

def get_motivational_message():
    messages = [
        "Every small step forward is still a step forward. Keep going!",
        "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
        "Your potential is endless. Don't be afraid to take on new challenges and grow.",
        "The best way to predict the future is to create it."
    ]
    return random.choice(messages)
