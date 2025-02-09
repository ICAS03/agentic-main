// /components/ChatComponent.js
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

// Simple message type definition (no Node imports)
const MessageType = {
  TEXT: 'text',
  CARD: 'card',
  CARD_LIST: 'card_list',
};

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle form submission (calls server endpoint)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: MessageType.TEXT,
      content: inputValue,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send user input to our server route
    try {
      const response = await fetch('/api/cdp-agent', {
        method: 'POST',
        body: JSON.stringify({ userMessage: inputValue }),
      });
      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        type: MessageType.TEXT,
        sender: 'bot',
        content: data.botResponse || 'No response',
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
    }

    setInputValue('');
    setIsLoading(false);
  };

  // For rendering the chat messages
  return (
    <div className="flex flex-col h-[90vh] w-full max-w-2xl mx-auto p-4">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input field + send button */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`p-2 rounded-lg transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

// Renders each message, including optional cards
const MessageBubble = ({ message }) => {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] ${
          isBot ? 'bg-gray-100' : 'bg-blue-500 text-white'
        } rounded-lg p-3`}
      >
        {message.type === MessageType.TEXT && <p>{message.content}</p>}
        {message.type === MessageType.CARD && (
          <Card content={message.content} />
        )}
        {message.type === MessageType.CARD_LIST && (
          <div className="space-y-2">
            {message.content.map((card, idx) => (
              <Card key={idx} content={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Example Card component for structured responses
const Card = ({ content }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {content.image && (
        <div className="relative h-40">
          <img
            src={content.image}
            alt={content.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-800">{content.title}</h3>
        <p className="text-gray-600">{content.description}</p>
        {content.buttons && (
          <div className="mt-4 flex flex-wrap gap-2">
            {content.buttons.map((btn, idx) => (
              <button
                key={idx}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
                           active:bg-blue-700 transition-colors focus:outline-none
                           focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                {btn}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;
