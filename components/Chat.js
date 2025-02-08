"use client";
import { useState, useRef, useEffect } from "react";
import {
  useWeb3ModalProvider,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import ContractService from "../services/contractService";
import { ethers, BrowserProvider } from "ethers";
import ChatMessage from './ChatMessage';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
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
      /*contractService.contract.on("TransferSuccess", (from, to, amount) => {
        console.log(
          `🔔 Transfer Event: ${from} → ${to} | ${ethers.formatEther(
            amount
          )} ETH`
        );
      });*/

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

  // Update the extractSymbol function to handle more variations
  const extractSymbol = (message) => {
    const symbols = {
      'eth': 'ETH',
      'ethereum': 'ETH',
      'btc': 'BTC',
      'bitcoin': 'BTC',
      'sol': 'SOL',
      'solana': 'SOL',
      'avax': 'AVAX',
      'avalanche': 'AVAX',
      'dot': 'DOT',
      'polkadot': 'DOT',
      'ada': 'ADA',
      'cardano': 'ADA'
    };

    // Convert message to lowercase for case-insensitive matching
    const messageLower = message.toLowerCase();
    
    // First check for explicit chart requests
    const chartKeywords = ['chart', 'price', 'trading', 'tradingview'];
    const hasChartRequest = chartKeywords.some(keyword => messageLower.includes(keyword));
    
    if (hasChartRequest) {
      // Look for any symbol in the message
      for (const [key, value] of Object.entries(symbols)) {
        if (messageLower.includes(key)) {
          return value;
        }
      }
    }
    
    return null; // Return null if no symbol is found
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || !contractService) return;

    setIsLoading(true);
    try {
      // Create task on blockchain
      const { hash, task, taskIndex } = await contractService.createTask(input);

      // Add user message with transaction hash
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `${input}\n\nTransaction submitted! Hash: ${hash}`
        }
      ]);

      // Improved chart request detection
      const chartKeywords = ['chart', 'price', 'trading', 'tradingview'];
      const isChartRequest = chartKeywords.some(keyword => input.toLowerCase().includes(keyword));
      const requestedSymbol = extractSymbol(input);

      const aiPrompt = `Analyze the following input: "${input}". 
      If it contains a request for a cryptocurrency chart or price, respond with "Showing chart for ${requestedSymbol || 'ETH'}".
      If it contains a transfer command, respond with: "Transfer to: <recipient_address>, Amount: <amount>".
      Otherwise, respond naturally.`;
      
      const aiResponse = await contractService.getAIResponse(aiPrompt);
      const recordHash = await contractService.createRecord(input);
      
      // Handle chart requests
      if (isChartRequest && requestedSymbol) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Showing chart for ${requestedSymbol}\n\nTransaction submitted! Hash: ${recordHash}`
          },
          {
            role: "assistant",
            content: `/chart ${requestedSymbol}`
          }
        ]);
      } else {
        // Handle regular responses
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `${aiResponse}\n\nTransaction submitted! Hash: ${recordHash}`
          }
        ]);
      }

      // Create and submit signature (without showing hash)
      const signature = await contractService.createSignature(
        await contractService.provider.getSigner(),
        aiResponse,
        task.contents
      );

      await contractService.respondToTask(
        {
          contents: task.contents,
          taskCreatedBlock: task.taskCreatedBlock,
        },
        taskIndex,
        aiResponse,
        signature
      );

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
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
          <div ref={messagesEndRef} />
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
