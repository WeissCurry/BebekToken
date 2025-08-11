"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { StacksMainnet, StacksTestnet } from "@stacks/network";

// Tipe untuk konteks Wallet
interface WalletContextType {
    isConnected: boolean;
    userAddress: string | null;
    balance: string;
    connectWallet: () => void;
    disconnectWallet: () => void;
    network: "mainnet" | "testnet";
}

// Inisialisasi di luar komponen agar tidak dibuat ulang setiap render
const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState("0.000000");
    const network = new StacksTestnet(); // Ganti ke StacksMainnet() jika aplikasi Anda untuk mainnet

    // Fungsi untuk mengambil data pengguna dan saldo
    const fetchUserData = async (session: UserSession) => {
        try {
            const userData = session.loadUserData();
            const address = userData.profile.stxAddress.testnet; // atau .mainnet
            
            setIsConnected(true);
            setUserAddress(address);

            // Gunakan fetch untuk mengambil saldo dari API
            const response = await fetch(`${network.coreApiUrl}/extended/v1/address/${address}/balances`);
            if (!response.ok) {
                throw new Error(`Failed to fetch balance: ${response.statusText}`);
            }
            const data = await response.json();

            // Saldo dalam micro-STX (uSTX), perlu diubah ke STX
            const stxBalance = Number(data.stx.balance) / 1_000_000;
            setBalance(stxBalance.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 }));

        } catch (error) {
            console.error("Error fetching user data:", error);
            disconnectWallet(); // Logout jika terjadi error
        }
    };

    const disconnectWallet = () => {
        if (userSession.isUserSignedIn()) {
            userSession.signUserOut();
        }
        setIsConnected(false);
        setUserAddress(null);
        setBalance("0.000000");
    };
    
    // Cek sesi saat komponen pertama kali dimuat
    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            fetchUserData(userSession);
        }
    }, []); // Dependensi sengaja kosong agar hanya jalan sekali

    const connectWallet = () => {
        showConnect({
            appDetails: {
                name: "Bebek DApp",
                icon: window.location.origin + "/logo.png",
            },
            redirectTo: "/",
            onFinish: () => {
                fetchUserData(userSession);
            },
            userSession,
        });
    };

    return (
        <WalletContext.Provider
            value={{
                isConnected,
                userAddress,
                balance,
                connectWallet,
                disconnectWallet,
                network: network.isMainnet() ? "mainnet" : "testnet",
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

// Hook kustom untuk menggunakan konteks
export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}