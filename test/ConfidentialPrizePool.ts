import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ConfidentialPrizePool, ConfidentialTestToken, MockYieldSource } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialPrizePool Security and Core Logic", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner };
  let pool: ConfidentialPrizePool;
  let token: ConfidentialTestToken;
  let yieldSource: MockYieldSource;
  let poolAddress: string;
  let tokenAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    const tokenFactory = await ethers.getContractFactory("ConfidentialTestToken");
    token = (await tokenFactory.deploy()) as unknown as ConfidentialTestToken;
    tokenAddress = await token.getAddress();

    const poolFactory = await ethers.getContractFactory("ConfidentialPrizePool");
    pool = (await poolFactory.deploy(tokenAddress)) as unknown as ConfidentialPrizePool;
    poolAddress = await pool.getAddress();

    const yieldSourceFactory = await ethers.getContractFactory("MockYieldSource");
    yieldSource = (await yieldSourceFactory.deploy(tokenAddress)) as unknown as MockYieldSource;

    // Mint initial tokens to Alice and Bob
    await (await token.mint(signers.alice.address, 1000n)).wait();
    await (await token.mint(signers.bob.address, 1000n)).wait();

    // Transfer ownership of token to MockYieldSource so it can mint yield
    const yieldSourceAddress = await yieldSource.getAddress();
    await (await token.transferOwnership(yieldSourceAddress)).wait();
  });

  async function encryptAndTransferAndCall(signer: HardhatEthersSigner, amount: bigint, to: string) {
    const encryptedAmount = await fhevm
      .createEncryptedInput(tokenAddress, signer.address)
      .add64(amount)
      .encrypt();

    const tx = await token
      .connect(signer)
      .transferAndCall(to, encryptedAmount.handles[0], encryptedAmount.inputProof);
    await tx.wait();
  }

  async function encryptAndWithdraw(signer: HardhatEthersSigner, amount: bigint) {
    const encryptedAmount = await fhevm
      .createEncryptedInput(poolAddress, signer.address)
      .add64(amount)
      .encrypt();

    const tx = await pool
      .connect(signer)
      .withdraw(encryptedAmount.handles[0], encryptedAmount.inputProof);
    await tx.wait();
  }

  async function decryptBalance(contractAddress: string, encryptedHandle: bigint, signer: HardhatEthersSigner) {
    return await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedHandle,
      contractAddress,
      signer
    );
  }

  it("1,2,3. Alice and Bob deposit real tokens; neither can create fake balances", async function () {
    await encryptAndTransferAndCall(signers.alice, 100n, poolAddress);
    await encryptAndTransferAndCall(signers.bob, 300n, poolAddress);

    // Verify pool balances
    const alicePoolBal = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.alice.address), signers.alice);
    const bobPoolBal = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.bob.address), signers.bob);

    expect(alicePoolBal).to.equal(100n);
    expect(bobPoolBal).to.equal(300n);

    // Try to deposit more than owned
    await encryptAndTransferAndCall(signers.alice, 5000n, poolAddress);
    // Should not increase pool balance because token logic prevents it (transfers 0)
    const alicePoolBalAfter = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.alice.address), signers.alice);
    expect(alicePoolBalAfter).to.equal(100n);
  });

  it("4,5,6. Alice can withdraw only her principal; Double withdrawal fails", async function () {
    await encryptAndTransferAndCall(signers.alice, 100n, poolAddress);
    
    // Alice tries to withdraw 150n
    await encryptAndWithdraw(signers.alice, 150n);
    
    // Because it's bounded by FHE.select, she gets 0 back (or reverts depending on token logic, our logic says transfer 0)
    let alicePoolBal = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.alice.address), signers.alice);
    expect(alicePoolBal).to.equal(100n);

    // Alice withdraws 100n
    await encryptAndWithdraw(signers.alice, 100n);
    alicePoolBal = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.alice.address), signers.alice);
    expect(alicePoolBal).to.equal(0n);

    // Double withdraw
    await encryptAndWithdraw(signers.alice, 100n);
    alicePoolBal = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.alice.address), signers.alice);
    expect(alicePoolBal).to.equal(0n);
  });

  it("7,8,9,10. Prize comes only from yield; Principal is safe; Claim logic", async function () {
    await encryptAndTransferAndCall(signers.alice, 100n, poolAddress);
    await encryptAndTransferAndCall(signers.bob, 300n, poolAddress);

    // Mock yield 1000n
    await (await yieldSource.generateYield(poolAddress, 1000n)).wait();

    // Trigger draw
    await (await pool.triggerDraw()).wait();
    const drawId = await pool.currentDrawId();

    // Both try to claim
    await (await pool.connect(signers.alice).claimPrize(drawId)).wait();
    await (await pool.connect(signers.bob).claimPrize(drawId)).wait();

    // Check balances
    const aliceBal = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.alice.address), signers.alice);
    const bobBal = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.bob.address), signers.bob);

    // One winner gets +1000, other gets +0.
    // Both principals are safe.
    expect(aliceBal + bobBal).to.equal(1400n);
    
    // Double claim has no effect
    await (await pool.connect(signers.alice).claimPrize(drawId)).wait();
    const aliceBalAfter = await decryptBalance(poolAddress, await pool.encryptedBalances(signers.alice.address), signers.alice);
    expect(aliceBalAfter).to.equal(aliceBal);
  });

  it("11,12. Unauthorized user cannot decrypt another's balance; Deposits remain confidential", async function () {
    await encryptAndTransferAndCall(signers.alice, 100n, poolAddress);
    
    const encryptedBalance = await pool.encryptedBalances(signers.alice.address);
    
    let caught = false;
    try {
      await decryptBalance(poolAddress, encryptedBalance, signers.bob);
    } catch (e: any) {
      caught = true;
    }
    expect(caught).to.be.true;
  });
});
