import { useState, useEffect } from 'react';
import ChatMessage from './ChatMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you view cryptocurrency charts. Ask me to show any crypto chart!',
    },
  ]);
  const [input, setInput] = useState('');

  // Listen for blockchain responses
  useEffect(() => {
    const handleBlockchainResponse = (event: any) => {
      if (event.detail?.response) {
        const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase();
        
        // If this was a chart request, modify the blockchain response
        if (lastUserMessage && isChartRequest(lastUserMessage)) {
          const symbol = extractSymbol(lastUserMessage);
          if (symbol) {
            // Add both the blockchain response and the chart
            setMessages(prev => [
              ...prev, 
              {
                role: 'assistant',
                content: `Here's the ${symbol} chart:`
              },
              {
                role: 'assistant',
                content: `/chart ${symbol}`
              }
            ]);
            return; // Skip the default response handling
          }
        }

        // Default response handling
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: event.detail.response
        }]);
      }
    };

    window.addEventListener('blockchain-response', handleBlockchainResponse);
    return () => window.removeEventListener('blockchain-response', handleBlockchainResponse);
  }, [messages]);

  const extractSymbol = (message: string): string => {
    const symbols = {
      'eth': 'ETH',
      'ethereum': 'ETH',
      'btc': 'BTC',
      'bitcoin': 'BTC',
      'sol': 'SOL',
      'solana': 'SOL',
      'avax': 'AVAX',
      'avalanche': 'AVAX',
      'dot': 'DOT',
      'polkadot': 'DOT',
      'ada': 'ADA',
      'cardano': 'ADA'
    };

    const messageLower = message.toLowerCase();
    for (const [key, value] of Object.entries(symbols)) {
      if (messageLower.includes(key)) {
        return value;
      }
    }
    return '';
  };

  const isChartRequest = (message: string): boolean => {
    const chartKeywords = ['chart', 'price', 'show', 'trading', 'graph'];
    return chartKeywords.some(keyword => message.includes(keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input (let blockchain service handle the response)
    setInput('');

    // If this is a chart request, dispatch a custom event
    if (isChartRequest(input.toLowerCase())) {
      const symbol = extractSymbol(input);
      if (symbol) {
        window.dispatchEvent(new CustomEvent('chart-request', {
          detail: { symbol }
        }));
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} {...message} />
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to show any crypto chart..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 