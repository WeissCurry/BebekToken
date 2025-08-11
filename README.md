# SIP-010 Fungible Token Dashboard

A simple, modern web interface for interacting with a SIP-010 compliant fungible token on the Stacks blockchain. This dashboard is built with Next.js, TypeScript, and Tailwind CSS, and connects to the Stacks Testnet.

![Stacks](https://img.shields.io/badge/Stacks-Testnet-blueviolet?style=for-the-badge&logo=stacks)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)

---

## 📜 Project Overview

This project provides a user-friendly dashboard to manage a custom SIP-010 token. It allows users to connect their Stacks wallet, view token details, check their balance, and perform core actions like transferring and minting tokens.

The reference smart contract for this dashboard has a fixed **total supply of 1,000,000 tokens** and operates on the **Stacks Testnet**.

## ✨ Features

-   **Wallet Integration**: Connect and disconnect seamlessly with a Stacks-compatible wallet (e.g., Leather).
-   **Token Info Display**: View key token metrics such as name, symbol, decimal precision, and total supply.
-   **Balance Checker**: See your current token balance in real-time.
-   **Token Transfers**: Securely send tokens to any other Stacks address.
-   **Token Minting**: Interface for the `mint` function (access may be restricted by the smart contract).
-   **Responsive UI**: Clean and modern interface that works on both desktop and mobile devices.
-   **Dark Mode**: Includes a theme toggle for user preference.

## 🛠️ Technical Details

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS & shadcn/ui
-   **Blockchain**: Stacks
-   **Network**: **Testnet**
-   **Token Standard**: [SIP-010 Fungible Token Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-fungible-token-standard.md)

## 🚀 Getting Started

Follow these steps to get the project running locally.

### Prerequisites

-   Node.js (v18 or later)
-   NPM or Yarn
-   A Stacks wallet extension for your browser (e.g., [Leather](https://leather.io/)) funded with Testnet STX.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Configure the Contract Address:**
    Open `src/app/page.tsx` and update the `CONTRACT_ADDRESS` constant with your own deployed SIP-010 contract address.

    ```typescript
    // src/app/page.tsx
    const CONTRACT_ADDRESS = "ST...your-contract-address.your-contract-name";
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
