import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { chainIds } from '../utils/index';
const injected = new InjectedConnector({
    supportedChainIds: chainIds
});

const walletconnect = new WalletConnectConnector({
    supportedChainIds: chainIds,
    bridge: "https://bridge.walletconnect.org",
    qrcode: true
});


export const connectors = {
    injected: injected,
    walletConnect: walletconnect
};
