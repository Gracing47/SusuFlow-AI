# SusuFlow-AI 🌊💰
**Decentralized Rotating Savings and Credit Association (ROSCA) on Celo**

> **Built for Proof of Ship 10 Hackathon** 🚢

SusuFlow-AI brings the traditional "Susu" savings circle onto the blockchain, making it transparent, automated, and secure. By leveraging the Celo blockchain, AI agents, and identity verification, we create trusted financial communities without borders.

## 🏆 Hackathon Tracks

We are proudly building for the following tracks:

*   **🤖 NoahAI Track**: We utilize a NoahAI agent (`agent/src/poolMonitor.ts`) to autonomously monitor pools and trigger payout distributions when conditions are met, ensuring the savings circle keeps flowing without manual intervention.
*   **🔐 Self Track**: We integrated Self Protocol (`frontend/app/verify/page.tsx`) to verify the identity of pool creators, adding a crucial layer of trust and Sybil resistance to our ROSCA pools.
*   **🛠️ Thirdweb Track**: Our entire frontend is powered by Thirdweb (`thirdweb/react`) for seamless wallet connection, smart contract interactions, and chain management.
*   **🌐 Open Track**: Shipped live on Celo during the hackathon month!

## ✨ Key Features

*   **Create Custom Pools**: Users can deploy their own ROSCA pools with custom contribution amounts, cycle durations, and token choices (CELO or cUSD).
*   **Dual Token Support**: Flexible savings in native **CELO** or stable **cUSD**.
*   **AI-Powered Automation**: Our NoahAI agent monitors the blockchain 24/7. When a cycle ends and all members have contributed, the agent automatically executes the payout to the winner.
*   **Verified Trust**: Integration with **Self Protocol** ensures that pool creators are verified real humans, reducing the risk of fraud.
*   **Transparent & Fair**: All logic is on-chain. Winners are selected via a deterministic round-robin system, ensuring everyone gets their turn.

## 🏗️ Tech Stack

*   **Blockchain**: Celo (Alfajores Testnet / Mainnet)
*   **Smart Contracts**: Solidity
*   **Frontend**: Next.js, Tailwind CSS
*   **Web3 SDK**: Thirdweb
*   **AI Agent**: NoahAI (TypeScript)
*   **Identity**: Self Protocol

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm
*   Celo Wallet (e.g., Valora, MetaMask)

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/Gracing47/SusuFlow-AI.git
    cd SusuFlow-AI
    ```

2.  **Install Dependencies**
    ```bash
    # Frontend
    cd frontend
    npm install

    # Agent
    cd ../agent
    npm install
    ```

3.  **Run the Application**
    ```bash
    # Start Frontend
    cd frontend
    npm run dev
    ```

4.  **Run the AI Agent**
    ```bash
    # Start Agent
    cd agent
    npm run dev
    ```

## 📜 Smart Contracts

The platform is powered by a Factory contract that deploys individual SusuPool contracts.

*   **Factory Contract**: Configured via `NEXT_PUBLIC_FACTORY_ADDRESS`
*   **Tokens**: Supports CELO and cUSD

## 👥 Team

*   **Gracing47** - Full Stack Developer

---

*Built with ❤️ for the Celo Community*
