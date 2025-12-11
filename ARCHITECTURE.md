# AgriChain Architecture

```mermaid
graph TD
    WS[Weather Source\n(Open-Meteo API)] -->|JSON Data| OR[Oracle Service\n(Node.js)]
    OR -->|Signed Report\n(ECDSA)| SC[Smart Contract\n(AgriChainPolicy.sol)]
    F[Farmer] -->|Create Policy\n(Pay Premium)| SC
    SC --Events--> B[Backend Server\n(Node.js/Express)]
    B -->|Store Data| DB[(MongoDB)]
    SC -->|Trigger Payout| KW[Keepers/Automation\n(or Oracle Trigger)]
    KW -->|Execute Payout| SC
    SC -->|Transfer Funds| F
    UI[Frontend App\n(React)] -->|Read/Write| SC
    UI -->|Read History| B
```

## Description
1.  **Weather Sources**: External APIs (Open-Meteo) provide real-time rainfall data.
2.  **Oracle Service**: A Node.js script that fetches weather data, signs it with a private key (authorized by the contract), and submits it to the blockchain.
3.  **Smart Contract**: The core logic on Ethereum/Polygon. It holds premiums, verifies oracle signatures, checks rainfall thresholds, and executes payouts.
4.  **Payout**: If the reported rainfall is below the threshold, the contract automatically calculates and transfers the payout (5x premium) to the farmer.
5.  **Farmer App (Frontend)**: A React interface for farmers to connect wallets, view policies, and buy insurance.
6.  **Backend & DB**: An off-chain indexer/database to store policy history and weather logs for easy querying and display in the UI.
