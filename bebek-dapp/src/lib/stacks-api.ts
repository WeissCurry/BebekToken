import {
    callReadOnlyFunction,
    createAssetInfo,
    cvToValue,
    FungibleConditionCode,
    makeStandardFungiblePostCondition,
    stringUtf8CV,
    uintCV,
    standardPrincipalCV,
    ClarityValue, // Pastikan ClarityValue diimpor
} from "@stacks/transactions";
import { openContractCall } from "@stacks/connect";
import { StacksTestnet } from "@stacks/network";

export interface TokenInfo {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    contractAddress: string;
}

export interface TransactionResult {
    success: boolean;
    txId?: string;
    error?: string;
}

// --- UTILITY FUNCTIONS ---
function parseContractAddress(contractAddress: string) {
    const [address, name] = contractAddress.split(".");
    if (!address || !name) {
        throw new Error(
            "Invalid contract address format. Expected 'address.contract-name'."
        );
    }
    return { address, name };
}

// --- READ-ONLY FUNCTIONS ---
export async function getTokenInfo(
    contractAddress: string,
    network: StacksTestnet
): Promise<TokenInfo> {
    const { address, name } = parseContractAddress(contractAddress);

    // FIX 1: Memberikan tipe eksplisit pada functionArgs
    const functionArgs: ClarityValue[] = [];

    const callAndParse = async (functionName: string): Promise<ClarityValue> => {
        const result = await callReadOnlyFunction({
            contractAddress: address,
            contractName: name,
            functionName,
            functionArgs, // Sekarang tipenya sudah benar
            senderAddress: address,
            network,
        });
        return result;
    };

    try {
        const [nameResult, symbolResult, decimalsResult, totalSupplyResult] =
            await Promise.all([
                callAndParse("get-name"),
                callAndParse("get-symbol"),
                callAndParse("get-decimals"),
                callAndParse("get-total-supply"),
            ]);

        const tokenInfo: TokenInfo = {
            name: cvToValue(nameResult),
            symbol: cvToValue(symbolResult),
            decimals: Number(cvToValue(decimalsResult)),
            totalSupply: cvToValue(totalSupplyResult),
            contractAddress,
        };
        return tokenInfo;
    } catch (error) {
        console.error("Error fetching token info:", error);
        throw new Error("Failed to fetch token information from the contract.");
    }
}

export async function getTokenBalance(
    contractAddress: string,
    userAddress: string,
    network: StacksTestnet
): Promise<bigint> {
    const { address, name } = parseContractAddress(contractAddress);
    try {
        const balanceResult = await callReadOnlyFunction({
            contractAddress: address,
            contractName: name,
            functionName: "get-balance",
            functionArgs: [standardPrincipalCV(userAddress)],
            senderAddress: userAddress,
            network,
        });
        return cvToValue(balanceResult);
    } catch (error) {
        console.error("Error fetching token balance:", error);
        throw new Error("Failed to fetch token balance.");
    }
}

// --- CONTRACT-CALL FUNCTIONS (WRITE) ---
export async function transferTokens({
    contractAddress,
    amount,
    recipient,
    senderAddress,
    network,
    onFinish,
    onCancel,
}: {
    contractAddress: string;
    amount: bigint;
    recipient: string;
    senderAddress: string;
    network: StacksTestnet;
    onFinish: (data: any) => void;
    // FIX 2: Mengubah tipe onCancel agar tidak memiliki argumen
    onCancel: () => void;
}): Promise<void> {
    const { address, name } = parseContractAddress(contractAddress);
    await openContractCall({
        network,
        contractAddress: address,
        contractName: name,
        functionName: "transfer",
        functionArgs: [
            uintCV(amount),
            standardPrincipalCV(senderAddress),
            standardPrincipalCV(recipient),
            stringUtf8CV(""), // memo bisa string kosong
        ],
        postConditions: [
            makeStandardFungiblePostCondition(
                senderAddress,
                FungibleConditionCode.Equal, // Menggunakan Equal untuk keamanan, bisa juga LessEqual
                amount,
                createAssetInfo(address, name, "bebek-token") // Ganti "bebek-token" dengan nama aset Anda
            ),
        ],
        appDetails: {
            name: "Bebek DApp",
            icon: window.location.origin + "/logo.png",
        },
        onFinish,
        onCancel,
    });
}

export async function mintTokens({
    contractAddress,
    amount,
    recipient,
    network,
    onFinish,
    onCancel,
}: {
    contractAddress: string;
    amount: bigint;
    recipient: string;
    network: StacksTestnet;
    onFinish: (data: any) => void;
    // FIX 2: Mengubah tipe onCancel agar tidak memiliki argumen
    onCancel: () => void;
}): Promise<void> {
    const { address, name } = parseContractAddress(contractAddress);
    await openContractCall({
        network,
        contractAddress: address,
        contractName: name,
        functionName: "mint",
        functionArgs: [uintCV(amount), standardPrincipalCV(recipient)],
        appDetails: {
            name: "Bebek DApp",
            icon: window.location.origin + "/logo.png",
        },
        onFinish,
        onCancel,
    });
}

export async function getContractOwner(
    contractAddress: string,
    network: StacksTestnet
): Promise<string> {
    const { address, name } = parseContractAddress(contractAddress);
    try {
        const ownerResult = await callReadOnlyFunction({
            contractAddress: address,
            contractName: name,
            functionName: "get-contract-owner",
            // FIX 1: Memberikan tipe eksplisit pada functionArgs
            functionArgs: [] as ClarityValue[],
            senderAddress: address,
            network,
        });
        return cvToValue(ownerResult);
    } catch (error) {
        console.error("Error fetching contract owner:", error);
        throw new Error("Failed to fetch contract owner.");
    }
}
