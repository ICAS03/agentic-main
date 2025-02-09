import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Ensure you have your OpenAI API key in your environment variables
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
    console.log('Request received:', req.method, req.body); // Print the request method and body
    if (req.method !== 'POST') {
        console.log('Method not allowed:', req.method); // Print the method not allowed
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { content } = req.body;
        console.log('Content received:', content); // Print the content received
        const response = await openai.createChatCompletion({
            model: 'gpt-4o-mini', // Specify the model you want to use
            messages: [{ role: 'user', content }]
        });

        console.log('Response received:', response.data.choices[0].message.content); // Print the response received
        const aiResponse = response.data.choices[0].message.content;
        res.status(200).json({ response: aiResponse });
    } catch (error) {
        console.error('AI Response Error:', error); // Print the error
        res.status(500).json({ error: 'Failed to get AI response' });
    }
}