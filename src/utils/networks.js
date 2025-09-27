export const networks = {
    // 1: {
    //     chainId: 1,
    //     rpcUrls: ["https://mainnet.optimism.io"],
    //     chainName: "Optimism",
    //     nativeCurrency: { name: "Ethereum", decimals: 18, symbol: "ETH" },
    //     blockExplorerUrls: ["https://optimistic.etherscan.io"],
    //     iconUrls: ["https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png"],
    //     wCoin: "0x4200000000000000000000000000000000000006",
    //     wName: 'WETH',
    //     inchCoin: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    //     inchUsdt: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    //     inch: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
    //     symbosis: '0xf17e248eb6165f937b768bf47c9bd244a1275e62',
    //     bridge: {
    //         ethusdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    //         bnbusdt: '0x55d398326f99059fF775485246999027B3197955',
    //         aaveusdt: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
    //     }
    // },
    137: {
        chainId: 137,
        rpcUrls: [" https://rpc-mumbai.maticvigil.com"],
        chainName: "polygon",
        nativeCurrency: { name: "Polygon", decimals: 18, symbol: "MATIC" },
        blockExplorerUrls: ["https://polygonscan.com"],
        iconUrls: ["https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png"],
        wCoin: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        wName: 'WMATIC',
        inchCoin: '0x0000000000000000000000000000000000001010',
        inchUsdt: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        inch: '0x6352a56caadC4F1E25CD6c75970Fa768A3304e64',
        symbosis: '0xf17e248eb6165f937b768bf47c9bd244a1275e62',
        bridge: {
            ethusdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            bnbusdt: '0x55d398326f99059fF775485246999027B3197955',
            aaveusdt: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
        }
    },
    // 10: {
    //     chainId: 10,
    //     rpcUrls: ["https://mainnet.optimism.io"],
    //     chainName: "Optimism",
    //     nativeCurrency: { name: "Ethereum", decimals: 18, symbol: "ETH" },
    //     blockExplorerUrls: ["https://optimistic.etherscan.io"],
    //     iconUrls: ["https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png"],
    //     wCoin: "0x4200000000000000000000000000000000000006",
    //     wName: 'WETH',
    //     inchCoin: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    //     inchUsdt: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    //     inch: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
    //     symbosis: '0xf17e248eb6165f937b768bf47c9bd244a1275e62',
    //     bridge: {
    //         ethusdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    //         bnbusdt: '0x55d398326f99059fF775485246999027B3197955',
    //         aaveusdt: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
    //     }
    // },
    // 56: {
    //     chainId: 56,
    //     rpcUrls: ["https://bscrpc.com"],
    //     chainName: "BNB Chain",
    //     nativeCurrency: { name: "BNB", decimals: 18, symbol: "BNB" },
    //     blockExplorerUrls: ["https://testnet.bscscan.com"],
    //     iconUrls: ["https://bscscan.com"]
    // },
    // 43114: {
    //     chainId: 43114,
    //     rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    //     chainName: "Avalanche C-Chain",
    //     nativeCurrency: { name: "Avalanche C-Chain", decimals: 18, symbol: "AVAX" },
    //     blockExplorerUrls: ["https://snowtrace.io"],
    //     iconUrls: ["https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png"]
    // },
};

// export const networks = {
//     42: {
//         chainId: 42,
//         rpcUrls: ["https://rinkeby.infura.io/v3/"],
//         chainName: "Ethereum",
//         nativeCurrency: { name: "Ethereum", decimals: 18, symbol: "Ethereum" },
//         blockExplorerUrls: ["https://kovan.etherscan.io"],
//         iconUrls: ["https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png"]
//     },
//     97: {
//         chainId: 97,
//         rpcUrls: ["https://data-seed-prebsc-2-s3.binance.org:8545/"],
//         chainName: "BNB Chain",
//         nativeCurrency: { name: "BNB", decimals: 18, symbol: "BNB" },
//         blockExplorerUrls: ["https://testnet.bscscan.com"],
//         iconUrls: ["https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png"]
//     },
//     80001: {
//         chainId: 80001,
//         rpcUrls: [" https://rpc-mumbai.maticvigil.com"],
//         chainName: "Polygon",
//         nativeCurrency: { name: "Polygon", decimals: 18, symbol: "MATIC" },
//         blockExplorerUrls: ["https://polygonscan.com"],
//         iconUrls: ["https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png"],
//         wCoin: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
//         wName: 'WMATIC',
//         inchCoin: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
//         inchUsdt: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
//         inch: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
//         symbosis: '0xf17e248eb6165f937b768bf47c9bd244a1275e62',
//         bridge: {
//             ethusdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
//             bnbusdt: '0x55d398326f99059fF775485246999027B3197955',
//             aaveusdt: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
//         }
//     }
// };
