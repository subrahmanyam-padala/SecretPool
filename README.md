# 🔐 SecretPool

### Confidential No-Loss Prize Savings Pool powered by Zama FHEVM

SecretPool is a confidential prize savings application inspired by the no-loss lottery concept.

Users deposit confidential test tokens into a shared pool. Instead of exposing users' balances and lottery weights as plaintext values, SecretPool uses Fully Homomorphic Encryption (FHE) through the Zama FHEVM protocol to keep sensitive values encrypted while the smart contract performs the required computations.

## 🎯 Project Goal

Traditional on-chain prize and lottery applications can expose sensitive information such as:

- User balances
- Deposit amounts
- Lottery weights
- Prize amounts
- Portfolio or savings information

SecretPool demonstrates how FHE can be used to build a more private prize savings experience.

The core idea is:

> **Deposit → Keep values encrypted → Run a confidential weighted draw → Claim the prize → Decrypt your balance**

---

## ✨ Features

- 🔐 Encrypted user balances
- 🎟️ Encrypted lottery weights
- 🎲 FHE-based confidential random draw
- 🏆 Confidential prize assignment
- 💰 No-loss prize savings model
- 🔒 Encrypted prize pool
- 🧮 Computation over encrypted values using Zama FHEVM
- 🦊 MetaMask wallet integration
- 🌐 Next.js + React frontend
- ⛓️ Ethereum Sepolia deployment
- 🔓 User-controlled balance decryption
- 🔐 Zama Relayer SDK integration for encrypted input and user decryption

---

## 🏗️ How SecretPool Works

### 1. Deposit

A user deposits confidential test tokens into SecretPool.

The deposited amount is represented and maintained as an encrypted FHE value in the pool rather than as a normal plaintext balance.

### 2. Encrypted Lottery Weight

A user's deposited amount contributes to their encrypted lottery weight.

A larger deposit gives the user a proportionally larger chance of winning.

The total lottery weight is also maintained as an encrypted value.

### 3. Yield

Yield is added to the confidential prize pool.

The yield becomes the prize available for the next draw.

For the demonstration deployment, test yield was added to the pool using the test token and the pool's `addYield()` function.

### 4. Confidential Draw

The pool generates FHE-based randomness and performs weighted winner selection using encrypted values.

The draw compares the encrypted random ticket against encrypted cumulative participant weights.

The relevant balances and weights do not need to be revealed as plaintext values to perform the draw.

### 5. Prize Assignment

The selected participant receives an encrypted prize value associated with the current draw.

The prize amount remains encrypted.

### 6. Claim

The selected participant can claim the prize.

The prize is added to the participant's encrypted balance and encrypted lottery weight.

The draw prize is then cleared to prevent the same prize from being claimed again.

### 7. Decrypt

The user can request decryption of their own encrypted balance through the Zama relayer infrastructure.

Only the user's authorized decryption flow reveals their balance in the frontend.

---

## 🔐 FHE Privacy Model

SecretPool uses Zama FHEVM to perform computations on encrypted values.

Conceptually:

```text
Plaintext deposit
       ↓
FHE encryption
       ↓
Encrypted balance
       ↓
Encrypted lottery weight
       ↓
FHE-based weighted draw
       ↓
Encrypted prize
       ↓
Encrypted user balance
       ↓
User-authorized decryption
```

The important idea is that sensitive financial values can remain encrypted while the smart contract performs the required computations.

SecretPool is a demonstration of confidential computation on Ethereum rather than a production financial product.

---

## 🎲 Confidential Weighted Draw

The draw uses FHE randomness and encrypted participant weights.

At a high level:

```text
Encrypted total weight
        +
FHE random value
        ↓
Encrypted random ticket
        ↓
Compare against encrypted cumulative weights
        ↓
Select winning participant
        ↓
Assign encrypted prize
```

The implementation uses encrypted comparisons and selection operations to determine which participant receives the prize.

This avoids requiring participant balances or lottery weights to be exposed as plaintext during the winner-selection process.

---

## 💰 No-Loss Prize Savings Model

SecretPool follows a no-loss prize savings concept:

- Users deposit their principal into the pool.
- The deposited principal contributes to their lottery weight.
- Yield is added separately to the prize pool.
- The draw distributes the available prize to a selected participant.
- A participant can withdraw their available principal through the encrypted withdrawal flow.

The goal is to demonstrate how confidential computation can be applied to a prize-linked savings experience.

---

## 🧪 Demonstrated End-to-End Flow

A successful demonstration was completed on the deployed Sepolia contracts:

```text
100 principal deposited
        ↓
500 test yield added to prize pool
        ↓
Confidential weighted draw
        ↓
Prize claimed
        ↓
600 total encrypted balance
        ↓
User decrypts balance
```

The frontend successfully displayed:

```text
600 (Decrypted)
```

after the prize was claimed.

---

## 🌐 Live Demo

