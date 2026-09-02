# 🔐 SecretPool

### Confidential No-Loss Prize Savings Pool powered by Zama FHEVM

SecretPool is a confidential prize savings application inspired by the PoolTogether no-loss lottery concept.

Users deposit confidential test tokens into a shared pool. Instead of exposing users' balances and lottery weights publicly, SecretPool uses Fully Homomorphic Encryption (FHE) through the Zama FHEVM protocol to keep sensitive values encrypted while the smart contract performs the required computations.

## 🎯 Project Goal

Traditional on-chain lotteries can expose:

- User balances
- Deposit amounts
- Lottery weights
- Prize information
- Winner-related information

SecretPool demonstrates how FHE can be used to build a more private prize savings experience.

The core idea is simple:

> Deposit → Keep values encrypted → Run a confidential weighted draw → Claim the prize → Decrypt your balance

---

## ✨ Features

- 🔐 Encrypted user balances
- 🎟️ Confidential lottery weights
- 🎲 FHE-based confidential random draw
- 🏆 Confidential winner selection
- 💰 No-loss prize savings model
- 🔒 Encrypted prize pool
- 🧮 FHE operations performed on encrypted values
- 🦊 MetaMask wallet integration
- 🌐 Next.js + React frontend
- ⛓️ Ethereum Sepolia deployment
- 🔓 User-controlled balance decryption

---

## 🏗️ How SecretPool Works

### 1. Deposit

A user deposits confidential test tokens into SecretPool.

The user's balance is stored as an encrypted FHE value rather than as a normal plaintext balance.

### 2. Encrypted Weight

The user's deposited amount contributes to their encrypted lottery weight.

A larger deposit gives the user a proportionally larger chance of winning.

### 3. Yield

Yield is added to the confidential prize pool.

The yield becomes the prize available for the draw.

### 4. Confidential Draw

The contract generates FHE-based randomness and performs the weighted winner selection while keeping the relevant values encrypted.

The draw does not require exposing users' balances or weights as plaintext values.

### 5. Claim

The selected winner can claim the prize.

The prize is added to the winner's encrypted balance.

### 6. Decrypt

The user can request decryption of their own encrypted balance through the Zama relayer infrastructure.

For example:

```text
100 deposited
      ↓
500 prize
      ↓
600 final balance