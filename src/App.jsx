import React, { useMemo } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import './index.css';
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import WalletConnector from './WalletConnector';
import WalletGenerator from './WalletGenerator';
import Swap from './Swap';

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const location = useLocation();

  return (
    <ConnectionProvider endpoint={'https://api.devnet.solana.com'}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <nav className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
              <ul className="flex space-x-6 justify-center">
                <li>
                  <Link
                    to="/"
                    className={`hover:underline hover:text-yellow-400 transition duration-300 ${location.pathname === '/' ? 'text-yellow-400 font-semibold' : ''}`}
                  >
                    Wallet Generator
                  </Link>
                </li>
                <li>
                  <Link
                    to="/adapter"
                    className={`hover:underline hover:text-yellow-400 transition duration-300 ${location.pathname === '/adapter' ? 'text-yellow-400 font-semibold' : ''}`}
                  >
                    Wallet Adapter
                  </Link>
                </li>
                <li>
                  <Link
                    to="/swap"
                    className={`hover:underline hover:text-yellow-400 transition duration-300 ${location.pathname === '/swap' ? 'text-yellow-400 font-semibold' : ''}`}
                  >
                    Swap Tokens
                  </Link>
                </li>
              </ul>
            </nav>

            <Routes>
              <Route path="/" element={<WalletGenerator />} />
              <Route path="/adapter" element={<WalletConnector />} />
              <Route path="/swap" element={<Swap />} />
            </Routes>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
