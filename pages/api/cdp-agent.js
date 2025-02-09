import fs from 'fs';
import dotenv from 'dotenv';
import {
  AgentKit,
  CdpWalletProvider,
//   wethActionProvider,
  walletActionProvider,
//   erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
} from '@coinbase/agentkit';
import { getLangChainTools } from '@coinbase/agentkit-langchain';
import { HumanMessage } from '@langchain/core/messages';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { perplexityResearchProvider } from '../../ai/research_action'

dotenv.config();
const WALLET_DATA_FILE = 'wallet_data.txt';

export default async function handler(req, res) {
  console.log('Request received:', req.method, req.body); // Print the request method and body
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method); // Print the method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userMessage } = JSON.parse(req.body || '{}');
  if (!userMessage) {
    console.log('No user message provided:', userMessage); // Print the user message provided
    return res.status(400).json({ error: 'No user message provided' });
  }

  // Basic environment validation
  const requiredVars = ['OPENAI_API_KEY', 'CDP_API_KEY_NAME', 'CDP_API_KEY_PRIVATE_KEY'];
  for (const v of requiredVars) {
    if (!process.env[v]) {
      console.log(`Missing env var: ${v}`); // Print the missing environment variable
      return res.status(500).json({ error: `Missing env var: ${v}` });
    }
  }

  // Read existing wallet data if available
  let walletDataStr = null;
  if (fs.existsSync(WALLET_DATA_FILE)) {
    try {
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, 'utf8');
      console.log('Wallet data read:', walletDataStr); // Print the wallet data read
    } catch (e) {
      console.error('Error reading wallet data:', e);
    }
  }

  // Configure AgentKit + providers
  const config = {
    apiKeyName: process.env.CDP_API_KEY_NAME,
    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    cdpWalletData: walletDataStr || undefined,
    networkId: process.env.NETWORK_ID || 'base-sepolia',
  };
//   console.log('AgentKit configuration:', config); // Print the AgentKit configuration

  try {
    // Init wallet + agent
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    console.log('Wallet provider initialized:', walletProvider); // Print the initialized wallet provider

    const agentKit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        pythActionProvider(),
        walletActionProvider(),
        cdpApiActionProvider({
            apiKeyName: process.env.CDP_API_KEY_NAME,
            apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        perplexityResearchProvider(),
      ],
    });
    console.log('AgentKit initialized:', agentKit); // Print the initialized AgentKit

    const tools = await getLangChainTools(agentKit);
    console.log('LangChain tools initialized:', tools); // Print the initialized LangChain tools
    const memory = new MemorySaver();
    console.log('Memory saver initialized:', memory); // Print the initialized memory saver
    const agentConfig = { configurable: { thread_id: "CDP AgentKit Chatbot Example!" } };

    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });


    console.log('ChatOpenAI initialized:', llm); // Print the initialized ChatOpenAI

    // Create the agent
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier:`
      You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
      empowered to interact onchain using your tools. If you ever need funds, you can request them from the 
      faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet details and request 
      funds from the user. Before executing your first action, get the wallet details to see what network 
      you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
      asks you to do something you can't do with your currently available tools, you must say so. Be concise and helpful with your responses. Refrain from 
      restating your tools' descriptions unless it is explicitly requested.
      `,    });
    // console.log('Agent created:', agent); // Print the created agent

    // Get the agent response
    const response = await agent.stream({ messages: [new HumanMessage(userMessage)] },agentConfig);
    // console.log('Agent response received:', response); // Print the agent response

    let compiledChunks = [];

    for await (const chunk of response) {
        console.log('Received chunk:', chunk); // Log the entire chunk to see its structure
        if ("agent" in chunk) {
            compiledChunks.push(chunk.agent.messages[0].content);
            compiledChunks.push("\n");
            
        }else if ("tools" in chunk) {
            const tool = chunk.tools.messages[0];
            if (tool.name !== "research_latest_news") {
                compiledChunks.push(tool.content);
                compiledChunks.push("\n");
            }
        }
    }

    // Save updated wallet data if needed
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));
    console.log('Wallet data saved:', exportedWallet); // Print the saved wallet data

    // Return the bot response to the client
    res.status(200).json({ botResponse: compiledChunks?.join('') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
