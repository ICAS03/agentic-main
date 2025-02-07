'use client'
import { useState, useRef, useEffect } from 'react';
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';
import ContractService from '../services/contractService';
import { BrowserProvider } from 'ethers';

function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { walletProvider } = useWeb3ModalProvider();
    const { address, isConnected } = useWeb3ModalAccount();
    const [contractService, setContractService] = useState(null);

    useEffect(() => {
        if (walletProvider) {
            const service = new ContractService(walletProvider);
            setContractService(service);

            // Listen for new tasks and responses
            const unsubscribeTask = service.listenToNewTasks((taskIndex, task) => {
                console.log('New task created:', taskIndex, task);
            });

            const unsubscribeResponse = service.listenToResponses((taskIndex, response) => {
                setMessages(prev => {
                    // Find the loading message and replace it
                    const newMessages = prev.filter(msg => !msg.isLoading);
                    return [...newMessages, {
                        role: 'assistant',
                        content: response,
                        taskIndex
                    }];
                });
            });

            return () => {
                unsubscribeTask();
                unsubscribeResponse();
            };
        }
    }, [walletProvider]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || !isConnected || !contractService) return;

        setIsLoading(true);
        try {
            // Create task on blockchain
            const provider = new BrowserProvider(walletProvider);
            const signer = await provider.getSigner();
            const { hash, task, taskIndex } = await contractService.createTask(input);

            // Update messages with user input and transaction hash
            setMessages(prev => [...prev, {
                role: 'user',
                content: `${input}\n\nTransaction submitted! Hash: ${hash}`
            }]);

            // Get AI response
            const aiResponse = await contractService.getAIResponse(input);
            
            // Submit AI response to blockchain
            const responseHash = await contractService.respondToTask(
                task,
                taskIndex,
                aiResponse
            );

            // Update messages with AI response and its transaction hash
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `${aiResponse}\n\nTransaction submitted! Hash: ${responseHash}`
            }]);

        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'system',
                content: `Error: ${error.message}`,
                isError: true
            }]);
        } finally {
            setInput('');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center">
            <div className="flex flex-col h-[calc(100vh-73px)] w-full max-w-3xl">
                {/* Chat messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                        <div 
                            key={index} 
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div 
                                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                                    message.role === 'user' 
                                        ? 'bg-blue-500 text-white'
                                        : message.role === 'system'
                                        ? 'bg-gray-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                                }`}
                            >
                                {message.content}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t dark:border-gray-700 p-4">
                    <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isConnected ? "Type your message..." : "Please connect wallet first"}
                            disabled={!isConnected || isLoading}
                            className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!isConnected || isLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Chat; 