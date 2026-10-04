// src/components/Chatbot.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, X, Send, ArrowRight } from "lucide-react";
import { sendChatMessage } from "../api/chatbotApi";
import { useAuth } from "../context/AuthContext";
import { sidebarConfig } from "../config/sidebarConfig";

function Chatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: `Hello ${user?.firstName || ""}! How can I help you?`, suggestedPath: null },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const role = user?.role || "student";
  const menuItems = sidebarConfig[role] || [];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Find the sidebar item corresponding to a suggested path.
  const getMenuItemForPath = (path) => menuItems.find((item) => item.path === path);

  useEffect(() => {
    const welcomeText = `Hello ${user?.firstName || ""}! How can I help you?`;
    setMessages((prevMessages) => {
      if (prevMessages.length === 0) {
        return [{ sender: "bot", text: welcomeText, suggestedPath: null }];
      }

      const firstMessage = prevMessages[0];
      if (firstMessage.sender === "bot" && firstMessage.text.startsWith("Hello ")) {
        return [{ ...firstMessage, text: welcomeText }, ...prevMessages.slice(1)];
      }

      return prevMessages;
    });
  }, [user?.firstName]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMessage = { sender: "user", text: trimmedInput, suggestedPath: null };
    const historyForRequest = messages
      .slice(1)
      .filter((message) => message.text)
      .slice(-12);

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChatMessage(trimmedInput, historyForRequest);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: data.reply, suggestedPath: data.suggestedPath || null },
      ]);
    } catch (err) {
      console.error("Erreur chatbot:", err);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "bot",
          text: err.response?.data?.message
            || "Sorry, something went wrong. Please try again later.",
          suggestedPath: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-500/30 flex items-center justify-center transition z-50"
        >
          <Bot className="w-6 h-6 text-slate-950" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-3rem)] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">EduInsight Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.map((msg, i) => {
              const menuItem = msg.suggestedPath ? getMenuItemForPath(msg.suggestedPath) : null;
              const Icon = menuItem?.icon;

              return (
                <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm"
                    }`}
                  >
                      {msg.text}
                  </div>

                  {/* Show a navigation button only when the assistant suggests a page. */}
                  {menuItem && (
                    <button
                      onClick={() => handleNavigate(menuItem.path)}
                      className="mt-2 flex items-center gap-2 bg-cyan-50 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-400/20 transition"
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      Go to {menuItem.label}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
                  ...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              placeholder="Type a message..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Chatbot;