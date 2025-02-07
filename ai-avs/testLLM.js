import ollama from 'ollama';

async function testLLM() {
    try {
        console.log('🤖 Testing DeepSeek LLM...');
        const response = await ollama.chat({
            model: 'deepseek-r1:1.5b',
            messages: [{ 
                role: 'user', 
                content: 'What is food' 
            }]
        });

        console.log('\n✨ DeepSeek response:', response.message.content);
        console.log('📊 Response length:', response.message.content.length);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testLLM().catch(console.error); 