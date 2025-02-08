import fs from 'fs';
import dotenv from 'dotenv';
import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
} from '@coinbase/agentkit';
import { getLangChainTools } from '@coinbase/agentkit-langchain';
import { HumanMessage } from '@langchain/core/messages';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

dotenv.config();
const WALLET_DATA_FILE = 'wallet_data.txt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userMessage } = JSON.parse(req.body || '{}');
  if (!userMessage) {
    return res.status(400).json({ error: 'No user message provided' });
  }

  // Basic environment validation
  const requiredVars = ['OPENAI_API_KEY', 'CDP_API_KEY_NAME', 'CDP_API_KEY_PRIVATE_KEY'];
  for (const v of requiredVars) {
    if (!process.env[v]) {
      return res.status(500).json({ error: `Missing env var: ${v}` });
    }
  }

  // Read existing wallet data if available
  let walletDataStr = null;
  if (fs.existsSync(WALLET_DATA_FILE)) {
    try {
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, 'utf8');
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

  try {
    // Init wallet + agent
    const walletProvider = await CdpWalletProvider.configureWithWallet(config);
    const agentKit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      ],
    });

    const tools = await getLangChainTools(agentKit);
    const memory = new MemorySaver();
    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

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
      asks you to do something you can't do with your currently available tools, you must say so, and 
      encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to 
      docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from 
      restating your tools' descriptions unless it is explicitly requested.
      `,    });

    // Get the agent response
    const response = await agent.call({ messages: [new HumanMessage(userMessage)] });

    // Save updated wallet data if needed
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    // Return the bot response to the client
    res.status(200).json({ botResponse: response?.content || 'No response' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
