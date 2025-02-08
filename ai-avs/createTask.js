import { ethers } from "ethers";
import "dotenv/config";

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY not found in environment variables");
}

const abi = [
  "function createNewTask(string memory contents) external returns ((string contents, uint32 taskCreatedBlock))",
];

async function main() {
  const contractAddress = "0x0313a120f4650aa80525f106033dcDEA61fB01A4";

  // Use HTTP provider for transactions
  const provider = new ethers.JsonRpcProvider(
    "https://rpc.holesky.ethpandaops.io"
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  // Text to analyze
  const textToAnalyze = "Explain what blockchain is in simple terms";

  try {
    console.log("📝 Submitting text for analysis:", textToAnalyze);
    const tx = await contract.createNewTask(textToAnalyze);

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ Task created successfully!");
    console.log("📜 Transaction hash:", tx.hash);
    console.log("🤖 The operator will now analyze this using DeepSeek LLM");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);
