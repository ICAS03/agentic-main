"use client";
import { useState, useRef, useEffect } from "react";
import {
  useWeb3ModalProvider,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import ContractService from "../services/contractService";
import { ethers, BrowserProvider } from "ethers";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || !contractService) return;

    setIsLoading(true);
    try {
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
      const aiPrompt = `Analyze the following input and check if it contains a transfer command. If it does, please respond with the transfer details in the following format: "Transfer to: <recipient_address>, Amount: <amount>". Input: "${input}". Please do not add any extra information. If it does not contain a transfer command , then just reply to the following input such as saying "Hi , how can I help you".`;
      const aiResponse = await contractService.getAIResponse(aiPrompt);

      // Log the AI response for debugging
      console.log("AI Response:", aiResponse);

      // Check if the AI response indicates a transfer
      const transferDetails = aiResponse.match(
        /Transfer to: (\S+), Amount: (\d+(\.\d+)?)/
      );

      // Check if transferDetails is null
      if (transferDetails) {
        const recipient = transferDetails[1];
        const amount = transferDetails[2];
        await handleTransfer(recipient, amount); // Call the transfer function
        return; // Exit early after handling transfer
      } else {
        console.log("No transfer details found in AI response.");
        const recordHash = await contractService.createRecord(input); // Create a record of the transaction
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Transaction recorded on-chain. Hash: ${recordHash}`,
          },
        ]);
      }

      // Create signature for the response
      const signature = await contractService.createSignature(
        await contractService.provider.getSigner(),
        aiResponse,
        task.contents
      );

      // Log the arguments for debugging
      console.log("Responding to task with arguments:", {
        task: {
          contents: task.contents, // Ensure this is a simple string
          taskCreatedBlock: task.taskCreatedBlock, // Ensure this is a uint32
        },
        taskIndex, // Ensure this is a uint32
        response: aiResponse, // Ensure this is a simple string
        signature, // Ensure this is a bytes string
      });

      // Submit AI response to blockchain
      const responseHash = await contractService.respondToTask(
        {
          contents: task.contents, // Ensure this is a simple string
          taskCreatedBlock: task.taskCreatedBlock, // Ensure this is a uint32
        },
        taskIndex, // Ensure this is a uint32
        aiResponse, // Ensure this is a simple string
        signature // Ensure this is a bytes string
      );

      // Update messages with AI response and its transaction hash
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${aiResponse}\n\nTransaction submitted! Hash: ${responseHash}`,
        },
      ]);
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
