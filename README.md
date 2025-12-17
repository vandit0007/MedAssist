MedAssist – Medical Symptom Triage Chatbot
MedAssist is a web application that helps users describe their symptoms in natural language and recommends a suitable hospital department using an AI-powered chatbot.
The project uses a React frontend and a Flask backend with basic NLP (TF‑IDF + cosine similarity).

Features
Chat-style interface to enter symptoms in plain English.

Extracts key symptoms from user input.

Maps symptoms to hospital departments (e.g., Cardiology).

Returns:

Recommended department

Confidence score

Follow-up questions for better triage

CORS-enabled API for smooth React ↔ Flask communication.

Tech Stack
Frontend: React, JavaScript, CSS

Backend: Flask (Python)

ML / NLP:

scikit-learn (TfidfVectorizer, cosine_similarity)

numpy, pandas

Others: flask-cors for CORS handling

Project Structure
Adjust this if your folders are named differently.

text
MedAssist/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── (other Python modules)
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   ├── logo192.jpg
│   │   └── logo512.jpg
│   ├── package.json
│   └── README.md (this file)
└── MedAssist-1.ipynb (optional notebook)
If you are not using separate backend/ and frontend/ folders, update this section to match your actual layout.

Backend Setup (Flask)
Create and activate a virtual environment (recommended):

bash
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS / Linux
Install dependencies:

bash
pip install -r requirements.txt
Example requirements.txt (edit if needed):

text
Flask
flask-cors
numpy
pandas
scikit-learn
Run the Flask server:

bash
python app.py
By default the API will be available at:

http://127.0.0.1:8000/api/chat

Frontend Setup (React)
Install Node.js (if not already installed).

Inside the React project folder (where package.json is):

bash
npm install
npm start
The React app will usually run at:

http://localhost:3000

Ensure your Axios/fetch calls in App.js point to the Flask URL, for example:

js
axios.post("http://127.0.0.1:8000/api/chat", { symptoms: userInput })
API Endpoint
POST /api/chat
Request body (JSON):

json
{
  "symptoms": "I have chest pain and shortness of breath"
}
Successful response example:

json
{
  "department": "cardiology",
  "confidence": 0.87,
  "follow_up": [
    "Do you experience chest pain during physical activity?",
    "Have you noticed any irregular heartbeat?",
    "Do you have any family history of heart disease?"
  ],
  "message": "Recommended department: CARDIOLOGY"
}
If no good match is found, the API returns a message suggesting a general practitioner.

How It Works (Logic Overview)
A small medical knowledge base defines departments and related symptoms.

TF‑IDF vectorization converts symptom text into numeric vectors.

Cosine similarity is used to compare user-described symptoms with known symptoms.

Average similarity per department is computed to select the best match.

A confidence threshold decides whether to recommend a department or fall back to a generic suggestion.

Running Both Frontend and Backend
Start Flask backend:

bash
python app.py
Start React frontend:

bash
npm start
Open the React app in your browser and interact with the chatbot.
The frontend sends POST requests to http://127.0.0.1:8000/api/chat.

Future Improvements
Expand the medical knowledge base with more departments and symptoms.

Add multilingual support for symptom descriptions.

Integrate a real medical ontology or external API.

Add authentication for doctors/admins to edit the knowledge base.

Deploy both frontend and backend to cloud platforms.
