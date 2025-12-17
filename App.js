import React, { useState } from "react";
import axios from 'axios';
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat', { symptoms: input.trim() });
      const botMessage = { sender: "bot", text: response.data.message };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error communicating with backend:', error);
      const botMessage = { sender: "bot", text: "Error: Could not get a response from the backend." };
      setMessages((prev) => [...prev, botMessage]);
    }

    setInput("");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏥 MedAssist – Symptom Chatbot</h1>
        <p>Describe your symptoms to get guidance on which department to visit.</p>
      </header>

      <main className="chat-container">
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message ${msg.sender === "user" ? "user" : "bot"}`}
            >
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        <form className="chat-input" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Describe your symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
}

export default App;
