"use client";
import { useState, useEffect, useCallback } from "react";
import { StacksTestnet } from "@stacks/network";

// Hooks & API
import { useWallet } from "@/components/wallet-provider";
import {
  getTokenInfo,
  getTokenBalance,
  transferTokens,
  mintTokens,
  // getContractOwner tidak lagi digunakan karena tidak ada di kontrak
  type TokenInfo,
} from "@/lib/stacks-api";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Wallet,
  Send,
  Coins,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

// --- KONFIGURASI ---
// Ganti dengan alamat kontrak Anda
const CONTRACT_ADDRESS = "ST3HQ67G6GN7SDY331HPK07313ZR6XSJCSEVQS7M8.simple-token";
const NETWORK = new StacksTestnet();

export default function Component() {
  // State dari Wallet Context
  const { isConnected, userAddress, connectWallet, disconnectWallet } =
    useWallet();

  // State untuk data dari blockchain
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  // State 'isOwner' dihapus karena kita tidak bisa memverifikasinya dari kontrak

  // State untuk interaksi UI
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintTo, setMintTo] = useState("");

  // State untuk status & loading
  const [loading, setLoading] = useState(false);
  const [uiLoading, setUiLoading] = useState(true); // Untuk loading data awal
  const [txStatus, setTxStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Fungsi untuk memformat angka token
  const formatTokenAmount = (amount: bigint, decimals: number): string => {
    // FIX: Tambahkan guard clause untuk mencegah error jika decimals tidak valid
    if (typeof amount !== 'bigint' || typeof decimals !== 'number' || decimals < 0 || isNaN(decimals)) {
        // Kembalikan nilai default yang aman jika data belum siap
        return "0.00";
    }
    const value = Number(amount) / 10 ** decimals;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Fungsi untuk mengambil semua data yang dibutuhkan
  // useCallback digunakan untuk mencegah fungsi ini dibuat ulang di setiap render,
  // kecuali dependensinya berubah. Dibuat stabil dengan dependensi kosong.
  const fetchData = useCallback(async () => {
    setUiLoading(true);
    try {
      const info = await getTokenInfo(CONTRACT_ADDRESS, NETWORK);

      // FIX: Atasi error "Objects are not valid as a React child".
      // API mungkin mengembalikan objek ClarityValue, bukan string primitif.
      // Kita ekstrak properti `.value` atau `.data` untuk mendapatkan nilai sebenarnya.
      const cleanInfo = {
        ...info,
        name: (info.name as any)?.value ?? (info.name as any)?.data ?? info.name,
        symbol: (info.symbol as any)?.value ?? (info.symbol as any)?.data ?? info.symbol,
      };
      setTokenInfo(cleanInfo);

      // Jika user terhubung, ambil saldonya
      if (userAddress && cleanInfo) {
        const balance = await getTokenBalance(
          CONTRACT_ADDRESS,
          userAddress,
          NETWORK
        );
        setTokenBalance(balance);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setTxStatus({
        type: "error",
        message: "Failed to load contract data. Please check the contract address and refresh.",
      });
    } finally {
      setUiLoading(false);
    }
  }, [userAddress]); // FIX: Hanya bergantung pada userAddress

  // Ambil data saat komponen dimuat dan saat userAddress berubah
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTransaction = async (
    action: "transfer" | "mint",
    amountStr: string,
    recipient: string
  ) => {
    if (!amountStr || !recipient || !userAddress || !tokenInfo) return;
    setLoading(true);
    setTxStatus({ type: null, message: "" });
    try {
      const amount = BigInt(parseFloat(amountStr) * 10 ** tokenInfo.decimals);

      const onFinish = (data: { txId: string }) => {
        setLoading(false);
        setTxStatus({
          type: "success",
          message: `Transaction submitted! TXID: ${data.txId.slice(0, 10)}...`,
        });
        // Reset input dan segarkan data setelah beberapa saat
        if (action === "transfer") {
          setTransferAmount("");
          setTransferTo("");
        } else {
          setMintAmount("");
          setMintTo("");
        }
        setTimeout(() => fetchData(), 8000); // Tunggu lebih lama untuk konfirmasi blok
      };

      // FIX: onCancel tidak menerima argumen
      const onCancel = () => {
        setLoading(false);
        setTxStatus({ type: "error", message: "Transaction rejected by user." });
      };

      if (action === "transfer") {
        await transferTokens({
          contractAddress: CONTRACT_ADDRESS,
          amount,
          recipient,
          senderAddress: userAddress,
          network: NETWORK,
          onFinish,
          onCancel,
        });
      } else {
        await mintTokens({
          contractAddress: CONTRACT_ADDRESS,
          amount,
          recipient,
          network: NETWORK,
          onFinish,
          onCancel,
        });
      }
    } catch (error: any) {
      setLoading(false);
      setTxStatus({
        type: "error",
        message: error.message || "An unknown error occurred.",
      });
    }
  };

  if (uiLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-2">
              <Coins className="w-8 h-8 text-yellow-500" />
              {tokenInfo?.name || "Token"} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Interact with your {tokenInfo?.symbol || "TKN"} tokens on Stacks
              blockchain
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <Button onClick={connectWallet} className="w-full">
                <Wallet className="w-4 h-4 mr-2" /> Connect Stacks Wallet
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Connected Address</p>
                    <p className="font-mono text-sm">{userAddress}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    Connected
                  </Badge>
                </div>
                <Button variant="outline" onClick={disconnectWallet} className="w-full bg-transparent">
                  Disconnect Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" /> Token Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tokenInfo ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border"><p className="text-sm text-muted-foreground">Token Name</p><p className="font-semibold">{tokenInfo.name}</p></div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border"><p className="text-sm text-muted-foreground">Symbol</p><p className="font-semibold">{tokenInfo.symbol}</p></div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border"><p className="text-sm text-muted-foreground">Decimals</p><p className="font-semibold">{tokenInfo.decimals}</p></div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border"><p className="text-sm text-muted-foreground">Total Supply</p><p className="font-semibold">{formatTokenAmount(tokenInfo.totalSupply, tokenInfo.decimals)}</p></div>
                </div>
                <Separator className="my-4" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Contract Address</p>
                  <p className="font-mono text-xs break-all">{tokenInfo.contractAddress}</p>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground">
                {txStatus.type === 'error' ? txStatus.message : 'Loading token information...'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* User Balance */}
        {isConnected && tokenInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Your Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border">
                <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">
                  {formatTokenAmount(tokenBalance, tokenInfo.decimals)}{" "}
                  {tokenInfo.symbol}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  Available Balance
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Status */}
        {txStatus.type && (
          <Alert className={txStatus.type === "success" ? "border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-500/50" : "border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-500/50"}>
            {txStatus.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
            <AlertDescription className={txStatus.type === "success" ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}>
              {txStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        {isConnected && (
          <Tabs defaultValue="transfer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transfer">Transfer Tokens</TabsTrigger>
              {/* Tombol Mint sekarang selalu aktif. Pembatasan ada di kontrak. */}
              <TabsTrigger value="mint">Mint Tokens</TabsTrigger>
            </TabsList>
            <TabsContent value="transfer">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> Transfer {tokenInfo?.symbol} Tokens</CardTitle><CardDescription>Send your {tokenInfo?.symbol} tokens to another Stacks address</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="transfer-amount">Amount</Label><Input id="transfer-amount" type="number" placeholder="0.000000" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} step="0.000001" min="0" /></div>
                  <div className="space-y-2"><Label htmlFor="transfer-to">Recipient Address</Label><Input id="transfer-to" placeholder="ST..." value={transferTo} onChange={(e) => setTransferTo(e.target.value)} /></div>
                  <Button onClick={() => handleTransaction("transfer", transferAmount, transferTo)} disabled={!transferAmount || !transferTo || loading} className="w-full">
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>) : (<><Send className="w-4 h-4 mr-2" /> Transfer Tokens</>)}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="mint">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Coins className="w-5 h-5" /> Mint {tokenInfo?.symbol} Tokens</CardTitle><CardDescription>Create new {tokenInfo?.symbol} tokens. Note: This action may be restricted by the smart contract.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="mint-amount">Amount to Mint</Label><Input id="mint-amount" type="number" placeholder="0.000000" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} step="0.000001" min="0" /></div>
                  <div className="space-y-2"><Label htmlFor="mint-to">Mint to Address</Label><Input id="mint-to" placeholder="ST..." value={mintTo} onChange={(e) => setMintTo(e.target.value)} /></div>
                  <Button onClick={() => handleTransaction("mint", mintAmount, mintTo)} disabled={!mintAmount || !mintTo || loading} className="w-full">
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Minting...</>) : (<><Coins className="w-4 h-4 mr-2" /> Mint Tokens</>)}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Built for Stacks blockchain • SIP-010 Token Standard</p>
        </div>
      </div>
    </div>
  );
}