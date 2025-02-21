"use client";
import { useState, useRef, useEffect } from "react";
import {
  useWeb3ModalProvider,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import ContractService from "../services/contractService";
import { ethers, BrowserProvider } from "ethers";
import ChatMessage from './ChatMessage';

// Update the TOP_COINS list with current trending order
const TOP_COINS = [
  {
    name: 'Bitcoin',
    baseCurrency: 'BTC',
    quoteCurrency: 'USDT',
    markets: 'Spot, Futures',
  },
  {
    name: 'Ethereum',
    baseCurrency: 'ETH',
    quoteCurrency: 'USDT',
    markets: 'Spot, Futures',
  },
  {
    name: 'Solana',
    baseCurrency: 'SOL',
    quoteCurrency: 'USDT',
    markets: 'Spot, Futures',
  },
  {
    name: 'Avalanche',
    baseCurrency: 'AVAX',
    quoteCurrency: 'USDT',
    markets: 'Spot',
  },
  {
    name: 'Polygon',
    baseCurrency: 'MATIC',
    quoteCurrency: 'USDT',
    markets: 'Spot',
  },
  {
    name: 'Cardano',
    baseCurrency: 'ADA',
    quoteCurrency: 'USDT',
    markets: 'Spot',
  },
  {
    name: 'Polkadot',
    baseCurrency: 'DOT',
    quoteCurrency: 'USDT',
    markets: 'Spot',
  },
  {
    name: 'Chainlink',
    baseCurrency: 'LINK',
    quoteCurrency: 'USDT',
    markets: 'Spot',
  }
];

const getTokenIcon = (symbol, isToken = false) => {
  // Clean up the symbol by removing USD, USDC, USDT suffixes
  const cleanSymbol = symbol.split('-')[0].toLowerCase();
  
  // For tokens, try to get logo from CoinGecko
  if (isToken) {
    return `https://assets.coincap.io/assets/icons/${cleanSymbol}@2x.png`;
  }
  // For coins, keep using the cryptocurrency-icons
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cleanSymbol}.png`;
};

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [trendingTokens, setTrendingTokens] = useState([]);
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

  // Update the isTrendingRequest function to detect type
  const isTrendingRequest = (input) => {
    const trendingKeywords = ['trending', 'top', 'popular'];
    const lowercaseInput = input.toLowerCase();
    
    // Check if it's a trending request
    const isTrending = trendingKeywords.some(trend => lowercaseInput.includes(trend));
    
    // Determine if it's for coins or tokens
    const isCoins = lowercaseInput.includes('coin') || lowercaseInput.includes('coins');
    const isTokens = lowercaseInput.includes('token') || lowercaseInput.includes('tokens');
    
    return {
      isTrending,
      type: isCoins ? 'coin' : isTokens ? 'token' : null
    };
  };

  // Update the fetchTrendingTokens function
  const fetchTrendingTokens = async (limit, type = 'token') => {
    try {
      const response = await fetch('https://api.exchange.coinbase.com/products/volume-summary');
      if (!response.ok) throw new Error('Failed to fetch volume data');
      const volumeData = await response.json();

      // If requesting coins, return from predefined TOP_COINS list
      if (type === 'coin') {
        const coinsWithVolume = TOP_COINS.map(coin => {
          const volumeInfo = volumeData.find(v => 
            v.base_currency === coin.baseCurrency
          );
          return {
            ...coin,
            totalVolume: volumeInfo ? (
              parseFloat(volumeInfo.spot_volume_24hour || '0') + 
              parseFloat(volumeInfo.rfq_volume_24hour || '0') + 
              parseFloat(volumeInfo.conversion_volume_24hour || '0')
            ).toFixed(2) : '0'
          };
        });

        // Sort by volume and return limited number
        return coinsWithVolume
          .sort((a, b) => parseFloat(b.totalVolume) - parseFloat(a.totalVolume))
          .slice(0, limit);
      }

      // For tokens, filter out the major coins and problematic tokens
      const majorCoinSymbols = TOP_COINS.map(coin => coin.baseCurrency);
      const tokenData = volumeData.filter(token => {
        // Filter out major coins and tokens with problematic symbols
        const isNotMajorCoin = !majorCoinSymbols.includes(token.base_currency);
        const hasValidSymbol = !token.base_currency.includes('USD');
        const hasVolume = parseFloat(token.spot_volume_24hour || '0') > 0;
        return isNotMajorCoin && hasValidSymbol && hasVolume;
      });

      const sortedTokens = tokenData.sort((a, b) => {
        const aVolume = parseFloat(a.spot_volume_24hour || '0') + 
                      parseFloat(a.rfq_volume_24hour || '0') + 
                      parseFloat(a.conversion_volume_24hour || '0');
        const bVolume = parseFloat(b.spot_volume_24hour || '0') + 
                      parseFloat(b.rfq_volume_24hour || '0') + 
                      parseFloat(b.conversion_volume_24hour || '0');
        return bVolume - aVolume;
      });

      const topTokens = sortedTokens.slice(0, limit);
      return topTokens.map((token) => ({
        name: token.display_name,
        baseCurrency: token.base_currency,
        quoteCurrency: token.quote_currency,
        totalVolume: (
          parseFloat(token.spot_volume_24hour || '0') + 
          parseFloat(token.rfq_volume_24hour || '0') + 
          parseFloat(token.conversion_volume_24hour || '0')
        ).toFixed(2),
        markets: token.market_types.join(', ')
      }));
    } catch (error) {
      console.error('Error fetching trending data:', error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || !contractService) return;

    setIsLoading(true);
    try {
      const { hash, task, taskIndex } = await contractService.createTask(input);
      let aiResponse = '';

      // Add user message with transaction hash
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `${input}\n\nTransaction submitted! Hash: ${hash}`
        }
      ]);

      // Check for trending tokens request using the new function
      if (isTrendingRequest(input).isTrending) {
        const { type } = isTrendingRequest(input);
        if (type) {
          const numberMatch = input.match(/\d+/);
          const limit = numberMatch ? parseInt(numberMatch[0]) : 10;
          const trendingData = await fetchTrendingTokens(limit, type);
          
          if (trendingData.length > 0) {
            // Update the appropriate state based on type
            if (type === 'coin') {
              setTrendingCoins(trendingData);
            } else {
              setTrendingTokens(trendingData);
            }

            const recordHash = await contractService.createRecord(input);
            aiResponse = `Here are the top ${limit} trending ${type}s`;
            
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `${aiResponse}\n\nTransaction submitted! Hash: ${recordHash}`,
                showTrendingTokens: true,
                displayType: type,
                trendingData: trendingData // Store the data with the message
              }
            ]);
          }
        }
      } else {
        // For non-trending token requests, don't clear the tokens immediately
        const chartKeywords = ['chart', 'price', 'trading', 'tradingview'];
        const isChartRequest = chartKeywords.some(keyword => input.toLowerCase().includes(keyword));
        const requestedSymbol = extractSymbol(input);

        if (isChartRequest && requestedSymbol) {
          const recordHash = await contractService.createRecord(input);
          aiResponse = `Showing chart for ${requestedSymbol}`; // Set aiResponse
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `${aiResponse}\n\nTransaction submitted! Hash: ${recordHash}`
            },
            {
              role: "assistant",
              content: `/chart ${requestedSymbol}`
            }
          ]);
        } else {
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
        }
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index}>
              <ChatMessage
                role={message.role}
                content={message.content}
              />
              {/* Only show trending tokens for messages with the showTrendingTokens flag */}
              {message.showTrendingTokens && message.trendingData && message.trendingData.length > 0 && (
                <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-bold mb-2">
                    Trending {message.displayType === 'coin' ? 'Coins' : 'Tokens'}:
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {message.trendingData.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              setMessages(prev => [
                                ...prev,
                                {
                                  role: "assistant",
                                  content: `Showing chart for ${token.baseCurrency}`
                                },
                                {
                                  role: "assistant",
                                  content: `/chart ${token.baseCurrency}`
                                }
                              ]);
                              setTimeout(scrollToBottom, 100);
                            }}
                            className="flex items-center bg-blue-500 text-white rounded-lg px-4 py-2 mr-4 hover:bg-blue-600"
                          >
                            <img
                              src={getTokenIcon(token.baseCurrency, message.displayType === 'token')}
                              alt={token.name}
                              className="w-6 h-6 mr-2"
                              onError={(e) => {
                                if (message.displayType === 'token') {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmYTUwMCIgZD0iTTEyIDJDNi40NyAyIDIgNi40NyAyIDEyczQuNDcgMTAgMTAgMTAgMTAtNC40NyAxMC0xMFMxNy41MyAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIvPjxwYXRoIGZpbGw9IiNmZmE1MDAiIGQ9Ik0xMiA2Yy0zLjMxIDAtNiAyLjY5LTYgNnMyLjY5IDYgNiA2IDYtMi42OSA2LTYtMi42OS02LTYtNnptMCAxMGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9zdmc+';
                                } else {
                                  e.target.src = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/generic.png';
                                }
                                e.target.onerror = null;
                              }}
                            />
                            {token.name}
                          </button>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              Volume: {parseFloat(token.totalVolume).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              })}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-300">
                              {token.markets}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-300">
                          {token.quoteCurrency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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