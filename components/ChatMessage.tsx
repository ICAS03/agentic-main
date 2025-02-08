import { useState } from 'react';
import TradingViewWidget from './TradingViewWidget';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  // Check if message contains trading command
  const isTradingCommand = content.startsWith('/chart');
  const symbol = isTradingCommand ? content.split(' ')[1]?.toUpperCase() : null;

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`
          ${isTradingCommand ? 'w-full max-w-5xl mx-auto' : 'max-w-[80%]'}
          ${role === 'user' 
            ? 'bg-blue-500 text-white' 
            : role === 'system'
            ? 'bg-gray-500 text-white'
            : 'bg-gray-200'
          } 
          rounded-lg p-4
        `}
      >
        {isTradingCommand && symbol ? (
          <div className="w-full min-h-[600px]">
            <TradingViewWidget symbol={symbol} />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
} 