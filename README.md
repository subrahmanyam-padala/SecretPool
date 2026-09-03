# 🔐 SecretPool

### Confidential No-Loss Prize Savings Pool Powered by Zama FHEVM

SecretPool is a confidential prize savings application inspired by the no-loss lottery concept.

Users deposit test tokens into a shared pool while their balances and lottery weights remain encrypted. SecretPool uses **Zama FHEVM** to perform confidential computations on encrypted values, including weighted winner selection and prize assignment.

The goal is to demonstrate how Fully Homomorphic Encryption can bring privacy to prize-linked savings applications on Ethereum.

> **Deposit → Encrypt → Earn Yield → Confidential Draw → Claim → Decrypt**

---

## 🎯 Why SecretPool?

Traditional on-chain lottery and prize applications can expose sensitive financial information such as:

- User balances
- Deposit amounts
- Lottery weights
- Prize amounts
- Savings or portfolio information

This information can reveal how much a user has deposited and potentially influence other participants' behavior.

SecretPool explores a different model:

> **The blockchain can perform the required lottery computations without exposing users' balances and lottery weights as plaintext values.**

Zama FHEVM makes this possible by enabling smart contracts to compute over encrypted data.

---

# ✨ Features

- 🔐 Encrypted user balances
- 🎟️ Encrypted lottery weights
- 🎲 FHE-based confidential randomness
- 🏆 Confidential prize assignment
- 💰 No-loss prize savings model
- 🔒 Encrypted prize-pool state
- 🧮 Computation over encrypted values
- 🦊 MetaMask wallet integration
- 🌐 Next.js + React frontend
- ⛓️ Ethereum Sepolia deployment
- 🔑 User-authorized balance decryption
- 🔐 Zama Relayer SDK integration
- 🧪 Automated smart-contract tests
- 🛡️ Owner-controlled yield injection

---

# 🏗️ How It Works

## 1. Deposit

A user deposits confidential test tokens into SecretPool.

The deposited amount is converted into an encrypted FHE value and maintained as the user's encrypted balance.

```text
User
 │
 │ Deposit
 ▼
Encrypted Balance