import { CdpWalletProvider } from "./wallet-providers/cdpWalletProvider";
import dotenv from "dotenv";

dotenv.config();

async function performTrade() {
  try {
    // Configure wallet provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      networkId: process.env.NETWORK_ID || "base-mainnet",  // Use a mainnet network for trading
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Trade parameters
    const tradeArgs = {
      amount: BigInt("100000000000000"),  // Amount to trade in atomic units (0.00001 ETH in wei)
      fromAssetId: "eth",                     // Asset to trade from (e.g., ETH)
      toAssetId: "usdc",                      // Asset to trade to (e.g., USDC)
    };

    // Execute the trade
    const tradeResult = await walletProvider.createTrade({
      amount: tradeArgs.amount,
      fromAssetId: tradeArgs.fromAssetId,
      toAssetId: tradeArgs.toAssetId,
    });

    const result = await tradeResult.wait();

    // Display trade details
    console.log("Trade Successful:");
    console.log(`- Amount traded: ${tradeArgs.amount.toString()} ${tradeArgs.fromAssetId}`);
    console.log(`- Amount received: ${result.getToAmount()} ${tradeArgs.toAssetId}`);
    console.log(`- Transaction hash: ${result.getTransaction().getTransactionHash()}`);
    console.log(`- Transaction link: ${result.getTransaction().getTransactionLink()}`);
  } catch (error) {
    console.error("Error executing trade:", error);
  }
}

runTrade();
