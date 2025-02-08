import { ethers } from "ethers";
import ollama from "ollama";
import "dotenv/config";

if (!process.env.OPERATOR_PRIVATE_KEY) {
  throw new Error("OPERATOR_PRIVATE_KEY not found in environment variables");
}

const abi = [
  "function respondToTask((string contents, uint32 taskCreatedBlock) task, uint32 referenceTaskIndex, string response, bytes memory signature) external",
  "event NewTaskCreated(uint32 indexed taskIndex, (string contents, uint32 taskCreatedBlock) task)",
];

async function createSignature(wallet, response, contents) {
  // Match the contract's signature creation
  const messageHash = ethers.solidityPackedKeccak256(
    ["string", "string"],
    [response, contents]
  );
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  return signature;
}

async function main() {
  const contractAddress = "0x0313a120f4650aa80525f106033dcDEA61fB01A4";

  // Use WebSocket provider for reliable event listening
  const provider = new ethers.WebSocketProvider(
    "wss://ethereum-holesky.publicnode.com"
  );
  const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  console.log("🚀 Starting operator service...");
  console.log("Waiting for tasks to analyze with DeepSeek LLM...");

  // First test LLM connection
  try {
    console.log("Testing LLM connection...");
    const testResponse = await ollama.chat({
      model: "deepseek-r1:1.5b",
      messages: [{ role: "user", content: "test" }],
    });
    console.log("✅ LLM is working");
  } catch (error) {
    console.error("❌ LLM test failed:", error);
    process.exit(1);
  }

  // Listen for new tasks
  contract.on("NewTaskCreated", async (taskIndex, task) => {
    console.log("\n📥 New task received:", {
      index: taskIndex,
      text: task.contents,
    });

    try {
      console.log("🤖 Asking DeepSeek to analyze:", task.contents);
      const response = await ollama.chat({
        model: "deepseek-r1:1.5b",
        messages: [{ role: "user", content: task.contents }],
      });

      const finalResponse =
        response.message.content.split("</think>")[1]?.trim() ||
        response.message.content;
      console.log("✨ DeepSeek response:", finalResponse);

      console.log("📤 Submitting response to blockchain...");
      const signature = await createSignature(
        wallet,
        finalResponse,
        task.contents
      );

      // Create task struct exactly as contract expects
      const taskStruct = {
        contents: task.contents,
        taskCreatedBlock: task.taskCreatedBlock,
      };

      console.log("Sending task:", {
        task: taskStruct,
        taskIndex: Number(taskIndex),
        response: finalResponse,
        signature,
      });

      const tx = await contract.respondToTask(
        taskStruct,
        taskIndex,
        finalResponse,
        signature
      );

      console.log("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Response submitted! Transaction:", tx.hash);
    } catch (error) {
      console.error("❌ Error processing task:", error);
      console.error("Error details:", error.error || error);
    }
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("Stopping task watcher...");
    provider.destroy();
    process.exit();
  });

  // Keep alive
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
