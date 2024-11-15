import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { ArrowDownUp } from 'lucide-react';
import { LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

const Swap = () => {
    const { publicKey, signTransaction, connected } = useWallet();
    const { connection } = useConnection();
    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Constants for token addresses
    const INPUT_MINT = 'So11111111111111111111111111111111111111112'; // SOL
    const OUTPUT_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

    const getQuote = async (inputAmount) => {
        try {
            if (!inputAmount || isNaN(inputAmount) || parseFloat(inputAmount) <= 0) {
                throw new Error('Invalid input amount');
            }

            const amount = Math.floor(parseFloat(inputAmount) * LAMPORTS_PER_SOL);
            const response = await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=${INPUT_MINT}`+
                `&outputMint=${OUTPUT_MINT}`+
                `&amount=${amount}`+
                `&slippageBps=50`+
                `&onlyDirectRoutes=true`+
                `&asLegacyTransaction=true`
            );

            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
                throw new Error('Failed to fetch quote from API');
            }

            const quoteResponse = await response.json();
            console.log("Quote Response:", quoteResponse);
            
            if (quoteResponse.outAmount) {
                const outAmount = quoteResponse.outAmount / 1_000_000; // Convert from USDC decimals (6)
                setOutputAmount(outAmount.toFixed(6));
                return quoteResponse;
            }

            console.error('API response did not contain data:', quoteResponse);
            throw new Error('Failed to get quote');
        } catch (error) {
            console.error('Error getting quote:', error.message || error);
            throw error;
        }
    };

    const handleMaxClick = async () => {
        if (!connected) return;

        try {
            const balance = await connection.getBalance(publicKey);
            // Leave 0.01 SOL for transaction fees
            const maxAmount = (balance / LAMPORTS_PER_SOL) - 0.01;
            setInputAmount(maxAmount.toFixed(9));
            await getQuote(maxAmount.toFixed(9));
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const handleInputChange = async (value) => {
        setInputAmount(value);
        if (value && parseFloat(value) > 0) {
            try {
                await getQuote(value);
            } catch (error) {
                setOutputAmount('');
            }
        } else {
            setOutputAmount('');
        }
    };

    const handleSwap = async () => {
        if (!connected || !signTransaction) {
            alert('Please connect your wallet!');
            return;
        }

        if (!inputAmount || parseFloat(inputAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            console.log("Getting quote...");
            const quoteResponse = await getQuote(inputAmount);
            console.log("Quote response:", quoteResponse);

            console.log("Fetching swap transaction...");
            const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    prioritizationFeeLamports: 10000,
                    slippageBps: 50
                })
            });

            if (!swapResponse.ok) {
                const errorData = await swapResponse.text();
                console.error('Swap API Error:', errorData);
                throw new Error(`Failed to fetch swap transaction: ${errorData}`);
            }

            const swapData = await swapResponse.json();
            console.log("Swap data:", swapData);

            if (!swapData.swapTransaction) {
                throw new Error('Failed to get swap transaction');
            }

            const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
            console.log("Transaction buffer created:", swapTransactionBuf);

            let transaction;
            try {
                transaction = VersionedTransaction.deserialize(swapTransactionBuf);
                console.log("Transaction deserialized successfully");
            } catch (e) {
                console.error("Deserialization error:", e);
                throw new Error("Failed to deserialize transaction");
            }

            const signedTransaction = await signTransaction(transaction);
            console.log("Transaction signed successfully");

            const rawTransaction = signedTransaction.serialize();
            console.log("Sending transaction...");
            
            const txid = await connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
                maxRetries: 3,
                preflightCommitment: 'processed',
                minContextSlot: swapData.lastValidBlockHeight,
                maxContextSlot: swapData.lastValidBlockHeight + 32
            });
            console.log("Transaction sent with ID:", txid);

            console.log("Confirming transaction...");
            const confirmation = await connection.confirmTransaction({
                signature: txid,
                blockhash: swapData.blockhash,
                lastValidBlockHeight: swapData.lastValidBlockHeight
            }, 'processed');

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            alert('Swap completed successfully!');
            console.log(`Transaction successful! View at https://solscan.io/tx/${txid}`);

            setInputAmount('');
            setOutputAmount('');

        } catch (error) {
            console.error('Swap failed:', error);
            alert(`Swap failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-md">
                {connected ? (
                    <div className="walletabt text-xl">
                        <h1>Connected Wallet:</h1>
                        <h3 className="my-3 text-purple-300">
                            {publicKey.toString().slice(0, 15)}...
                        </h3>
                    </div>
                ) : (
                    <div className="text-center mb-4 text-yellow-400">
                        Please connect your wallet to swap
                    </div>
                )}

                {/* You Pay Section */}
                <div className="mb-6">
                    <label className="block text-gray-400 mb-2">You Pay</label>
                    <div className="flex items-center space-x-3 bg-gray-700 p-4 rounded-lg">
                        <input
                            type="number"
                            value={inputAmount}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="0"
                            className="bg-transparent text-white text-2xl outline-none w-full"
                            disabled={loading || !connected}
                            min="0"
                            step="0.000000001"
                        />
                        <div className="text-gray-400">SOL</div>
                        <button
                            className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 disabled:opacity-50"
                            onClick={handleMaxClick}
                            disabled={loading || !connected}
                        >
                            Max
                        </button>
                    </div>
                    <div className="text-gray-500 mt-2">
                        ${(inputAmount * 1).toFixed(2)}
                    </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center mb-6">
                    <button
                        onClick={handleSwap}
                        disabled={loading || !connected || !inputAmount}
                        className={`flex items-center space-x-2 p-3 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors
                            ${(loading || !connected || !inputAmount) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <ArrowDownUp className="text-2xl" />
                        {loading && <span className="text-sm ml-2">Swapping...</span>}
                    </button>
                </div>

                {/* You Receive Section */}
                <div>
                    <label className="block text-gray-400 mb-2">You Receive</label>
                    <div className="flex items-center space-x-3 bg-gray-700 p-4 rounded-lg">
                        <input
                            type="number"
                            value={outputAmount}
                            readOnly
                            placeholder="0"
                            className="bg-transparent text-white text-2xl outline-none w-full"
                        />
                        <div className="text-gray-400">USDC</div>
                    </div>
                    <div className="text-gray-500 mt-2">
                        ${(outputAmount * 1).toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Swap;