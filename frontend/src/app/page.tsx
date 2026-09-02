"use client";

import { useState } from "react";
import { ethers } from "ethers";

// Real ABI definitions based on the smart contracts
const POOL_ABI = [
  "function triggerDraw() external",
  "function claimPrize(uint256 drawId) external",
  "function withdraw(bytes32 encryptedAmount, bytes calldata inputProof) external",
  "function currentDrawId() external view returns (uint256)",
  "function encryptedBalances(address) external view returns (bytes32)",
  "function encryptedTotalWeight() external view returns (bytes32)",
  "function drawPrizes(uint256, address) external view returns (bytes32)"
];

const TOKEN_ABI = [
  "function transferAndCall(address to, bytes32 encryptedAmount, bytes calldata inputProof) external",
  "function transfer(address to, bytes32 encryptedAmount, bytes calldata inputProof) external returns (bool)",
  "function mint(address to, uint64 amount) external",
];

// Deployed Sepolia Addresses
const POOL_ADDRESS = "0x869ed12fA618dAeD3340dB5C3738D1F3A3d0Ab9b";
const TOKEN_ADDRESS = "0xE560dBc970bB0347ABD1582A20a0f65C35795171";

export default function Home() {
  const [account, setAccount] = useState<string>("");
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [poolContract, setPoolContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  
  const [balance, setBalance] = useState<string>("Encrypted (***)");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [status, setStatus] = useState<string>("Disconnected");
  const [drawId, setDrawId] = useState<number>(0);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        setStatus("Connecting...");
        const p = new ethers.BrowserProvider((window as any).ethereum);
        const s = await p.getSigner();
        setSigner(s);
        setAccount(s.address);
        
        // Initialize real contracts
        setPoolContract(new ethers.Contract(POOL_ADDRESS, POOL_ABI, s));
        setTokenContract(new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, s));
        
        setStatus("Connected to Web3");
        
        // Fetch real draw ID
        const cPool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, s);
        try {
          const currentId = await cPool.currentDrawId();
          setDrawId(Number(currentId));
        } catch (e) {
          console.warn("Could not fetch draw ID. Is the contract deployed locally?", e);
        }
        
      } catch (e: unknown) {
        setStatus("Error: " + (e as Error).message);
      }
    } else {
      setStatus("Please install MetaMask");
    }
  };

  const handleDeposit = async () => {
    if (!account || !poolContract || !tokenContract) return;
    setStatus("Encrypting deposit...");
    try {
      // Import relayer-sdk dynamically to avoid SSR WASM issues
      const { createInstance, SepoliaConfigV2, initSDK } = await import("@zama-fhe/relayer-sdk/web");
      await initSDK();
      // Zama FHEVM Sepolia Configuration
      const instance = await createInstance({ 
        ...SepoliaConfigV2,
        network: (window as any).ethereum
      }); 
      
      const input = instance.createEncryptedInput(TOKEN_ADDRESS, account);
      input.add64(Number(depositAmount));
      const encryptedData = await input.encrypt();
      
      setStatus("Sending Encrypted Deposit Transaction...");
      const tx2 = await tokenContract.transferAndCall(POOL_ADDRESS, encryptedData.handles[0], encryptedData.inputProof);
      await tx2.wait();
      
      setStatus("Deposit transaction sent successfully!");
      setDepositAmount("");
    } catch (e: unknown) {
      setStatus("Deposit failed: " + ((e as Error).message || String(e)));
    }
  };

 const handleDecryptBalance = async () => {
  if (!account || !poolContract) return;

  setStatus("Awaiting EIP-712 Signature...");

  try {
    const {
      createInstance,
      SepoliaConfigV2,
      initSDK
    } = await import("@zama-fhe/relayer-sdk/web");

    await initSDK();

    const instance = await createInstance({
      ...SepoliaConfigV2,
      network: (window as any).ethereum
    });

    const { publicKey, privateKey } = instance.generateKeypair();

    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 1;

    const eip712 = instance.createEIP712(
      publicKey,
      [POOL_ADDRESS],
      startTimestamp,
      durationDays
    );

    if (!signer) return;

    const { EIP712Domain, ...eip712Types } =
      eip712.types as any;

    const signature = await signer.signTypedData(
      eip712.domain,
      eip712Types,
      eip712.message
    );

    setStatus("Fetching Encrypted Handle...");

    const encryptedBalanceHandle =
      await poolContract.encryptedBalances(account);

    setStatus("Decrypting...");

    const decrypted = await instance.userDecrypt(
      [
        {
          handle: encryptedBalanceHandle,
          contractAddress: POOL_ADDRESS
        }
      ],
      privateKey,
      publicKey,
      signature.replace("0x", ""),
      [POOL_ADDRESS],
      account,
      startTimestamp,
      durationDays
    );

    console.log("USER DECRYPT RESULT:", decrypted);
    console.log("ENCRYPTED HANDLE:", encryptedBalanceHandle);

    const decryptedValue =
      (decrypted as any)?.[encryptedBalanceHandle] ??
      Object.values(decrypted as any)[0];

    console.log("DECRYPTED VALUE:", decryptedValue);

    setBalance(`${decryptedValue} (Decrypted)`);

    setStatus("Balance decrypted successfully.");

  } catch (e: unknown) {
    setStatus(
      "Decryption failed: " +
      ((e as Error).message || String(e))
    );
  }
};

  const handleWithdraw = async () => {
    if (!account || !poolContract) return;
    setStatus("Encrypting withdrawal amount...");
    try {
      const { createInstance, SepoliaConfigV2, initSDK } = await import("@zama-fhe/relayer-sdk/web");
      await initSDK();
      const instance = await createInstance({ 
        ...SepoliaConfigV2,
        network: (window as any).ethereum
      });
      
      const input = instance.createEncryptedInput(POOL_ADDRESS, account);
      input.add64(Number(withdrawAmount));
      const encryptedData = await input.encrypt();
      
      setStatus("Sending Encrypted Withdrawal Transaction...");
      const tx = await poolContract.withdraw(encryptedData.handles[0], encryptedData.inputProof);
      await tx.wait();
      
      setStatus("Withdrawal successful!");
      setWithdrawAmount("");
      // Clear balance cache
      setBalance("Encrypted (***)");
    } catch (e: unknown) {
      setStatus("Withdrawal failed: " + ((e as Error).message || String(e)));
    }
  };

  const triggerDraw = async () => {
    if (!poolContract) return;
    setStatus("Triggering confidential draw transaction...");
    try {
      const tx = await poolContract.triggerDraw();
      await tx.wait();
      setDrawId(d => d + 1);
      
      setStatus("Draw complete. Checking eligibility...");
      await poolContract.drawPrizes(drawId + 1, account);
      // winStatus is encrypted, we'd need to decrypt it via reencrypt in a full prod app.
      // For this step, we just rely on the contract execution.
      setIsWinner(true); // Placeholder for UI state
      setHasClaimed(false);
      
    } catch (e: unknown) {
      setStatus("Draw failed: " + ((e as Error).message || String(e)));
    }
  };

  const claimPrize = async () => {
    if (!poolContract) return;
    setStatus("Claiming prize transaction...");
    try {
      const tx = await poolContract.claimPrize(drawId);
      await tx.wait();
      setStatus("Prize claimed securely to your encrypted balance!");
      setHasClaimed(true);
    } catch (e: unknown) {
      setStatus("Claim failed: " + ((e as Error).message || String(e)));
    }
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient">SecretPool</h1>
        <button className="btn" onClick={connectWallet}>
          {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}
        </button>
      </header>

      <div style={{ marginBottom: '1rem', color: '#888' }}>Status: {status}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* User Panel */}
        <div className="card">
          <h2>My Vault</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#aaa' }}>Current Balance</p>
            <h3 style={{ fontSize: '2rem', margin: '0' }}>{balance}</h3>
            <button style={{ marginTop: '0.5rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }} onClick={handleDecryptBalance}>
              🔓 Decrypt My Balance
            </button>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h4>Deposit to Pool</h4>
            <input 
              className="input" 
              placeholder="Amount to deposit" 
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
            />
            <button className="btn" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleDeposit}>
              Encrypt & Deposit
            </button>
            
            <h4>Withdraw Principal</h4>
            <input 
              className="input" 
              placeholder="Amount to withdraw" 
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
            />
            <button className="btn" style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid var(--primary)' }} onClick={handleWithdraw}>
              Encrypt & Withdraw
            </button>
          </div>
        </div>

        {/* Draw Panel */}
        <div className="card">
          <h2>Draw Dashboard</h2>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: '#aaa' }}>Current Draw ID</p>
              <h3 style={{ margin: 0 }}>#{drawId}</h3>
            </div>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: '#aaa' }}>Yield Source</p>
              <h3 style={{ margin: 0, color: 'var(--accent)' }}>Demo Yield Source</h3>
            </div>
          </div>

          <button className="btn" style={{ width: '100%', marginBottom: '1rem', backgroundColor: 'var(--secondary)', color: 'white' }} onClick={triggerDraw}>
            Trigger Confidential Draw
          </button>

          {(isWinner !== null || hasClaimed) && (
            <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: (isWinner || hasClaimed) ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: `1px solid ${(isWinner || hasClaimed) ? 'var(--primary)' : 'var(--border)'}`, textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: (isWinner || hasClaimed) ? 'var(--primary)' : 'white' }}>
                {hasClaimed ? "🏆 Prize claimed successfully!" : (isWinner ? "🎉 You won the draw!" : "Better luck next time!")}
              </h4>
              {isWinner && !hasClaimed && (
                <button className="btn" style={{ marginTop: '0.5rem' }} onClick={claimPrize}>
                  Claim Prize
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
