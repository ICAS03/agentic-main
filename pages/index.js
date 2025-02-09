import dynamic from 'next/dynamic';
import { useState } from 'react';
import Chat from '../components/Chat';
import ChatComponent from '../components/ChatComponent';

// Dynamically import Header with ssr disabled to prevent hydration errors
const Header = dynamic(() => import('../components/Header'), {
    ssr: false
});

export default function Home() {
    const [showChatComponent, setShowChatComponent] = useState(false); // State to toggle components

    const toggleComponent = () => {
        setShowChatComponent((prev) => !prev); // Toggle the state
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <button 
                onClick={toggleComponent} 
                className="m-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                {showChatComponent ? 'Show Chat' : 'Show Chat Component'}
            </button>
            {showChatComponent ? <ChatComponent /> : <Chat />} {/* Conditional rendering */}
        </div>
    );
}
