import { ethers } from "hardhat";

async function main() {
  const TOKEN_ADDRESS = "0xE560dBc970bB0347ABD1582A20a0f65C35795171";
  const RECIPIENT = "0x45c1aa128561163302FED06445134bBd61a35165";
  const AMOUNT = 1000;

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Recipient address: ${RECIPIENT}`);

  const token = await ethers.getContractAt("ConfidentialTestToken", TOKEN_ADDRESS);
  
  // Verify owner
  try {
    const owner = await token.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error(`Deployer is not the owner! Owner is ${owner}`);
    }
    console.log("Owner verification passed.");
  } catch (error: any) {
    console.log("Owner verification skipped or failed:", error.message);
  }

  console.log(`Minting ${AMOUNT} tokens to ${RECIPIENT}...`);
  const tx = await token.mint(RECIPIENT, AMOUNT);
  console.log(`Transaction Hash: ${tx.hash}`);
  
  console.log("Waiting for transaction to be mined...");
  const receipt = await tx.wait(1);
  console.log(`Transaction Status: ${receipt?.status === 1 ? "SUCCESS" : "FAILED"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
