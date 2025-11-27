import React, { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! 👋 I'm your AI learning assistant. How can I help you today? Feel free to ask me about courses, learning tips, or any questions you have!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { backendUrl, getToken } = useContext(AppContext);
  const { user, isLoaded } = useUser();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    if (!isLoaded) {
      toast.info('Loading authentication...');
      return;
    }

    if (!user) {
      toast.warn('Please login to use the chatbot');
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const token = await getToken({ skipCache: true });
      if (!token) {
        toast.error('Unable to get authentication token. Please try logging in again.');
        return;
      }

      const { data } = await axios.post(
        backendUrl + "/api/chat/chat",
        {
          message: userMessage,
          conversationHistory: messages.slice(-4), // Last 4 messages for context (faster)
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const serverMessage = error.response?.data?.message;
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please try logging in again.');
      } else if (serverMessage?.includes("quota")) {
        toast.error(serverMessage || 'API quota exceeded. Please try again later.');
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm sorry, but I've reached my usage limit. Please try again later.",
          },
        ]);
      } else {
        toast.error(serverMessage || 'Failed to send message. Please try again.');
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: serverMessage || "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 group"
        aria-label="Open AI Assistant"
        title="AI Assistant"
      >
        <i className="ri-chat-3-line text-white text-2xl group-hover:scale-110 transition-transform"></i>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] glass-card rounded-2xl shadow-2xl border border-white/20 flex flex-col z-50 backdrop-blur-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="ri-chat-3-line text-white text-xl"></i>
          <h3 className="text-white font-semibold text-lg">AI Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close chatbot"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
        {messages.length === 0 && (
          <div className="text-center text-white/70 mt-8">
            <i className="ri-chat-3-line text-4xl mb-2"></i>
            <p>Start a conversation with AI</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "glass-light text-white border border-white/20 shadow-md"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-light px-4 py-3 rounded-2xl border border-white/20 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
                <span className="text-xs text-white/70">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={user ? "Type your message..." : "Please login to chat"}
            disabled={!user || isLoading}
            className="flex-1 glass-input px-4 py-2 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
          />
          <button
            type="submit"
            disabled={!user || isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <i className="ri-send-plane-line"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;

