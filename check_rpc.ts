import { ethers } from "hardhat";

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("Connected to network:", network.name, "chainId:", network.chainId);
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("Current block number:", blockNumber);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
