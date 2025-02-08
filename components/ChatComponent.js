import React, { useState, useRef, useEffect } from 'react';
import { Send, Image } from 'lucide-react';

// Message types for type checking
const MessageType = {
  TEXT: 'text',
  CARD: 'card',
  CARD_LIST: 'card_list'
};

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle user input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: MessageType.TEXT,
      content: inputValue,
      sender: 'user'
    };

    // Generate mock bot response based on user input
    const botResponse = await generateBotResponse(inputValue);

    setMessages(prev => [...prev, userMessage, botResponse]);
    setInputValue('');
    setIsLoading(false);
  };

  // Mock bot response generator with added delay for realism
  const generateBotResponse = async (userInput) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const input = userInput.toLowerCase();
    
    if (input.includes('card')) {
      return {
        id: Date.now() + 1,
        type: MessageType.CARD,
        sender: 'bot',
        content: {
          title: 'Interactive Card',
          description: 'Try clicking the buttons below!',
          image: '/api/placeholder/300/200',
          buttons: ['Like', 'Share', 'More Info']
        }
      };
    } else if (input.includes('list')) {
      return {
        id: Date.now() + 1,
        type: MessageType.CARD_LIST,
        sender: 'bot',
        content: [
          {
            title: 'First Option',
            description: 'Click to select this option',
            image: '/api/placeholder/300/200',
            buttons: ['Select', 'Details']
          },
          {
            title: 'Second Option',
            description: 'Another interactive option',
            image: '/api/placeholder/300/200',
            buttons: ['Select', 'Details']
          }
        ]
      };
    }

    return {
      id: Date.now() + 1,
      type: MessageType.TEXT,
      sender: 'bot',
      content: `You said: ${userInput}`
    };
  };

  // Handle card button clicks
  const handleCardButtonClick = (buttonText, cardTitle) => {
    const response = {
      id: Date.now(),
      type: MessageType.TEXT,
      sender: 'bot',
      content: `You clicked "${buttonText}" on card "${cardTitle}"`
    };
    setMessages(prev => [...prev, response]);
  };

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-2xl mx-auto p-4">
      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onButtonClick={handleCardButtonClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
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
};

// Message Bubble component to render different message types
const MessageBubble = ({ message, onButtonClick }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] ${
        isBot ? 'bg-gray-100' : 'bg-blue-500 text-white'
      } rounded-lg p-3`}>
        {message.type === MessageType.TEXT && (
          <p>{message.content}</p>
        )}
        
        {message.type === MessageType.CARD && (
          <Card 
            content={message.content} 
            onButtonClick={onButtonClick}
          />
        )}
        
        {message.type === MessageType.CARD_LIST && (
          <div className="space-y-2">
            {message.content.map((card, index) => (
              <Card 
                key={index} 
                content={card} 
                onButtonClick={onButtonClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Card component for structured responses
const Card = ({ content, onButtonClick }) => {
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
            {content.buttons.map((button, index) => (
              <button
                key={index}
                onClick={() => onButtonClick(button, content.title)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                          active:bg-blue-700 transition-colors focus:outline-none 
                          focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                {button}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;