import React, { useEffect, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles

const WalletConnector = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, signMessage } = useWallet();
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch balance

  useEffect(() => {
    async function fetchBalance() {
      if (wallet.publicKey) {
        setLoading(true);
        try {
          const balance = await connection.getBalance(wallet.publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
          // toast.success("Balance updated successfully!");
        } catch (error) {
          toast.error("Error fetching balance!");
        } finally {
          setLoading(false);
        }
      }
    }

    fetchBalance();
  }, [wallet.publicKey, connection]);

  // Airdrop function
  async function airdropSol() {
    setLoading(true);
    try {
      await connection.requestAirdrop(
        wallet.publicKey,
        amount * LAMPORTS_PER_SOL
      );
      toast.success(`Airdropped ${amount} SOL successfully!`);
    } catch (error) {
      toast.error("Airdrop failed!");
    } finally {
      setLoading(false);
    }
  }

  // Send transaction
  async function sendTokens() {
    setLoading(true);
    try {
      const message = `I confirm sending ${amount} SOL to ${toAddress}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage); // User signs the message

      // Proceed with sending the transaction only after signing
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(toAddress),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      // Send the transaction and wait for confirmation
      const transactionSignature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(transactionSignature); // Wait for confirmation

      // Fetch the updated balance
      await fetchBalance();

      toast.success(`Sent ${amount} SOL to ${toAddress}`);
    } catch (error) {
      toast.error("Transaction failed!");
    } finally {
      setLoading(false);
    }
  }


  async function fetchBalance() {
    if (wallet.publicKey) {
      setLoading(true);
      try {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        toast.error("Error fetching balance!");
      } finally {
        setLoading(false);
      }
    }
  }
  // Sign message
  const signmsg = async () => {
    if (!publicKey) {
      toast.error("Wallet not connected!");
      return;
    }
    if (!signMessage) {
      toast.error("Wallet does not support message signing!");
      return;
    }

    setLoading(true);
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      toast.success("Message signed successfully!");
      // Display signature (here for simplicity)
      document.getElementById("signature").textContent = `Signature: ${bs58.encode(signature)}`;
    } catch (error) {
      toast.error("Message signing failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <ToastContainer />
      <h1 className="text-4xl font-bold text-center my-10 text-white">Wallet Adapter</h1>

      {/* Wallet Information */}
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Connect Wallet</h2>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <WalletMultiButton
          />
          <WalletDisconnectButton />
        </div>

        {wallet.publicKey && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <h3 className="text-xl font-semibold mb-2">Wallet Information</h3>
            <p className="text-gray-300">Address: <span className="break-all">{wallet.publicKey.toBase58()}</span></p>
            <p className="text-gray-300">Balance: {loading ? "Loading..." : `${balance ?? 0} SOL`}</p>
          </div>
        )}
      </div>

      {/* Airdrop Section */}
      <div className="max-w-md mx-auto bg-gray-800 p-4 rounded-lg mb-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Request Airdrop</h3>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount in SOL"
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded-md"
        />
        <button
          onClick={airdropSol}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition duration-200 shadow-lg"
        >
          {loading ? "Processing..." : "Request Airdrop"}
        </button>
      </div>

      {/* Send Transaction Section */}
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Send Transaction</h2>
        <input
          type="text"
          placeholder="Recipient Address"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
        />
        <input
          type="number"
          placeholder="Amount in SOL"
          id="amount"
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
        />
        <button
          onClick={sendTokens}
          className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-full transition duration-200 shadow-lg"
        >
          {loading ? "Processing..." : "Send"}
        </button>
      </div>

      {/* Sign Message Section */}
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Sign Message</h2>
        <textarea
          placeholder="Type your message here"
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          rows="3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={signmsg}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2 px-4 rounded-full transition duration-200 shadow-lg"
        >
          {loading ? "Signing..." : "Sign Message"}
        </button>
        <div className="bg-gray-900 p-4 mt-4 rounded text-white">
          <p id="signature"></p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnector;
