// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AvelaVault} from "../src/AvelaVault.sol";
import {AvelaPaymentRouter} from "../src/AvelaPaymentRouter.sol";

contract DeployScript is Script {
    // MVP token whitelist (X Layer mainnet)
    address constant wSPYx = 0xE7E553Cd128F0011777323A0b44a7b96EA1CB540;
    address constant wQQQx = 0x4C1AE29c159838fC1b224636E28E086EB69101f7;
    address constant wNVDAx = 0xa8ddb5Cd96b5222AFe198316E9A57CAA642850D5;
    address constant wGOOGLx = 0xf8c5308F80E459bb53d9EbE689854d9cBb2Caa6f;
    address constant wAAPLx = 0x943BF64D566c32A2Bcd41AC92FB63C111cC9De8f;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        // Deploy Vault
        AvelaVault vault = new AvelaVault(deployer);
        console.log("AvelaVault deployed to:", address(vault));

        // Whitelist MVP tokens
        vault.setWhitelisted(wSPYx, true);
        vault.setWhitelisted(wQQQx, true);
        vault.setWhitelisted(wNVDAx, true);
        vault.setWhitelisted(wGOOGLx, true);
        vault.setWhitelisted(wAAPLx, true);
        console.log("Whitelisted 5 MVP tokens");

        // Deploy Router (deployer is both owner and initial signer)
        AvelaPaymentRouter router = new AvelaPaymentRouter(deployer, deployer);
        console.log("AvelaPaymentRouter deployed to:", address(router));

        vm.stopBroadcast();

        console.log("--- Deployment Summary ---");
        console.log("Vault:", address(vault));
        console.log("Router:", address(router));
        console.log("Owner:", deployer);
        console.log("Authorized Signer:", deployer);
    }
}