**SecretPool:**
https://secreted-pool.netlify.app/

The live application supports:

- Connect wallet
- Decrypt balance
- Encrypt and deposit
- Encrypt and withdraw
- Trigger confidential draw
- Claim prize
- Decrypt the resulting balance

---

## ⛓️ Deployed Contracts

### Ethereum Sepolia

#### Confidential Test Token

```text
0xE560dBc970bB0347ABD1582A20a0f65C35795171
```

#### Confidential Prize Pool

```text
0x869ed12fA618dAeD3340dB5C3738D1F3A3d0Ab9b
```

The pool contract maintains encrypted participant balances, encrypted total weight, encrypted prize-pool state, and encrypted draw prizes.

---

## 🛠️ Technology Stack

### Smart Contracts

- Solidity `^0.8.24`
- Zama FHEVM
- `@fhevm/solidity`
- OpenZeppelin
- Hardhat
- Ethereum Sepolia

### Frontend

- Next.js
- React
- TypeScript
- ethers.js
- `@zama-fhe/relayer-sdk`
- MetaMask

### Confidential Computing

- Zama FHEVM
- FHE encrypted integers
- FHE arithmetic
- FHE comparisons
- FHE conditional selection
- FHE randomness
- User-authorized decryption

---

## 📁 Project Structure

```text
SecretPool/
├── contracts/
│   ├── ConfidentialPrizePool.sol
│   ├── ConfidentialTestToken.sol
│   └── MockYieldSource.sol
│
├── deploy/
│   └── Deployment scripts
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── next.config.ts
│
├── scripts/
├── tasks/
├── test/
│
├── .env.example
├── hardhat.config.ts
├── package.json
└── README.md
```

---

## 🚀 Run Locally

### Prerequisites

- Node.js 20+
- npm
- MetaMask
- Sepolia ETH for transaction fees
- Sepolia test environment configured for Zama FHEVM

### Install smart-contract dependencies

From the repository root:

```bash
npm install
```

### Compile contracts

```bash
npm run compile
```

### Run contract tests

```bash
npm test
```

### Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the local development URL shown by Next.js.

---

## 🔐 Environment Variables

Never commit private keys or other secrets to GitHub.

Use the provided:

```text
.env.example
```

as a reference for local configuration.

Do not expose:

- Wallet private keys
- Seed phrases
- Deployment credentials
- API secrets

The public frontend does not require the deployer's private key.

---

## 🔎 Security Notes

SecretPool is a **testnet demonstration project**.

The deployed token is a confidential test token and has no real-world monetary value.

The application is intended to demonstrate:

- Confidential balances
- Encrypted lottery weights
- FHE-based computation
- Confidential weighted draws
- User-authorized decryption

It has not been audited for production financial use.

### Known Limitations (For Educational Purposes)

1. **Unbounded Loop in `triggerDraw`**: The `triggerDraw` function iterates over all depositors to select a winner using FHE. While this works well for demonstration purposes, it introduces an unbounded loop. In a production scenario, this would lead to Out of Gas errors if the pool grows too large. Fixing this requires a redeployment with a redesigned drawing mechanism (e.g., paginated draws or an off-chain VRF + mapping).
2. **Draw Cooldown**: Currently, `triggerDraw` can be called anytime by anyone. A production setup would enforce a specific draw interval (e.g., weekly) which requires a redeployment to enforce on-chain.
3. **Zero-Weight Draw**: If all users withdraw their funds, the total weight becomes zero. Calling `triggerDraw` when the total weight is zero will cause the prize pool to be reset, effectively losing the prize since no one can win. This requires an FHE conditional reset of the prize pool and redeployment.

---

## 🎟️ Test Token Access

The `ConfidentialTestToken` requires a designated owner to mint new tokens. To test the dApp on Sepolia, judges can use the existing balances or request test tokens from the contract deployer.
The token's `mint()` function is protected by the `onlyOwner` modifier to maintain access control integrity. If you have the deployer private key, you can mint test tokens by running the included minting script.

---

## 📚 Zama FHEVM

SecretPool is built using the Zama FHEVM ecosystem.

Learn more:

- Zama FHEVM documentation: https://docs.zama.org/
- Zama developer resources: https://www.zama.org/

---

## 📜 License

This project is licensed under the **BSD-3-Clause-Clear License**.

See [`LICENSE`](./LICENSE) for the complete license text.

---

## 👤 Author

**Subrahmanyam Padala**

GitHub:
https://github.com/subrahmanyam-padala

---

## 🙏 Acknowledgements

Built with the Zama FHEVM ecosystem and inspired by the no-loss prize savings concept pioneered by PoolTogether.

---

## 🔐 SecretPool in One Sentence

> **SecretPool demonstrates how Fully Homomorphic Encryption can enable a no-loss prize savings experience where balances and lottery weights remain encrypted while the smart contract performs the confidential draw.**