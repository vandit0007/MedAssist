import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import "./App.css";

const SAMPLES_EN = [
  "Throbbing headache, light sensitivity, and nausea",
  "Itchy red skin rash with dry scaly patches on elbows",
  "Severe chest pain radiating to left arm and cold sweat",
  "Acid reflux, heartburn, and burning sensation after meals",
  "Severe knee pain, morning joint stiffness, and swelling",
  "Facial sinus pressure, blocked nose, and thick nasal discharge"
];

const SAMPLES_HI = [
  "सिर में तेज़ दर्द, उल्टी जैसा लगना और रोशनी से परेशानी",
  "त्वचा पर लाल चकत्ते, दाने और बहुत तेज़ खुजली",
  "सीने में बहुत तेज़ दर्द, पसीना और बाएँ हाथ में खिंचाव",
  "खाना खाने के बाद सीने में जलन और खट्टी डकारें",
  "घुटनों में बहुत तेज़ दर्द, सूजन और सुबह जोड़ों में अकड़न",
  "नाक बंद, चेहरे और आँखों के नीचे भारीपन और सिरदर्द"
];

function App() {
  const [language, setLanguage] = useState("en"); // 'en' or 'hi'
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am MedAssist, your medical symptom triage assistant. You can type or use the microphone 🎙️ to describe your symptoms in English or हिंदी (Hindi).",
      details: null
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [stats, setStats] = useState(null);
  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Fetch dataset stats
    axios.get('http://127.0.0.1:8000/api/stats')
      .then(res => setStats(res.data))
      .catch(err => console.log('Could not fetch dataset stats:', err));
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Update speech recognition language when toggle changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        language === "hi"
          ? "आपके ब्राउज़र में आवाज़ पहचान (Speech Recognition) समर्थित नहीं है। कृपया Google Chrome या Edge का उपयोग करें।"
          : "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech recognition start failed:", err);
        setIsListening(false);
      }
    }
  };

  // Text-To-Speech (Speak Out Loud)
  const speakText = (text) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95; // Slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage = { sender: "user", text: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat', {
        symptoms: query.trim(),
        language: language
      });
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
          severity: data.severity || "Unknown",
          language: data.language || language
        }
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error communicating with backend:', error);
      const errMsg = language === "hi"
        ? "त्रुटि: सर्वर से संपर्क नहीं हो पाया। कृपया सुनिश्चित करें कि बैकएंड चालू है।"
        : "Error: Unable to connect to the medical assistant service. Please check if the backend is running.";
      setMessages((prev) => [...prev, { sender: "bot", text: errMsg, details: null }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleFollowUpClick = (question) => {
    const reply = language === "hi"
      ? `"${question}" के उत्तर में: हाँ, मुझे यह समस्या हो रही है।`
      : `In response to "${question}": Yes, I am experiencing this.`;
    sendMessage(reply);
  };

  const samplePills = language === "hi" ? SAMPLES_HI : SAMPLES_EN;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="title-area">
            <div className="logo-title">
              <h1>🏥 MedAssist</h1>
              <span className="badge-dataset">
                {stats ? `${stats.total_conditions} Conditions • ${stats.total_departments} Specialties` : "Dataset Loaded"}
              </span>
            </div>

            {/* Language Selector */}
            <div className="language-selector">
              <span className="lang-label">🌐 {language === "hi" ? "भाषा:" : "Language:"}</span>
              <button
                type="button"
                className={`lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                className={`lang-btn ${language === "hi" ? "active" : ""}`}
                onClick={() => setLanguage("hi")}
              >
                🇮🇳 हिंदी (Hindi)
              </button>
            </div>
          </div>

          <p className="subtitle">
            {language === "hi"
              ? "आवाज़ या लिख कर लक्षण बताएं – ग्रामीण और शहरी स्वास्थ्य सहायता"
              : "Voice & Text-Driven Clinical Symptom Triage & Specialist Guidance"}
          </p>
        </div>

        <div className="emergency-disclaimer">
          ⚠️ <strong>{language === "hi" ? "चिकित्सा अस्वीकरण:" : "Medical Disclaimer:"}</strong>{" "}
          {language === "hi"
            ? "MedAssist केवल प्राथमिक मार्गदर्शन प्रदान करता है। गंभीर आपात स्थिति में तुरंत एम्बुलेंस (112/108) को कॉल करें।"
            : "MedAssist provides automated triage guidance. In case of life-threatening emergencies, call emergency services (911/112) immediately."}
        </div>

        {/* Quick test pills */}
        <div className="sample-pills-container">
          <span className="pills-label">
            {language === "hi" ? "त्वरित परीक्षण लक्षण (क्लिक करें):" : "Quick Test Symptoms (Click to test):"}
          </span>
          <div className="pills-scroll">
            {samplePills.map((sample, idx) => (
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
                  {/* Sender Header + Audio Listen Button */}
                  <div className="message-header-row">
                    <span className="sender-name">
                      {isUser ? (language === "hi" ? "👤 आप (You)" : "👤 You") : "🤖 MedAssist AI"}
                    </span>
                    {!isUser && (
                      <button
                        type="button"
                        className="btn-speak"
                        title={language === "hi" ? "आवाज़ में सुनें (Listen aloud)" : "Listen to advice"}
                        onClick={() => speakText(msg.text)}
                      >
                        🔊 {language === "hi" ? "सुनें" : "Listen"}
                      </button>
                    )}
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
                          {details.severity} {language === "hi" ? "प्राथमिकता" : "Priority"}
                        </span>
                        {details.confidence > 0 && (
                          <span className="confidence-pill">
                            {language === "hi" ? "सटीकता:" : "Confidence:"} {Math.round(details.confidence * 100)}%
                          </span>
                        )}
                      </div>

                      {details.condition && (
                        <div className="clinical-row">
                          <span className="label">{language === "hi" ? "विभाग:" : "Specialty:"}</span>
                          <span className="value-dept">{details.department}</span>
                        </div>
                      )}

                      {/* Precautions list */}
                      {details.precautions && details.precautions.length > 0 && (
                        <div className="precautions-section">
                          <strong>{language === "hi" ? "💡 सावधानियां और घरेलू देखभाल:" : "💡 Recommended Actions & Precautions:"}</strong>
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
                          <strong>{language === "hi" ? "❓ सुझाए गए अनुवर्ती प्रश्न (जवाब देने के लिए क्लिक करें):" : "❓ Suggested Follow-up Questions:"}</strong>
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
                <span className="typing-text">
                  {language === "hi" ? "लक्षणों का विश्लेषण किया जा रहा है..." : "Analyzing symptoms across medical dataset..."}
                </span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar with Voice Microphone */}
        <form className="chat-input-form" onSubmit={handleSend}>
          {/* Voice Mic Button */}
          <button
            type="button"
            className={`mic-button ${isListening ? "listening-pulse" : ""}`}
            onClick={toggleListening}
            title={
              language === "hi"
                ? isListening ? "सुनना बंद करें" : "बोलकर लक्षण बताएं (माइक्रोफ़ोन)"
                : isListening ? "Stop listening" : "Speak your symptoms (Microphone)"
            }
          >
            {isListening ? "🛑" : "🎙️"}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? (language === "hi" ? "🎙️ सुन रहा हूँ... बोलिए..." : "🎙️ Listening... speak now...")
                : (language === "hi" ? "लक्षण यहाँ लिखें या माइक 🎙️ दबाकर बोलें..." : "Type symptoms or press 🎙️ mic to speak...")
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />

          <button type="submit" className="btn-send" disabled={loading || !input.trim()}>
            {language === "hi" ? "भेजें ➜" : "Send ➜"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
