import dynamic from 'next/dynamic';
import Chat from '../components/Chat';
import Link from 'next/link';

// Dynamically import Header with ssr disabled to prevent hydration errors
const Header = dynamic(() => import('../components/Header'), {
    ssr: false
});

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <div className="absolute top-4 right-10 z-10">
                <Link 
                    href="/trending-tokens"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Trending Tokens
                </Link>
            </div>
            <Chat />
        </div>
    );
}
