# 🔐 SecretPool

**Confidential No-Loss Prize Savings Pool** built with **Zama FHEVM**

SecretPool is a privacy-preserving version of a PoolTogether-style prize savings application.

Users deposit tokens into a shared pool while their balances and lottery weights remain encrypted. The smart contract performs a confidential weighted draw using Fully Homomorphic Encryption, assigns an encrypted prize to the selected participant, and allows the user to decrypt their own balance through the authorized Zama decryption flow.

> Deposit → Encrypt → Earn Yield → Confidential Draw → Claim → Decrypt

**Live Demo**: https://secreted-pool.netlify.app/  
**Network**: Ethereum Sepolia  
**Zama Developer Program**: Mainnet Season 4

---

## ✨ Key Features

- 🔐 Encrypted deposits and balances using Zama FHEVM `euint64`
- 🎟️ Encrypted lottery weights based on deposit size
- 🎲 Confidential weighted winner selection using FHE randomness
- 🏆 Encrypted prize assignment
- 💸 Encrypted withdrawal flow for available user balances
- 🔓 User-authorized decryption via Zama Relayer SDK
- 🛡️ Owner-controlled yield injection
- 🧪 End-to-end tested confidential prize flow
- ⛓️ Deployed and verified on Ethereum Sepolia

---

## 🏗️ How It Works

### 1. Deposit

A user deposits confidential test tokens into the shared pool.

The deposited amount is converted into an encrypted FHE value and maintained as the user's encrypted balance.

### 2. Encrypted Lottery Weight

The user's deposited balance contributes to their encrypted lottery weight.

A larger deposit provides a proportionally larger probability of being selected.

The total lottery weight is also maintained as an encrypted value.

### 3. Yield

Yield is supplied separately from user deposits and becomes available as prize liquidity.

For the demonstration deployment, yield was supplied through the owner-controlled `addYield()` mechanism using the confidential test token.

### 4. Confidential Draw

Anyone can call `triggerDraw()`.

The contract generates FHE randomness and combines it with the encrypted total lottery weight to derive an encrypted random ticket.

The contract then compares the encrypted random ticket against encrypted cumulative participant weights to determine the selected participant.

Sensitive balances and lottery weights do not need to be revealed as plaintext during the selection process.

### 5. Prize Assignment

The selected participant receives an encrypted prize associated with the current draw.

The prize remains encrypted.

### 6. Claim

The selected participant claims the prize.

The encrypted prize is added to the participant's encrypted balance and lottery weight.

The draw prize is then cleared to prevent the same prize from being claimed twice.

### 7. Decrypt

The user can request decryption of their own encrypted balance through the Zama Relayer SDK and authorized user-decryption flow.

---

## 🔐 Why FHE?

Traditional on-chain prize applications can expose:

- Deposit amounts
- User balances
- Lottery weights
- Prize amounts

SecretPool uses Zama FHEVM so that the core lottery computation can operate on encrypted values.

```text
User Deposit
     ↓
Encrypted Balance
     ↓
Encrypted Lottery Weight
     ↓
FHE Randomness
     ↓
Encrypted Weighted Draw
     ↓
Encrypted Prize
     ↓
Encrypted User Balance
     ↓
Authorized User Decryption