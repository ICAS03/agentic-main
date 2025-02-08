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
            console.log("Token Data: ",tokenData);

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
            console.log("sortedTokens: ",sortedTokens);

            // Extract number from query (e.g., "top 5" -> 5)
            const numberMatch = content.match(/\d+/);
            const limit = numberMatch ? parseInt(numberMatch[0]) : 10;


            // Prepare data for AI
            const topTokens = sortedTokens.slice(0, limit);
            const tokenPrompt = `Based on the latest Coinbase volume data, here are the top ${limit} trending tokens:\n\n` + 
                              topTokens.map(token => ({
                                  pair: token.display_name,
                                  volume: (parseFloat(token.spot_volume_24hour || '0') + 
                                         parseFloat(token.rfq_volume_24hour || '0') + 
                                         parseFloat(token.conversion_volume_24hour || '0')).toFixed(2)
                              }));

            // Get AI response with token data
            const response = await ollama.chat({
                model: 'deepseek-r1:1.5b',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a helpful assistant that provides information about cryptocurrency trading volumes. When presenting token data, always include the trading pair and 24h volume, and format the response in a clear, numbered list.'
                    },
                    { 
                        role: 'user', 
                        content: `Please analyze and present this token volume data: ${JSON.stringify(tokenPrompt)}`
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