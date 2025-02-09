import dynamic from 'next/dynamic';
import TrendingTokens from '../components/TrendingTokens';

// Dynamically import Header with ssr disabled to prevent hydration errors
const Header = dynamic(() => import('../components/Header'), {
    ssr: false
});

export default function TrendingTokensPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <TrendingTokens />
        </div>
    );
} 