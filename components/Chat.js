"use client";
import { useState, useRef, useEffect } from "react";
import {
  useWeb3ModalProvider,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import ContractService from "../services/contractService";
import { ethers, BrowserProvider } from "ethers";
import fetch from 'node-fetch';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trendingTokens, setTrendingTokens] = useState([]); // State to hold trending tokens
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
        console.log("New task created:", taskIndex, task);
      });

      const unsubscribeResponse = service.listenToResponses(
        (taskIndex, response) => {
          setMessages((prev) => {
            // Find the loading message and replace it
            const newMessages = prev.filter((msg) => !msg.isLoading);
            return [
              ...newMessages,
              {
                role: "assistant",
                content: response,
                taskIndex,
              },
            ];
          });
        }
      );

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

  const handleTransfer = async (recipient, amount) => {
    if (!recipient || !amount || !isConnected || !contractService) return;

    try {
      const provider = new BrowserProvider(walletProvider);
      const balanceWei = await provider.getBalance(address);
      const balance = ethers.formatEther(balanceWei);

      console.log("Account balance:", balance);

      if (parseFloat(balance) < parseFloat(amount)) {
        throw new Error("Insufficient balance for transfer.");
      }

      const formattedAmount = ethers.parseEther(amount.toString());
      await contractService.transferFunds(recipient, formattedAmount);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Successfully transferred ${amount} ETH to ${recipient}.`,
        },
      ]);
    } catch (error) {
      console.error("🚨 Transfer Error Details:", error);
      console.error("❌ Error Message:", error.message);
      console.error("🔗 Possible Transaction Hash:", error?.transactionHash);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Error: ${error.message}`,
          isError: true,
        },
      ]);
    }
  };

  const fetchTrendingTokens = async (limit) => {
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

    // Prepare data for AI in a more structured format
    const topTokens = sortedTokens.slice(0, limit);
    const formattedTokenData = topTokens.map((token) => {
        const totalVolume = (
            parseFloat(token.spot_volume_24hour || '0') + 
            parseFloat(token.rfq_volume_24hour || '0') + 
            parseFloat(token.conversion_volume_24hour || '0')
        ).toFixed(2);

        return {
            name: token.display_name,
            baseCurrency: token.base_currency,
            quoteCurrency: token.quote_currency,
            totalVolume,
            markets: token.market_types.join(', '),
            url: `https://www.coinbase.com/price/${token.base_currency.toLowerCase()}` // Create the URL for trading view
        };
    });

    return formattedTokenData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || !contractService) return;

    setIsLoading(true);
    try {
      // Record user input on-chain
      const recordHash = await contractService.createRecord(input);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `${input}\n\nTransaction recorded on-chain. Hash: ${recordHash}`,
        },
      ]);

      // Check if the input is asking for a transfer
      const transferDetails = input.match(/transfer (\S+) (\d+(\.\d+)?)/);
      if (transferDetails) {
        const recipient = transferDetails[1];
        const amount = transferDetails[2];

        // Call the transfer function
        await handleTransfer(recipient, amount);
        return; // Exit early after handling transfer
      }

      // Check if the input is asking for trending tokens
      if (input.toLowerCase().includes('trending') && input.toLowerCase().includes('token')) {
        const numberMatch = input.match(/\d+/);
        const limit = numberMatch ? parseInt(numberMatch[0]) : 10; // Default to top 10
        const trendingTokensData = await fetchTrendingTokens(limit);
        setTrendingTokens(trendingTokensData); // Store trending tokens in state

        // Prepare AI response
        const aiResponse = `Here are the top ${limit} trending tokens:\n\n`;
        
        // Record AI response on-chain
        const aiRecordHash = await contractService.createRecord(aiResponse);
        
        // Add the AI response to messages after recording
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `${aiResponse}\n\nTransaction recorded on-chain. Hash: ${aiRecordHash}`,
          },
        ]);
        
        // Render trending tokens as part of the chat
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: trendingTokensData.map(token => 
              `${token.name} (Base: ${token.baseCurrency}, Quote: ${token.quoteCurrency}, Volume: ${token.totalVolume}, Markets: ${token.markets})`
            ).join('\n'),
          },
        ]);
        
        return; // Exit early after handling trending tokens
      }

      // Create task on blockchain
      const { hash, task, taskIndex } = await contractService.createTask(input);

      // Update messages with user input and transaction hash
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `${input}\n\nTransaction submitted! Hash: ${hash}`,
        },
      ]);

      // Prompt AI to analyze the input and check for transfer commands
      const aiPrompt = `Analyze the following input and check if it contains a transfer command. If it does, please respond with the transfer details in the following format: "Transfer to: <recipient_address>, Amount: <amount>". Input: "${input}". Please do not add any extra information. If it does not contain a transfer command, then just reply to the following input such as saying "Hi, how can I help you".`;
      const aiResponse = await contractService.getAIResponse(aiPrompt);

      // Log the AI response for debugging
      console.log("AI Response:", aiResponse);

      // Check if transferDetails is null
      if (transferDetails) {
        const recipient = transferDetails[1];
        const amount = transferDetails[2];

        // Call the transfer function
        await handleTransfer(recipient, amount);
      } else {
        console.log("No transfer details found in AI response.");
        // Record AI response on-chain
        const aiRecordHash = await contractService.createRecord(aiResponse);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `${aiResponse}\n\nTransaction recorded on-chain. Hash: ${aiRecordHash}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Error: ${error.message}`,
          isError: true,
        },
      ]);
    } finally {
      setInput("");
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
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : message.role === "system"
                    ? "bg-gray-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 dark:text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        

        {/* Render trending tokens as buttons within the chat */}
        {trendingTokens.length > 0 && (
          <div className="p-4">
            <h3 className="text-lg font-bold">Trending Tokens:</h3>
            {trendingTokens.map((token, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => window.open(token.url, '_blank')}
                  className="bg-blue-500 text-white rounded-lg px-4 py-2 m-2"
                >
                  {token.name}
                </button>
                <p className="ml-2">
                  Base: {token.baseCurrency}, Quote: {token.quoteCurrency}, Volume: {token.totalVolume}, Markets: {token.markets}
                </p>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Input area */}
        <div className="border-t dark:border-gray-700 p-4">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isConnected
                  ? "Type your message..."
                  : "Please connect wallet first"
              }
              disabled={!isConnected || isLoading}
              className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isConnected || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;