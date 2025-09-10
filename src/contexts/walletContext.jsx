import React, { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';
import {
    index_contract_abi, index_contract_address,
    dao_contract_abi, daoViewer_contract_abi, daoViewer_contract_address,
    custom_contract_abi, ShopLp_contract_address,
    ShopLp_contract_abi,
    lp_contract_abi,
    swap_contract_abi,
    bridge_contract_abi,
    PrivateExitModule_contract_address,
    PartialExitModule_contract_address,
    privateExit_contract_abi,
    partialExit_contract_abi,
    ShopTrading_contract_address,
    ShopTa_contract_abi,
    TradingAccount_contract_abi
} from '../utils/index';
import { useWeb3React } from '@web3-react/core';
const WalletContext = createContext({});

export const WalletProvider = ({ children }) => {
    const [daos, setDaos] = useState([]);
    const {
        library,
        chainId,
    } = useWeb3React();

    const getProvider = () => {
        const provider = new ethers.providers.Web3Provider(library.provider);
        return provider;
    }
    const getSigner = ()=>{
        const provider = getProvider();
        const signer = provider.getSigner();
        return signer;
    }
    const getIndexContract = () => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(index_contract_address[chainId], index_contract_abi, signer);
        return indexContract;
    }
    const getDaoContract = (dao_contract_address) => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const daoContract = new ethers.Contract(dao_contract_address, dao_contract_abi, signer);
        return daoContract;
    }
    const getDaoViewerContract = () => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(daoViewer_contract_address[chainId], daoViewer_contract_abi, signer);
        return indexContract;
    }
    const getShopLPContract = () => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(ShopLp_contract_address[chainId], ShopLp_contract_abi, signer);
        return indexContract;
    }
    const getShopTaContract = () => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(ShopTrading_contract_address[chainId], ShopTa_contract_abi, signer);
        return indexContract;
    }
    const getShopTAccountContract = (address) => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(address, TradingAccount_contract_abi, signer);
        return indexContract;
    }
    const getLpContract = (contractAddress) => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(contractAddress, lp_contract_abi, signer);
        return indexContract;
    }
    const getCustomContract = (contractAddress) => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(contractAddress, custom_contract_abi, signer);
        return indexContract;
    }
    const getSwapContract = (contractAddress) => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(contractAddress, swap_contract_abi, signer);
        return indexContract;
    }
    const getBridgeContract = (contractAddress) => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(contractAddress, bridge_contract_abi, signer);
        return indexContract;
    }
    const createYourDao = async () => {
        const contract = getIndexContract();
        return contract;
    }
    const daoList = async (user) => {
        try {
            const contract = getDaoViewerContract();
            const result = await contract.userDaos(user, index_contract_address[chainId]);
            return result;
        } catch (error) {
        }
    }
    const dao = async (address) => {
        try {
            const contract = getDaoContract(address);
            // const result = await contract.getDaos();
            return contract;
        } catch (error) {
        }
    }
    const getPrivateExitContract = () => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(PrivateExitModule_contract_address[chainId], privateExit_contract_abi, signer);
        return indexContract;
    }
    const getPartialExitContract = () => {
        const provider = getProvider();
        const signer = provider.getSigner();
        const indexContract = new ethers.Contract(PartialExitModule_contract_address[chainId], partialExit_contract_abi, signer);
        return indexContract;
    }
    const getUserDaos = async (user) => {
        try {
            const contract = getDaoViewerContract();
            const result = await contract.getDaos(index_contract_address[chainId]);
            setDaos(result);
        } catch (error) {

        }
    }
    return (
        <WalletContext.Provider value={{
            createYourDao,
            daoList,
            dao,
            getDaoViewerContract,
            getProvider,
            getSigner,
            getCustomContract,
            getShopLPContract,
            getLpContract,
            getSwapContract,
            getBridgeContract,
            getPrivateExitContract,
            getPartialExitContract,
            getUserDaos,
            daos,
            getShopTaContract,
            getShopTAccountContract,
        }}>
            {children}
        </WalletContext.Provider>
    )
}

export const WALLETCONTEXT = () => useContext(WalletContext);