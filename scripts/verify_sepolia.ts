import { ethers } from "hardhat";
import { createInstance } from "fhevmjs";
import { ConfidentialPrizePool, ConfidentialTestToken, MockYieldSource } from "../types";

async function main() {
  console.log("=== SEPOLIA INTEGRATION VERIFICATION ===");

  const POOL_ADDRESS = "0x869ed12fA618dAeD3340dB5C3738D1F3A3d0Ab9b";
  const TOKEN_ADDRESS = "0xE560dBc970bB0347ABD1582A20a0f65C35795171";
  const YIELD_ADDRESS = "0xBE0a7E9906A077266CD158B2e2950B8F8aA2B0C0";

  const [signer] = await ethers.getSigners();
  console.log("Executing as:", signer.address);

  const token = await ethers.getContractAt("ConfidentialTestToken", TOKEN_ADDRESS) as unknown as ConfidentialTestToken;
  const pool = await ethers.getContractAt("ConfidentialPrizePool", POOL_ADDRESS) as unknown as ConfidentialPrizePool;
  const yieldSource = await ethers.getContractAt("MockYieldSource", YIELD_ADDRESS) as unknown as MockYieldSource;

  const instance = await createInstance({ 
    networkUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
    chainId: 11155111, 
    kmsContractAddress: "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A", 
    aclContractAddress: "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D" 
  });

  // Step 2: Obtain test tokens.
  console.log("\n--- Step 2: Obtain Tokens ---");
  const mintTx = await token.mint(signer.address, 1000n);
  await mintTx.wait(1);
  console.log("Minted 1000 test tokens.");

  const decryptBalance = async (contractAddress: string, handleMethod: () => Promise<bigint>) => {
    const handle = await handleMethod();
    if (handle === 0n) return 0n;
    const { publicKey, privateKey } = instance.generateKeypair();
    const eip712 = instance.createEIP712(publicKey, contractAddress);
    const signature = await signer.signTypedData(eip712.domain, { Reencrypt: eip712.types.Reencrypt }, eip712.message);
    return await instance.reencrypt(
      handle,
      privateKey,
      publicKey,
      signature.replace("0x", ""),
      contractAddress,
      signer.address
    );
  };

  let userTokenBal = await decryptBalance(TOKEN_ADDRESS, async () => await token.getBalance());
  let poolInternalBal = await decryptBalance(POOL_ADDRESS, async () => await pool.encryptedBalances(signer.address));
  console.log(`BEFORE DEPOSIT -> User Token Balance: ${userTokenBal} | Pool Accounting: ${poolInternalBal}`);

  // Step 3: Real Encrypted Deposit
  console.log("\n--- Step 3: Real Encrypted Deposit (100n) ---");
  const input = instance.createEncryptedInput(TOKEN_ADDRESS, signer.address);
  input.add64(100);
  const encryptedAmount = await input.encrypt();
  
  const depTx = await token.transferAndCall(POOL_ADDRESS, encryptedAmount.handles[0], encryptedAmount.inputProof);
  await depTx.wait(1);

  // Step 4 & 5: Verify accounting & decrypt balance
  userTokenBal = await decryptBalance(TOKEN_ADDRESS, async () => await token.getBalance());
  poolInternalBal = await decryptBalance(POOL_ADDRESS, async () => await pool.encryptedBalances(signer.address));
  console.log(`AFTER DEPOSIT -> User Token Balance: ${userTokenBal} | Pool Accounting: ${poolInternalBal}`);

  // Step 6: Generate Yield
  console.log("\n--- Step 6: Generate Mock Yield (500n) ---");
  const owner = await token.owner();
  if (owner === signer.address) {
    await (await token.transferOwnership(YIELD_ADDRESS)).wait(1);
  }
  const yieldTx = await yieldSource.generateYield(POOL_ADDRESS, 500n);
  await yieldTx.wait(1);
  console.log("Yield generated.");

  // Step 7: Trigger draw
  console.log("\n--- Step 7: Trigger Draw ---");
  const drawTx = await pool.triggerDraw();
  await drawTx.wait(1);
  const currentDraw = await pool.currentDrawId();
  console.log(`Draw #${currentDraw} triggered.`);

  // Step 8 & 9: Verify winner & claim prize
  console.log("\n--- Step 8 & 9: Verify Winner and Claim ---");
  const claimTx = await pool.claimPrize(currentDraw);
  await claimTx.wait(1);
  
  poolInternalBal = await decryptBalance(POOL_ADDRESS, async () => await pool.encryptedBalances(signer.address));
  console.log(`AFTER CLAIM -> Pool Accounting: ${poolInternalBal}`);

  // Step 10 & 11: Withdraw
  console.log("\n--- Step 10: Withdraw Principal + Prize (600n) ---");
  const wInput = instance.createEncryptedInput(POOL_ADDRESS, signer.address);
  wInput.add64(600);
  const encW = await wInput.encrypt();
  const wTx = await pool.withdraw(encW.handles[0], encW.inputProof);
  await wTx.wait(1);

  userTokenBal = await decryptBalance(TOKEN_ADDRESS, async () => await token.getBalance());
  poolInternalBal = await decryptBalance(POOL_ADDRESS, async () => await pool.encryptedBalances(signer.address));
  console.log(`AFTER WITHDRAW -> User Token Balance: ${userTokenBal} | Pool Accounting: ${poolInternalBal}`);

  console.log("\n--- Step 11: Try Double Withdraw (600n) ---");
  const encW2 = await wInput.encrypt();
  const wTx2 = await pool.withdraw(encW2.handles[0], encW2.inputProof);
  await wTx2.wait(1);
  
  const finalPoolInternal = await decryptBalance(POOL_ADDRESS, async () => await pool.encryptedBalances(signer.address));
  console.log(`AFTER DOUBLE WITHDRAW -> Pool Accounting: ${finalPoolInternal}`);

  console.log("\n=== VERIFICATION COMPLETE ===");
}

main().catch(console.error);
