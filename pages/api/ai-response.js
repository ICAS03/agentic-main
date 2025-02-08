import ollama from 'ollama';

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

            // Prepare data for AI in a more structured format
            const topTokens = sortedTokens.slice(0, limit);
            const formattedTokenData = topTokens.map((token, index) => {
                const totalVolume = (
                    parseFloat(token.spot_volume_24hour || '0') + 
                    parseFloat(token.rfq_volume_24hour || '0') + 
                    parseFloat(token.conversion_volume_24hour || '0')
                ).toFixed(2);

                return `${index + 1}. Trading Pair: ${token.display_name}
                   Base Currency: ${token.base_currency}
                   Quote Currency: ${token.quote_currency}
                   24h Total Volume: ${totalVolume}
                   Markets: ${token.market_types.join(', ')}
                   Spot Volume 24h: ${token.spot_volume_24hour || '0'}
                   RFQ Volume 24h: ${token.rfq_volume_24hour || '0'}
                   Conversion Volume 24h: ${token.conversion_volume_24hour || '0'}\n`;
            }).join('\n');

            const tokenPrompt = `Here is the detailed volume data for the top ${limit} trending tokens on Coinbase:\n\n${formattedTokenData}\n` +
                              `Please present this information in a clear, numbered list format, including the trading pair, total 24h volume, and available markets for each token.`;

            // Get AI response with token data
            const response = await ollama.chat({
                model: 'deepseek-r1:1.5b',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a cryptocurrency market analyst. When presenting token data, format it as a numbered list. For each token, include: 1) Trading pair name, 2) Total 24h volume, 3) Available markets. Use proper formatting and numbers. Make it easy to read.'
                    },
                    { 
                        role: 'user', 
                        content: tokenPrompt
                    }
                ]
            });

            const aiResponse = response.message.content.split('</think>')[1]?.trim() || response.message.content;
            res.status(200).json({ response: aiResponse });
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