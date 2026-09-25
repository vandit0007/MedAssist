from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import os
import warnings

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'medical_triage_dataset.csv')

# Critical emergency symptoms requiring immediate medical intervention
EMERGENCY_RED_FLAGS = [
    r"crushing chest pain",
    r"chest pain.*(left arm|jaw|sweat)",
    r"face drooping",
    r"slurred speech",
    r"sudden numbness",
    r"loss of consciousness",
    r"unconscious",
    r"cannot breathe",
    r"severe difficulty breathing",
    r"coughing (up )?blood",
    r"anaphylaxis|throat closing"
]

class MedicalChatbot:
    def __init__(self, data_file=DATA_PATH):
        self.data_file = data_file
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True, ngram_range=(1, 2))
        self.df = None
        self.corpus = []
        self.symptom_vocab = set()
        self.load_dataset()

    def load_dataset(self):
        """Loads and indexes the medical dataset from CSV."""
        if not os.path.exists(self.data_file):
            raise FileNotFoundError(f"Dataset not found at {self.data_file}")

        self.df = pd.read_csv(self.data_file)
        self.df.fillna('', inplace=True)

        # Build corpus combining symptoms and condition descriptions
        self.corpus = []
        self.symptom_vocab = set()

        for _, row in self.df.iterrows():
            # Parse individual symptoms for vocabulary
            raw_symptoms = [s.strip().lower() for s in row['symptoms'].split(',') if s.strip()]
            self.symptom_vocab.update(raw_symptoms)

            # Combined representation for vectorizer
            combined_text = f"{row['condition']} {row['symptoms']} {row['description']}".lower()
            self.corpus.append(combined_text)

        # Fit TF-IDF on corpus
        if self.corpus:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)
        else:
            self.tfidf_matrix = None

    def _check_emergency(self, text):
        """Checks if input matches critical emergency red flags."""
        text_lower = text.lower()
        for pattern in EMERGENCY_RED_FLAGS:
            if re.search(pattern, text_lower):
                return True
        return False

    def _extract_symptoms(self, user_input):
        """Extracts recognizable medical symptoms from natural text."""
        matched_symptoms = []
        user_input_lower = user_input.lower()

        # Direct vocabulary matching
        for symptom in self.symptom_vocab:
            if symptom in user_input_lower:
                matched_symptoms.append(symptom)

        # Common phrase matching regex patterns
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
            for match in re.findall(pattern, user_input_lower):
                clean_match = match.strip() if isinstance(match, str) else " ".join(match).strip()
                if clean_match and len(clean_match) > 2:
                    matched_symptoms.append(clean_match)

        return list(set(matched_symptoms))

    def process_message(self, user_input):
        if not user_input or not isinstance(user_input, str):
            return {
                "department": None,
                "condition": None,
                "confidence": 0,
                "follow_up": [],
                "precautions": [],
                "severity": "Unknown",
                "message": "Please enter a description of your symptoms."
            }

        # 1. Emergency Red Flag Check
        if self._check_emergency(user_input):
            return {
                "department": "EMERGENCY MEDICINE (ER)",
                "condition": "Acute Critical Condition Warning",
                "confidence": 1.0,
                "follow_up": [
                    "Is someone with you right now?",
                    "Are you able to call emergency services?"
                ],
                "precautions": [
                    "CALL 911 / 112 OR YOUR LOCAL EMERGENCY NUMBER IMMEDIATELY",
                    "Do not drive yourself to the hospital; await an ambulance",
                    "Stay calm and sit or lie down in a safe position",
                    "Unlock your door if alone so paramedics can enter"
                ],
                "severity": "Emergency",
                "message": "⚠️ CRITICAL ALERT: Your symptoms may indicate a life-threatening medical emergency. Please call emergency services (911/112) or go to the nearest Emergency Room immediately."
            }

        # 2. Extract Symptoms
        symptoms_found = self._extract_symptoms(user_input)

        # 3. Vector Search against Dataset
        query_vector = self.vectorizer.transform([user_input.lower()])
        similarities = cosine_similarity(query_vector, self.tfidf_matrix)[0]

        best_idx = int(np.argmax(similarities))
        max_similarity = float(similarities[best_idx])

        # Confidence threshold
        if max_similarity < 0.08 and not symptoms_found:
            return {
                "department": "GENERAL MEDICINE",
                "condition": None,
                "confidence": round(max_similarity, 2),
                "follow_up": [
                    "How long have you been experiencing these symptoms?",
                    "Are your symptoms constant or do they come and go?",
                    "Do you have any existing diagnosed conditions?"
                ],
                "precautions": [
                    "Monitor symptoms and keep a diary of when they occur",
                    "Stay well hydrated and get adequate rest",
                    "Consult a General Physician for a formal medical consultation"
                ],
                "severity": "Mild",
                "message": "Could not identify a specific specialist match based on your description. We recommend consulting a General Physician for an initial evaluation."
            }

        matched_row = self.df.iloc[best_idx]
        department = str(matched_row['department']).strip()
        condition = str(matched_row['condition']).strip()
        description = str(matched_row['description']).strip()
        severity = str(matched_row['severity_level']).strip()

        # Parse follow-ups and precautions
        raw_follow_ups = str(matched_row['follow_up_questions']).split(';')
        follow_ups = [q.strip() for q in raw_follow_ups if q.strip()]

        raw_precautions = str(matched_row['precautions']).split(';')
        precautions = [p.strip() for p in raw_precautions if p.strip()]

        confidence_score = min(round(max(max_similarity, 0.45 if symptoms_found else 0.25) * 1.2, 2), 0.98)

        # Formulate comprehensive response message
        message = (
            f"Recommended Department: {department.upper()}\n"
            f"Potential Match: {condition}\n"
            f"Overview: {description}"
        )

        return {
            "department": department,
            "condition": condition,
            "confidence": confidence_score,
            "description": description,
            "follow_up": follow_ups,
            "precautions": precautions,
            "severity": severity,
            "message": message
        }

chatbot = MedicalChatbot()

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json or {}
        user_input = data.get('symptoms', '')
        if not isinstance(user_input, str):
            return jsonify({"error": "Symptoms must be a string"}), 400
        response = chatbot.process_message(user_input)
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/departments', methods=['GET'])
def get_departments():
    """Returns available medical departments in the dataset."""
    if chatbot.df is not None:
        departments = sorted(chatbot.df['department'].unique().tolist())
        return jsonify({"departments": departments})
    return jsonify({"departments": []})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Returns statistics about the loaded dataset."""
    if chatbot.df is not None:
        return jsonify({
            "total_conditions": len(chatbot.df),
            "total_departments": int(chatbot.df['department'].nunique()),
            "departments": sorted(chatbot.df['department'].unique().tolist())
        })
    return jsonify({"error": "Dataset not loaded"}), 500

if __name__ == '__main__':
    app.run(port=8000, debug=True)
