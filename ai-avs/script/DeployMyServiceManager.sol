// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MyServiceManager} from "../src/MyServiceManager.sol";
import {IDelegationManager} from "../lib/eigenlayer-contracts/src/contracts/interfaces/IDelegationManager.sol";
import {AVSDirectory} from "../lib/eigenlayer-contracts/src/contracts/core/AVSDirectory.sol";
import {ISignatureUtils} from "../lib/eigenlayer-contracts/src/contracts/interfaces/ISignatureUtils.sol";

contract DeployMyServiceManager is Script {
    // Eigen Core Contracts
    address internal constant AVS_DIRECTORY =
        0x055733000064333CaDDbC92763c58BF0192fFeBf;
    address internal constant DELEGATION_MANAGER =
        0xA44151489861Fe9e3055d95adC98FbD462B948e7;

    address internal deployer;
    address internal operator;
    MyServiceManager serviceManager;

    // Setup
    function setUp() public virtual {
        deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        operator = vm.rememberKey(vm.envUint("OPERATOR_PRIVATE_KEY"));
        vm.label(deployer, "Deployer");
        vm.label(operator, "Operator");
    }

    function run() public {
        // Deploy
        vm.startBroadcast(deployer);
        serviceManager = new MyServiceManager(AVS_DIRECTORY);
        vm.stopBroadcast();

        // Register as an operator
        IDelegationManager delegationManager = IDelegationManager(DELEGATION_MANAGER);

        // Check if operator is already registered
        if (!delegationManager.isOperator(operator)) {
            vm.startBroadcast(operator);
            try delegationManager.registerAsOperator(
                address(0),  // delegationApprover
                0,          // allocationDelay 
                ""         // metadataURI
            ) {
                console.log("Operator registered successfully");
            } catch Error(string memory reason) {
                console.log("Registration failed:", reason);
                revert(reason);
            } catch {
                console.log("Registration failed with no reason");
                revert("Registration failed");
            }
            vm.stopBroadcast();
        } else {
            console.log("Operator already registered");
        }

        // Register operator to AVS
        AVSDirectory avsDirectory = AVSDirectory(AVS_DIRECTORY);
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, operator));
        uint256 expiry = block.timestamp + 1 hours;

        bytes32 operatorRegistrationDigestHash = avsDirectory
            .calculateOperatorAVSRegistrationDigestHash(
                operator,
                address(serviceManager),
                salt,
                expiry
            );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            vm.envUint("OPERATOR_PRIVATE_KEY"),
            operatorRegistrationDigestHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        ISignatureUtils.SignatureWithSaltAndExpiry
            memory operatorSignature = ISignatureUtils
                .SignatureWithSaltAndExpiry({
                    signature: signature,
                    salt: salt,
                    expiry: expiry
                });

        vm.startBroadcast(operator);
        serviceManager.registerOperatorToAVS(operator, operatorSignature);
        vm.stopBroadcast();
    }
}
