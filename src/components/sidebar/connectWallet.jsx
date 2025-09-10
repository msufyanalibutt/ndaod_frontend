import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { truncateAddress, chainIds } from '../../utils';
import { connectors } from '../../utils/connectors';
import Button from '../button';
import Toastify from '../toast';
const { ethereum } = window;
const ConnectWallet = (props) => {
    const [show, setShow] = useState(false);
    const [read, setRead] = useState(false);
    const {
        account,
        activate,
        deactivate,
        active
    } = useWeb3React();
    useEffect(() => {
        const provider = window.localStorage.getItem("provider");
        if (provider) activate(connectors[provider]);
    }, []);
    const handleClose = () => {
        setShow(false);
    };
    const handleShow = () => setShow(true);
    const setProvider = (type) => {
        window.localStorage.setItem("provider", type);
    }
    const handleMetaMask = async () => {
        if (!ethereum) {
            Toastify('error', 'Please Install Metamask wallet');
            return;
        }
        if (ethereum.networkVersion && chainIds.indexOf(Number(ethereum.networkVersion)) === -1) {
            Toastify('error', `Unsupported Chain Id, Supported Chain Ids are ${String(chainIds)}`)
        }
        await activate(connectors.injected);
        setProvider("injected");
        handleClose();
    }
    const handleWalletConnect = async () => {
        await activate(connectors.walletConnect);
        setProvider("walletConnect");
        handleClose();
    }
    const refreshState = () => {
        window.localStorage.setItem("provider", undefined);
        setRead(false);
    };
    const disconnect = () => {
        refreshState();
        deactivate();
    };
    return (
        <>
            {
                active ? <button className='custom-btn py-2' onClick={disconnect}>
                    {truncateAddress(account)}
                </button> : <Button {...props} handleClick={handleShow} />
            }
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Body>
                    <div className='px-3'>
                        <h4 className='mb-3'>Connect to a wallet</h4>
                        <p className='mb-2'>
                            <b>
                                Accept <a href="/#" className='link'>Privacy Policy</a> and <a href="/#" className='link'>Terms of use</a>
                            </b>
                        </p>
                        <div>
                            <Form.Check
                                type={'checkbox'}
                                style={{ display: 'inline-block', cursor: "pointer" }}
                                id="terms"
                                checked={read}
                                onChange={({ target }) => setRead(target.checked)}
                            />&nbsp;<label htmlFor='terms' style={{ fontSize: '18px', cursor: 'pointer' }}>I read and accepted</label>
                        </div>
                    </div>
                    <div>
                        <button href="/#" className='custom-btn py-2' onClick={handleMetaMask} disabled={!read}>
                            <img src="/images/metamask.webp" alt="metamask" width={'35px'} style={{ marginRight: '10px' }} />
                            MetaMask
                        </button>
                        <button href="/#" className='custom-btn py-2' onClick={handleWalletConnect} disabled={!read}>
                            <img src="/images/walletconnect.webp" alt="metamask" width={'35px'} style={{ marginRight: '10px' }} />
                            WalletConnect
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default ConnectWallet;