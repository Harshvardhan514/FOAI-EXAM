import { useContext, useState, useRef, useEffect } from "react";
import { ISSContext } from "../context/index.js";
import { NewsContext } from "../context/index.js";

const HF_TOKEN = import.meta.env.VITE_AI_TOKEN;
const MODEL = "Qwen/Qwen3-1.7B:featherless-ai";
const STORAGE_KEY = "chatbot_messages_v2";

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildSystemPrompt(issData, newsData) {
  const { position, speed, locationName, people, history } = issData;
  const { allArticles, categoryStats } = newsData;

  const issSection = position
    ? `ISS LIVE DATA:
- Latitude: ${position.lat.toFixed(4)}°
- Longitude: ${position.lon.toFixed(4)}°
- Speed: ${speed != null ? speed.toLocaleString() + " km/h" : "calculating..."}
- Current location: ${locationName}
- Positions tracked: ${history.length}
- People in space: ${people.number}
- Crew: ${people.people.map(p => p.name).join(", ") || "unknown"}`
    : "ISS DATA: Not yet loaded.";

  const newsSection = allArticles.length > 0
    ? `NEWS DATA:
- Total articles: ${allArticles.length}
- Category breakdown: ${categoryStats.map(s => `${s.category}: ${s.count}`).join(", ")}
- Recent headlines:
${allArticles.slice(0, 10).map((a, i) =>
      `  ${i + 1}. [${a.source?.name}] ${a.title}`
    ).join("\n")}`
    : "NEWS DATA: No articles loaded yet.";

  return `You are OrbitBot, an AI assistant for the OrbitDash dashboard. You ONLY answer questions using the dashboard data below. Do not use any outside knowledge. If asked something not covered by this data, say you only have access to the dashboard data.

${issSection}

${newsSection}

Keep answers concise and helpful. Use the data above to answer any questions about ISS location, speed, crew, or news.`;
}

export default function Chatbot() {
  const issData = useContext(ISSContext);
  const newsData = useContext(NewsContext);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [
        {
          role: "ai",
          content: "👋 Hi! I'm OrbitBot. I can answer questions about the ISS location, speed, crew, and the latest news on this dashboard. What would you like to know?",
          time: getTime(),
        },
      ];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const last30 = messages.slice(-30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(last30));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const clearChat = () => {
    setMessages([{
      role: "ai",
      content: "Chat cleared! Ask me anything about the ISS or news.",
      time: getTime(),
    }]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(issData, newsData);

      // Build conversation history for API
      const history = messages.slice(-10).map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 512,
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: text },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      // Handle thinking tags if present (Qwen3)
      let reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
      reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      setMessages(prev => [...prev, { role: "ai", content: reply, time: getTime() }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          content: `⚠️ Error: ${err.message}. Make sure VITE_AI_TOKEN is set in your .env file.`,
          time: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="chatbot-btn"
        onClick={() => setOpen(o => !o)}
        title={open ? "Close chat" : "Open OrbitBot"}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">🤖</div>
              <div>
                <div className="chat-name">OrbitBot</div>
                <div className="chat-status">● Dashboard AI</div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="chat-icon-btn" onClick={clearChat} title="Clear chat">🗑️</button>
              <button className="chat-icon-btn" onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <div className="msg-bubble">{msg.content}</div>
                <div className="msg-time">{msg.time}</div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg ai">
                <div className="msg-bubble">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about ISS or news..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
