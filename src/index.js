import React from 'react';
import ReactDOM from 'react-dom/client';
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from "ethers";
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/walletContext';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'react-loading-skeleton/dist/skeleton.css'
import 'react-lazy-load-image-component/src/effects/blur.css';
import './index.css';
window.Buffer = window.Buffer || require("buffer").Buffer;
const root = ReactDOM.createRoot(document.getElementById('root'));
const getLibrary = (provider) => {
  const library = new ethers.providers.Web3Provider(provider);
  return library;
};

root.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <WalletProvider>
        <App />
        <Toaster position="top-right" />
      </WalletProvider>
    </Web3ReactProvider>
  </React.StrictMode>
);
