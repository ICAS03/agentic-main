// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ISignatureUtils} from "../lib/eigenlayer-contracts/src/contracts/interfaces/ISignatureUtils.sol";
import {IAVSDirectory} from "../lib/eigenlayer-contracts/src/contracts/interfaces/IAVSDirectory.sol";
import {ECDSA} from "solady/utils/ECDSA.sol";

contract MyServiceManager {
    using ECDSA for bytes32;

    // State
    address public immutable avsDirectory;
    uint32 public latestTaskNum;
    mapping(address => bool) public operatorRegistered;
    mapping(uint32 => bytes32) public allTaskHashes;
    mapping(address => mapping(uint32 => bytes)) public allTaskResponses;

    // Events
    event NewTaskCreated(uint32 indexed taskIndex, Task task);

    event TaskResponded(
        uint32 indexed taskIndex,
        Task task,
        string response,
        address operator
    );
    
    event FundsTransferred(address indexed recipient, uint256 amount); 

    // Types
    struct Task {
        string contents;
        uint32 taskCreatedBlock;
    }

    // Modifiers
    modifier onlyOperator() {
        require(operatorRegistered[msg.sender], "Operator must be the caller");
        _;
    }

    // Constructor
    constructor(address _avsDirectory) {
        avsDirectory = _avsDirectory;
    }

    // Function to receive ETH directly
    receive() external payable {}

    // Fallback function for unexpected calls
    fallback() external payable {}


    // Register Operator
    function registerOperatorToAVS(
        address operator,
        ISignatureUtils.SignatureWithSaltAndExpiry memory operatorSignature
    ) external {
        IAVSDirectory(avsDirectory).registerOperatorToAVS(
            operator,
            operatorSignature
        );
        operatorRegistered[operator] = true;
    }

    // Deregister Operator
    function deregisterOperatorFromAVS(address operator) external onlyOperator {
        require(msg.sender == operator);
        IAVSDirectory(avsDirectory).deregisterOperatorFromAVS(operator);
        operatorRegistered[operator] = false;
    }

    // Create Task
    function createNewTask(
        string memory contents
    ) external returns (Task memory) {
        // create a new task struct
        Task memory newTask;
        newTask.contents = contents;
        newTask.taskCreatedBlock = uint32(block.number);

        // store hash of task onchain, emit event, and increase taskNum
        allTaskHashes[latestTaskNum] = keccak256(abi.encode(newTask));
        emit NewTaskCreated(latestTaskNum, newTask);
        latestTaskNum = latestTaskNum + 1;

        return newTask;
    }

    // Respond to Task
    function respondToTask(
        Task calldata task,
        uint32 referenceTaskIndex,
        string calldata response,
        bytes memory signature
    ) external onlyOperator {
        // check that the task is valid, hasn't been responsed yet, and is being responded in time
        require(
            keccak256(abi.encode(task)) == allTaskHashes[referenceTaskIndex],
            "supplied task does not match the one recorded in the contract"
        );
        require(
            allTaskResponses[msg.sender][referenceTaskIndex].length == 0,
            "Operator has already responded to the task"
        );

        // The message that was signed
        bytes32 messageHash = keccak256(
            abi.encodePacked(response, task.contents)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        if (ethSignedMessageHash.recover(signature) != msg.sender) {
            revert();
        }

        // updating the storage with task responses
        allTaskResponses[msg.sender][referenceTaskIndex] = signature;

        // emitting event
        emit TaskResponded(referenceTaskIndex, task, response, msg.sender);
    }

    function transferFunds(address payable recipient, uint256 amount) external payable {
    require(address(this).balance >= amount, "Insufficient balance");
    (bool success, ) = recipient.call{value: amount}("");
    require(success, "Transfer failed");
}
}
