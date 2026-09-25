import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import "./App.css";

const SAMPLE_SYMPTOMS = [
  "I have a throbbing headache, light sensitivity, and nausea",
  "Itchy red skin rash with dry scaly patches on elbows",
  "Severe chest pain radiating to left arm and cold sweat",
  "Acid reflux, heartburn, and burning sensation after meals",
  "Severe knee pain, morning joint stiffness, and swelling",
  "Facial sinus pressure, blocked nose, and thick nasal discharge"
];

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am MedAssist, your medical symptom triage assistant. Describe any symptoms you are experiencing, and I will recommend the appropriate medical specialty and care guidance.",
      details: null
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    // Fetch dataset stats
    axios.get('http://127.0.0.1:8000/api/stats')
      .then(res => setStats(res.data))
      .catch(err => console.log('Could not fetch dataset stats:', err));
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = { sender: "user", text: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat', { symptoms: query.trim() });
      const data = response.data;
      
      const botMessage = {
        sender: "bot",
        text: data.message,
        details: {
          department: data.department,
          condition: data.condition,
          confidence: data.confidence,
          description: data.description,
          follow_up: data.follow_up || [],
          precautions: data.precautions || [],
          severity: data.severity || "Unknown"
        }
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error communicating with backend:', error);
      const botMessage = {
        sender: "bot",
        text: "Error: Unable to connect to the medical assistant service. Please check if the backend is running.",
        details: null
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleFollowUpClick = (question) => {
    sendMessage(`In response to "${question}": Yes, I am experiencing this.`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="title-area">
            <h1>🏥 MedAssist</h1>
            <span className="badge-dataset">
              {stats ? `Dataset Active: ${stats.total_conditions} Conditions across ${stats.total_departments} Specialties` : "Dataset Loaded"}
            </span>
          </div>
          <p className="subtitle">Dataset-Driven Symptom Triage & Specialist Guidance</p>
        </div>

        <div className="emergency-disclaimer">
          ⚠️ <strong>Medical Disclaimer:</strong> MedAssist provides automated triage support based on indexed clinical data. In case of life-threatening emergencies, call emergency services (911/112) immediately.
        </div>

        {/* Quick test pills */}
        <div className="sample-pills-container">
          <span className="pills-label">Quick Test Symptoms:</span>
          <div className="pills-scroll">
            {SAMPLE_SYMPTOMS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="sample-pill"
                onClick={() => sendMessage(sample)}
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="chat-container">
        <div className="chat-window">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            const details = msg.details;
            const isEmergency = details?.severity === "Emergency";

            return (
              <div
                key={idx}
                className={`chat-message-wrapper ${isUser ? "user-wrapper" : "bot-wrapper"}`}
              >
                <div className={`chat-message ${isUser ? "user" : "bot"} ${isEmergency ? "emergency-card" : ""}`}>
                  {/* Sender Label */}
                  <div className="message-header">
                    <strong>{isUser ? "You" : "🤖 MedAssist AI"}</strong>
                  </div>

                  {/* Main text */}
                  <div className="message-body" style={{ whiteSpace: "pre-line" }}>
                    {msg.text}
                  </div>

                  {/* Structured Clinical Details */}
                  {details && details.department && (
                    <div className="clinical-card">
                      <div className="clinical-header">
                        <span className={`severity-tag severity-${details.severity.toLowerCase()}`}>
                          {details.severity} Priority
                        </span>
                        {details.confidence > 0 && (
                          <span className="confidence-pill">
                            Confidence: {Math.round(details.confidence * 100)}%
                          </span>
                        )}
                      </div>

                      {details.condition && (
                        <div className="clinical-row">
                          <span className="label">Specialty:</span>
                          <span className="value-dept">{details.department}</span>
                        </div>
                      )}

                      {/* Precautions list */}
                      {details.precautions && details.precautions.length > 0 && (
                        <div className="precautions-section">
                          <strong>Recommended Actions / Precautions:</strong>
                          <ul>
                            {details.precautions.map((p, pIdx) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Interactive follow-up questions */}
                      {details.follow_up && details.follow_up.length > 0 && (
                        <div className="followup-section">
                          <strong>Suggested Follow-up Questions:</strong>
                          <div className="followup-chips">
                            {details.follow_up.map((q, qIdx) => (
                              <button
                                key={qIdx}
                                type="button"
                                className="followup-chip"
                                onClick={() => handleFollowUpClick(q)}
                              >
                                👉 "{q}"
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="chat-message-wrapper bot-wrapper">
              <div className="chat-message bot typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="typing-text">Analyzing symptoms across medical dataset...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type your symptoms here (e.g. 'sharp headache, blurry vision, feeling dizzy')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send ➜
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
