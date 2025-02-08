import dynamic from 'next/dynamic';
import Chat from '../components/Chat';
import ChatComponent from '../components/ChatComponent';

// Dynamically import Header with ssr disabled to prevent hydration errors
const Header = dynamic(() => import('../components/Header'), {
    ssr: false
});

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <ChatComponent />
        </div>
    );
}
