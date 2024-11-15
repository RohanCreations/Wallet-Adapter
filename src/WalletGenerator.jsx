import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Alchemy, Network } from 'alchemy-sdk';
import * as bip39 from 'bip39';
import * as solanaWeb3 from '@solana/web3.js';
import { Buffer } from 'buffer';
import bs58 from 'bs58';


window.Buffer = window.Buffer || Buffer;

const alchemySettings = {
    apiKey: 'RW2h2N91EPcIWBXVsXYoMvzrzw8E8TLP',
    network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(alchemySettings);

const WalletGenerator = () => {

    const [wallets, setWallets] = useState([]);
    const [seedPhrase, setSeedPhrase] = useState('');
    const [blockchain, setBlockchain] = useState('ETH');
    const [showSeedPhrase, setShowSeedPhrase] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');
    const [walletBalances, setWalletBalances] = useState({});
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [showPublicKey, setShowPublicKey] = useState(false);
    const [publicKeyCopyStatus, setPublicKeyCopyStatus] = useState('');
    const [privateKeyCopyStatus, setPrivateKeyCopyStatus] = useState('');

    const generateSeedPhrase = () => {
        if (!seedPhrase) {
            const mnemonic = bip39.generateMnemonic();
            setSeedPhrase(mnemonic);
            return mnemonic;
        }
        return seedPhrase;
    };

    const generateEthWallet = async (mnemonic) => {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            blockchain: 'ETH',
        };
    };

    const generateSolWallet = (mnemonic) => {
        const seed = bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);
        const keypair = solanaWeb3.Keypair.fromSeed(Uint8Array.from(seed));
        return {
            address: keypair.publicKey.toBase58(),
            privateKey: bs58.encode(keypair.secretKey),
            blockchain: 'SOL',
        };
    };

    const generateWallets = async () => {
        const mnemonic = generateSeedPhrase();
        let wallet;
        if (blockchain === 'ETH') {
            wallet = await generateEthWallet(mnemonic);
        } else if (blockchain === 'SOL') {
            wallet = generateSolWallet(mnemonic);
        }
        setWallets([...wallets, wallet]);
        checkWalletBalance(wallet);
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(`${type} Copied!`);
        setTimeout(() => setCopyStatus(''), 2000);
    };

    const checkWalletBalance = async (wallet) => {
        if (wallet.blockchain === 'ETH') {
            try {
                const balance = await alchemy.core.getBalance(wallet.address);

                if (balance.isZero()) {
                    setWalletBalances((prev) => ({
                        ...prev,
                        [wallet.address]: '0 ETH',
                    }));
                } else {
                    const formattedBalance = ethers.utils.formatEther(balance);
                    setWalletBalances((prev) => ({
                        ...prev,
                        [wallet.address]: formattedBalance + ' ETH',
                    }));
                }
            } catch (error) {
                console.error("Error fetching Ethereum balance:", error);
                setWalletBalances((prev) => ({
                    ...prev,
                    [wallet.address]: 'Error fetching balance',
                }));
            }
        } else if (wallet.blockchain === 'SOL') {
            try {
                const connection = new solanaWeb3.Connection('https://still-palpable-tree.solana-mainnet.quiknode.pro/96593f4fc3ce742a0f6b5722f2284fd4c1bae74a/');
                const balance = await connection.getBalance(new solanaWeb3.PublicKey(wallet.address));

                setWalletBalances((prev) => ({
                    ...prev,
                    [wallet.address]: (balance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4) + ' SOL',
                }));
            } catch (error) {
                console.error("Error fetching Solana balance:", error);
                setWalletBalances((prev) => ({
                    ...prev,
                    [wallet.address]: 'Error fetching balance',
                }));
            }
        }
    };

    const deleteWallet = (index) => {
        const updatedWallets = [...wallets];
        updatedWallets.splice(index, 1);
        setWallets(updatedWallets);
    };

    return (

        <div className="min-h-screen bg-gray-900 text-gray-100 p-6">

            <h1 className="text-4xl font-bold text-center my-10 text-white">Web Wallet Generator</h1>

            <div className="max-w-md mx-auto">
                <label className="block mb-4">
                    <span className="text-lg text-gray-300">Select Blockchain:</span>
                    <select
                        value={blockchain}
                        onChange={(e) => setBlockchain(e.target.value)}
                        className="mt-2 p-2 bg-gray-800 text-white rounded w-full"
                    >
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="SOL">Solana (SOL)</option>
                    </select>
                </label>

                <button
                    onClick={generateWallets}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-200 shadow-lg"
                >
                    Generate Wallet
                </button>

                {seedPhrase && (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-gray-300">Generated Seed Phrase:</h2>
                        <div className="bg-gray-800 p-6 rounded mt-2 relative">
                            <p className="break-words">
                                {showSeedPhrase ? seedPhrase : '••••••••••••••••••••••••••••••••'}
                            </p>
                            <button
                                onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                                className="mt-4 text-blue-400 hover:text-blue-300"
                            >
                                {showSeedPhrase ? 'Hide' : 'Show'} Seed Phrase
                            </button>
                        </div>
                    </div>
                )}

                {wallets.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-300">Generated Wallets:</h2>
                        {wallets.map((wallet, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 p-6 rounded mb-4 shadow-md w-full"
                            >
                                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                    <p className="font-semibold mb-2 sm:mb-0 text-gray-300">
                                        {wallet.blockchain} Wallet {index + 1}
                                    </p>
                                    <button
                                        onClick={() => deleteWallet(index)}
                                        className="text-red-500 hover:text-red-400 transition mt-2 sm:mt-0"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <div className="mt-4 overflow-hidden bg-gray-700 p-4 rounded">
                                    <strong className="text-gray-300">Public Key:</strong>
                                    <p className="break-words text-gray-200 mb-2">
                                        {showPublicKey ? wallet.address : '••••••••••••••••••••••••••••••••'}
                                    </p>
                                    <button
                                        onClick={() => setShowPublicKey(!showPublicKey)}
                                        className="text-blue-400 hover:text-blue-300 text-sm mr-4"
                                    >
                                        {showPublicKey ? 'Hide' : 'Show'} Public Key
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(wallet.address, 'Public Key', setPublicKeyCopyStatus)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1 px-2 rounded transition duration-200 text-sm"
                                    >
                                        {publicKeyCopyStatus ? publicKeyCopyStatus : 'Copy'}
                                    </button>
                                </div>

                                <p className="text-gray-200 mt-4">
                                    <strong>Balance:</strong> {walletBalances[wallet.address] || 'Loading...'}
                                </p>
                                <div className="mt-4 overflow-hidden bg-gray-700 p-4 rounded">
                                    <strong className="text-gray-300">Private Key:</strong>
                                    <p className="break-words text-gray-200 mb-2">
                                        {showPrivateKey ? wallet.privateKey : '••••••••••••••••••••••••••••••••'}
                                    </p>
                                    <button
                                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                                        className="text-blue-400 hover:text-blue-300 text-sm mr-4"
                                    >
                                        {showPrivateKey ? 'Hide' : 'Show'} Private Key
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(wallet.privateKey, 'Private Key', setPrivateKeyCopyStatus)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1 px-2 rounded transition duration-200 text-sm"
                                    >
                                        {privateKeyCopyStatus ? privateKeyCopyStatus : 'Copy'}
                                    </button>

                                </div>


                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>

    );
};

export default WalletGenerator;
