// /components/ChatComponent.js
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Simple message type definition (no Node imports)

const MessageType = {

  TEXT: 'text',

  CARD: 'card',

  CARD_LIST: 'card_list',
  RESEARCH: 'research'

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
const SourceLink = ({ name, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
               transition-all duration-200 shadow-sm hover:shadow-md 
               transform hover:-translate-y-0.5 active:translate-y-0
               text-sm font-medium"
  >
    <div className="flex items-center space-x-2">
      <span>{name}</span>
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
        />
      </svg>
    </div>
  </a>
);

const ResearchContent = ({ content }) => {
  // Split content to separate sources section
  const sections = content.split(/(?=Sources for Further Information)/);
  const mainContent = sections[0];
  const sourcesSection = sections[1];

  // Parse sources into structured data
  const formatSources = (sourcesText) => {
    if (!sourcesText) return [];
    
    const lines = sourcesText
      .replace('Sources for Further Information', '')
      .trim()
      .split('\n')
      .filter(line => line.trim());

    return lines.map(line => {
      const [name, url] = line.split(' - ').map(s => s.trim());
      return { name, url };
    });
  };

  const sources = sourcesSection ? formatSources(sourcesSection) : [];

  return (
    <div className="space-y-4">
      {/* Main content section */}
      <div className="prose prose-sm dark:prose-invert">
        <ReactMarkdown
          components={{
            h1: ({children}) => <h1 className="text-xl font-bold mb-3">{children}</h1>,
            h2: ({children}) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
            p: ({children}) => <p className="mb-2">{children}</p>,
            ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
            li: ({children}) => <li className="mb-1">{children}</li>,
          }}
        >
          {mainContent}
        </ReactMarkdown>
      </div>

      {/* Sources section with button-style links */}
      {sources.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Sources for Further Information</h3>
          <div className="flex flex-wrap gap-3">
            {sources.map((source, index) => (
              <SourceLink key={index} name={source.name} url={source.url} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] ${
          isBot 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
            : 'bg-blue-500 text-white'
        } rounded-lg p-4`}
      >
        {message.type === MessageType.TEXT && (
          <ResearchContent content={message.content} />
        )}
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

// Renders each message, including optional cards




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