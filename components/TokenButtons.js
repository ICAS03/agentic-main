export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { content } = req.body;

        // Check if the message is asking about trending tokens
        if (content.toLowerCase().includes('trending') && content.toLowerCase().includes('token')) {
            // Fetch token data from Coinbase
            const coinbaseResponse = await fetch('https://api.exchange.coinbase.com/products/volume-summary');
            const tokenData = await coinbaseResponse.json();

            // Sort tokens by volume
            const sortedTokens = tokenData.sort((a, b) => {
                const aVolume = parseFloat(a.spot_volume_24hour || '0') + 
                              parseFloat(a.rfq_volume_24hour || '0') + 
                              parseFloat(a.conversion_volume_24hour || '0');
                const bVolume = parseFloat(b.spot_volume_24hour || '0') + 
                              parseFloat(b.rfq_volume_24hour || '0') + 
                              parseFloat(b.conversion_volume_24hour || '0');
                return bVolume - aVolume;
            });

            // Extract number from query (e.g., "top 5" -> 5)
            const numberMatch = content.match(/\d+/);
            const limit = numberMatch ? parseInt(numberMatch[0]) : 10;

            // Prepare data as JSON with interactive links
            const topTokens = sortedTokens.slice(0, limit).map((token, index) => {
                const baseCurrency = token.base_currency.toLowerCase();
                return {
                    rank: index + 1,
                    trading_pair: token.display_name,
                    total_volume_24h: (
                        parseFloat(token.spot_volume_24hour || '0') + 
                        parseFloat(token.rfq_volume_24hour || '0') + 
                        parseFloat(token.conversion_volume_24hour || '0')
                    ).toFixed(2),
                    available_markets: token.market_types,
                    trading_link: `https://www.coinbase.com/price/${baseCurrency}`
                };
            });

            res.status(200).json({ tokens: topTokens });
        } else {
            // Handle non-token related queries as before
            const response = await ollama.chat({
                model: 'deepseek-r1:1.5b',
                messages: [{ role: 'user', content }]
            });

            const aiResponse = response.message.content.split('</think>')[1]?.trim() || response.message.content;
            res.status(200).json({ response: aiResponse });
        }
    } catch (error) {
        console.error('AI Response Error:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
}