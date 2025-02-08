import { CdpWalletProvider } from "./wallet-providers/cdpWalletProvider";
import dotenv from "dotenv";

dotenv.config();

/**
 * Initializes and returns a configured wallet provider.
 *
 * @returns {Promise<CdpWalletProvider>} A wallet provider instance.
 */
export async function getWalletProvider(): Promise<CdpWalletProvider> {
  const config = {
    apiKeyName: process.env.CDP_API_KEY_NAME,
    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    networkId: process.env.NETWORK_ID || "base-mainnet",
  };

  return CdpWalletProvider.configureWithWallet(config);
}
