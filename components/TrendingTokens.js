import { useState, useEffect } from 'react';

function TrendingTokens() {
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        const response = await fetch('/api/coinbase');
        const data = await response.json();
        
        // Sort tokens by total volume
        const sortedTokens = data.sort((a, b) => {
          const aVolume = parseFloat(a.spot_volume_24hour || '0') + 
                         parseFloat(a.rfq_volume_24hour || '0') + 
                         parseFloat(a.conversion_volume_24hour || '0');
          const bVolume = parseFloat(b.spot_volume_24hour || '0') + 
                         parseFloat(b.rfq_volume_24hour || '0') + 
                         parseFloat(b.conversion_volume_24hour || '0');
          return bVolume - aVolume;
        });

        // Get top 10 tokens
        setTrendingTokens(sortedTokens.slice(0, 10));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch trending tokens');
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  const formatVolume = (volume) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(volume);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 p-4">
      Error: {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Top 10 Trending Tokens
      </h1>
      <div className="grid gap-6">
        {trendingTokens.map((token, index) => {
          const totalVolume = parseFloat(token.spot_volume_24hour || '0') + 
                            parseFloat(token.rfq_volume_24hour || '0') + 
                            parseFloat(token.conversion_volume_24hour || '0');

          return (
            <div 
              key={token.id} 
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full mr-4">
                    <span className="text-blue-600 dark:text-blue-300 font-semibold">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {token.display_name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {token.base_currency} / {token.quote_currency}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatVolume(totalVolume)} <span className="text-sm text-gray-500">24h Volume</span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {token.market_types.map(market => (
                      <span 
                        key={market}
                        className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                      >
                        {market.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="text-gray-600 dark:text-gray-400">
                  <p>Spot Volume</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatVolume(parseFloat(token.spot_volume_24hour || '0'))}
                  </p>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <p>RFQ Volume</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatVolume(parseFloat(token.rfq_volume_24hour || '0'))}
                  </p>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <p>Conversion Volume</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatVolume(parseFloat(token.conversion_volume_24hour || '0'))}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrendingTokens; 