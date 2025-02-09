import ollama from 'ollama';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { content } = req.body;

        // Handle non-token related queries as before
        const response = await ollama.chat({
            model: 'deepseek-r1:1.5b',
            messages: [{ role: 'user', content }]
        });

        const aiResponse = response.message.content.split('</think>')[1]?.trim() || response.message.content;
        res.status(200).json({ response: aiResponse });
    } catch (error) {
        console.error('AI Response Error:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
}