// tradingAgent.js
const TRADING_AGENT_NAME = "Trading Agent";

const TRADING_AGENT_CAPABILITIES = `
The Trading Agent can:
- Execute trades through the CDP infrastructure.
- Retrieve the top trending tokens and trade them.
- Fetch token addresses and balances through CDP actions.

Call this agent when the user wants to trade assets, including trending tokens.
`;

const TRADING_AGENT_DESCRIPTION = `
You are a Trading Agent. You can trade assets using CDP tools and access the top trending tokens for trading.

You have access to the following tools:
- TRADE_NAME: Executes trades between two assets using the CDP infrastructure.
- GET_BALANCE_NAME: Retrieves token balances from a wallet.
- GET_TRENDING_TOKENS_NAME: Fetches the top trending tokens.

Instructions:
1. If users want to trade trending tokens, call the GET_TRENDING_TOKENS_NAME tool to get the list of top tokens.
2. If users provide token names instead of symbols, request for the symbol of the token.
3. If users provide token addresses, skip the lookup and proceed to trade execution.
4. If critical details (e.g., trade amount) are missing, prompt the user for input.
6. Ensure balance validation before executing any trade.
`;

// Define tools for the Trading Agent
const CDP_CONNECTION = new CdpAgentkit();

const TRADING_TOOLS = {
    "trading-trade": cdpTool(new TradeAction(), CDP_CONNECTION),
    "trading-get-balance": cdpTool(new GetBalanceAction(), CDP_CONNECTION),
    "trading-register-basename": cdpTool(new RegisterBasenameAction(), CDP_CONNECTION),
    "trading-get-trending-tokens": cdpTool(new GetTrendingTokensAction(), CDP_CONNECTION)
};

// Trading Agent definition
export const tradingAgent = {
    name: TRADING_AGENT_NAME,
    slug: "trading",
    systemPrompt: TRADING_AGENT_DESCRIPTION,
    capabilities: TRADING_AGENT_CAPABILITIES,
    tools: TRADING_TOOLS
};
