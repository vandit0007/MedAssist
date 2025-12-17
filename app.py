from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Medical Knowledge Base (example)
medical_knowledge_base = {
    "cardiology": {
        "symptoms": ["chest pain", "heart palpitations", "shortness of breath"],
        "description": "Heart and cardiovascular system conditions",
        "common_conditions": ["Heart disease", "Arrhythmia"]
    },
    # Add more departments as needed
}

class MedicalChatbot:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        self.symptoms_data = []
        self.departments = []
        self._build_knowledge_base()

    def _build_knowledge_base(self):
        for dept, info in medical_knowledge_base.items():
            for symptom in info["symptoms"]:
                self.symptoms_data.append(symptom)
                self.departments.append(dept)
        if self.symptoms_data:
            self.vectorizer.fit(self.symptoms_data)

    def _extract_symptoms(self, user_input):
        symptoms = []
        user_input_lower = user_input.lower()
        patterns = [
            r"i have (.*?)(?:\.|$|,)",
            r"experiencing (.*?)(?:\.|$|,)",
            r"suffering from (.*?)(?:\.|$|,)",
            r"feeling (.*?)(?:\.|$|,)",
            r"my (.*?) (?:hurts|hurt|is|are) (.*?)(?:\.|$|,)",
            r"pain in (.*?)(?:\.|$|,)",
            r"problems with (.*?)(?:\.|$|,)"
        ]
        for pattern in patterns:
            matches = re.findall(pattern, user_input_lower)
            symptoms.extend(matches)
        for symptom in self.symptoms_data:
            if symptom in user_input_lower:
                symptoms.append(symptom)
        return list(set(symptoms))

    def _find_best_department(self, symptoms):
        if not symptoms or not self.symptoms_data:
            return None, 0
        symptoms_text = " ".join(symptoms)
        input_vector = self.vectorizer.transform([symptoms_text])
        symptom_vectors = self.vectorizer.transform(self.symptoms_data)
        similarities = cosine_similarity(input_vector, symptom_vectors)[0]
        dept_scores = {}
        for i, dept in enumerate(self.departments):
            if dept not in dept_scores:
                dept_scores[dept] = []
            dept_scores[dept].append(similarities[i])
        avg_scores = {}
        for dept, scores in dept_scores.items():
            avg_scores[dept] = np.mean(scores)
        best_dept = max(avg_scores, key=avg_scores.get)
        confidence = avg_scores[best_dept]
        return best_dept, confidence

    def process_message(self, user_input):
        symptoms = self._extract_symptoms(user_input)
        if not symptoms:
            return {
                "department": None,
                "confidence": 0,
                "follow_up": [],
                "message": "Please describe your symptoms in more detail."
            }
        best_dept, confidence = self._find_best_department(symptoms)
        if confidence > 0.1:
            dept_info = medical_knowledge_base[best_dept]
            follow_up_questions = [
                "Do you experience chest pain during physical activity?",
                "Have you noticed any irregular heartbeat?",
                "Do you have any family history of heart disease?"
            ]
            return {
                "department": best_dept,
                "confidence": confidence,
                "follow_up": follow_up_questions,
                "message": f"Recommended department: {best_dept.upper()}"
            }
        else:
            return {
                "department": None,
                "confidence": 0,
                "follow_up": [],
                "message": "Could not find a strong match. Consult a general practitioner."
            }

chatbot = MedicalChatbot()

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('symptoms', '')
        if not isinstance(user_input, str):
            return jsonify({"error": "Symptoms must be a string"}), 400
        response = chatbot.process_message(user_input)
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=8000, debug=True)
