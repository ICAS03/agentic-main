import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xDe1e04366D466bd9605447c9536fc0c907DCfB55';
const HOLESKY_RPC = 'https://ethereum-holesky.publicnode.com';

const ABI = [
    'function createNewTask(string memory contents) external returns ((string contents, uint32 taskCreatedBlock))',
    'function respondToTask((string contents, uint32 taskCreatedBlock) task, uint32 referenceTaskIndex, string response, bytes memory signature) external',
    'event NewTaskCreated(uint32 indexed taskIndex, (string contents, uint32 taskCreatedBlock) task)',
    'event TaskResponseReceived(uint32 indexed taskIndex, string response)'
];

class ContractService {
    constructor() {
        if (!window.ethereum) {
            throw new Error('MetaMask not found! Please install MetaMask.');
        }
        // Initialize with MetaMask provider
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.provider);
    }

    async ensureHoleskyNetwork() {
        try {
            // Request network switch to Holesky
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x4268' }], // 17000 in hex
            });
        } catch (switchError) {
            // If Holesky network is not added, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x4268',
                        chainName: 'Holesky',
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                        rpcUrls: [HOLESKY_RPC],
                        blockExplorerUrls: ['https://holesky.etherscan.io']
                    }]
                });
            } else {
                throw switchError;
            }
        }
    }

    async createSignature(signer, response, contents) {
        const messageHash = ethers.solidityPackedKeccak256(
            ['string', 'string'],
            [response, contents]
        );
        const signature = await signer.signMessage(ethers.getBytes(messageHash));
        return signature;
    }

    async createTask(content) {
        try {
            await this.ensureHoleskyNetwork();
            const signer = await this.provider.getSigner();
            const contractWithSigner = this.contract.connect(signer);

            console.log('Creating task on Holesky...');
            const tx = await contractWithSigner.createNewTask(content);
            console.log('Transaction sent:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Receipt:', receipt);

            // Parse events
            let taskIndex;
            for (const log of receipt.logs) {
                try {
                    const parsedLog = this.contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    
                    if (parsedLog && parsedLog.name === 'NewTaskCreated') {
                        taskIndex = parsedLog.args[0];
                        break;
                    }
                } catch (e) {
                    console.log('Failed to parse log:', e);
                    continue;
                }
            }

            if (taskIndex === undefined) {
                throw new Error('NewTaskCreated event not found in transaction receipt');
            }

            console.log('Task created with index:', taskIndex);

            return {
                hash: tx.hash,
                task: {
                    contents: content,
                    taskCreatedBlock: receipt.blockNumber
                },
                taskIndex: taskIndex
            };
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    async respondToTask(task, taskIndex, response) {
        try {
            await this.ensureHoleskyNetwork();
            const signer = await this.provider.getSigner();
            
            console.log('Responding to task on Holesky:', { task, taskIndex, response });
            const signature = await this.createSignature(signer, response, task.contents);
            const contractWithSigner = this.contract.connect(signer);
            
            const tx = await contractWithSigner.respondToTask(
                task,
                taskIndex,
                response,
                signature
            );
            
            const receipt = await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error responding to task:', error);
            throw error;
        }
    }

    async getAIResponse(content) {
        try {
            const response = await fetch('/api/ai-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('AI Response Error:', error);
            throw error;
        }
    }

    listenToNewTasks(callback) {
        this.contract.on('NewTaskCreated', callback);
        return () => this.contract.off('NewTaskCreated', callback);
    }

    listenToResponses(callback) {
        this.contract.on('TaskResponseReceived', callback);
        return () => this.contract.off('TaskResponseReceived', callback);
    }
}

export default ContractService; 