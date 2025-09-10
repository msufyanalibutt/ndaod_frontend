import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
const SideShiftContext = createContext({});
export const SideShiftProvider = ({ children }) => {
    const [coins, setCoins] = useState([]);
    const [tempCoins, setTempCoins] = useState([]);
    const [sellCoin, setSellCoin] = useState({
        name: 'USDC',
        coin: 'USDC',
        network: 'polygon'
    });
    const [buyCoin, setBuyCoin] = useState({
        name: 'Ethereum',
        coin: 'ETH',
        network: 'ethereum'
    });
    useEffect(() => {
        getListofCoins();
    }, [])
    const getListofCoins = async () => {
        try {
            const result = await axios.get('https://sideshift.ai/api/v2/coins');
            setCoins(result.data);
            setTempCoins(result.data);
        } catch (error) {
        }
    }
    const swapCoins = () => {
        let swap = sellCoin;
        setSellCoin(buyCoin);
        setBuyCoin(swap);
    }
    return (
        <SideShiftContext.Provider value={{
            coins,
            tempCoins,
            setCoins,
            sellCoin,
            setSellCoin,
            buyCoin,
            setBuyCoin,
            swapCoins
        }}>
            {children}
        </SideShiftContext.Provider>
    )
}

export const SIDESHIFTCONTEXT = () => useContext(SideShiftContext);