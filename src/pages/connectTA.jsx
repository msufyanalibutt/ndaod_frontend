import React, { useEffect, useState } from 'react';
import { Container, Row, Col, FormControl, Placeholder, Button, Modal, ModalBody } from 'react-bootstrap';
import { BsWifiOff } from 'react-icons/bs';
import { useNavigate, useParams } from 'react-router-dom';
import { WALLETCONTEXT } from '../contexts/walletContext';
import ConnectWallet from '../components/sidebar/connectWallet';
import { HiLockOpen } from 'react-icons/hi';
import { useWeb3React } from '@web3-react/core';
import { constants, ethers } from 'ethers';
import { truncateAddress } from '../utils';
import * as randomColor from 'randomcolor';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import connectArray from '../utils/connect.json';
import WalletConnect from "@walletconnect/client";
import Toastify from '../components/toast';
import { networks } from '../utils/networks';
const imageErrorSrc = '/images/NoImageCoinLogo.svg';

const GetImage = ({ url, alttext, newStyle }) => {
    return (
        <LazyLoadImage
            className='img-fluid'
            effect="blur"
            src={url}
            alt={alttext}
            style={newStyle}
            onError={(e) => { e.target.onerror = null; e.target.src = imageErrorSrc }}
        />
    )
}
const ConnectTA = () => {
    const { address, name } = useParams();
    const { account, active, chainId } = useWeb3React();
    const [show, setShow] = useState(false);
    const [defis, setDefis] = useState([])
    const [tradingAccounts, setTradingAccounts] = useState([]);
    const [tradingAccount, setTradingAccount] = useState();
    const [selectedTradingAccount, setSelectedTradingAccount] = useState(null);
    const [uri, setUri] = useState('');
    const [connector, setConnector] = useState(null);
    const [loading, setLoading] = useState(false);
    const { getShopTaContract, getShopTAccountContract } = WALLETCONTEXT();
    const navigate = useNavigate();
    useEffect(() => {
        setDefis(connectArray);
    }, [])
    useEffect(() => {
        if (!connector) {
            let connect = localStorage.getItem('walletconnect');
            connect = JSON.parse(connect);
            if (connect && connect.connected) {
                onURIPastSession(connect);
            }
        }
    }, [])
    useEffect(() => {
        if (connector && active && account) {
            subscribeToEvents();
            if (connector._connected) {
                getTradingAccountInfo(connector._accounts[0])
            } else {
                getTradingAccountList();
            }
        }
    }, [connector, account, active]);
    const getTradingAccountList = async () => {
        console.log(address);
        try {
            const contract = await getShopTaContract();
            const list = await contract.getTAs(address);
            let taList = []
            for (let ta of list) {
                const taContract = await getShopTAccountContract(ta);
                const name = await taContract.name();
                const balance = await taContract.balanceOf(account);
                if (String(balance) > 0) {
                    taList.push({ name, ta: ta });
                }
            }
            setTradingAccounts(taList);
        } catch (error) {
        }
    }
    const getTradingAccountInfo = async (address) => {
        try {
            setLoading(true)
            const contract = await getShopTAccountContract(address);
            const name = await contract.name();
            const symbol = await contract.symbol();
            setTradingAccount({
                ta: address,
                taName: name,
                taSymbol: symbol
            })
            setLoading(false)
        } catch (error) {
            Toastify('error', error.message)
        }
    }
    const onURIPastSession = async (connect)=>{
        const uri = `wc:${connect.handshakeTopic}@1?bridge=${connect.bridge}&key=${connect.key}`;
        setUri(uri);
        if (connect) {
            connectSessionDefi(connect);
        }
    }
    const connectSessionDefi = async (session)=>{
        try {
            setLoading(true)
            const connector = new WalletConnect({
                session
            });
            const { connected } = connector;
            setConnector(connector);
        } catch (error) {
            Toastify('error', error.message);
        }
    }
    const onURIPaste = async (value) => {
        setUri(value);
        if (value) {
            connectDefi(value);
        }
    };
    const connectDefi = async (value) => {

        try {
            setLoading(true)
            const connector = new WalletConnect({
                uri: value
            });
            if (!connector.connected) {
                await connector.createSession();
            }
            setConnector(connector);
        } catch (error) {
            Toastify('error', error.message);
        }
    }
    const subscribeToEvents = () => {
        if (connector) {
            connector.on("session_request", (error, payload) => {

                if (error) {
                }
                setLoading(false)
            });
            connector.on("session_update", (error, payload) => {

                if (error) {
                }
                console.log(payload)
            });
            connector.on("disconnect", (error, payload) => {

                if (error) {
                }
                resetApp();
            });
            connector.on("call_request", async (error, payload) => {

                if (error) {
                    throw error;
                }
                if (payload.params.length > 0) {
                    let pload = payload.params[0];
                    // console.log(pload)
                    // console.log(ethers.utils.getAddress(pload.to))
                    navigate(`/taCustomTransaction/${pload.from}?targetAddress=${pload.to}&data=${pload.data ? pload.data : ''}&value=${pload.value ? pload.value : '0x00'}&desc=${connector.peerMeta.description}`)
                }
            });
        }
    }
    const killSession = () => {
        if (connector) {
            connector.killSession();
            resetApp()
        }
    }
    const approveSession = async (address) => {
        if (connector) {
            setLoading(true);
            await connector.approveSession({ chainId, accounts: [address] });
            setLoading(false)
        }
    }
    const resetApp = () => {
        localStorage.removeItem('walletconnect');
        setConnector(null);
        setUri('');
        setTradingAccounts([]);
        setSelectedTradingAccount(null);
        setTradingAccount(null);
    }
    const HandleSelectedDao = (ta) => {
        getTradingAccountInfo(ta)
        setSelectedTradingAccount(ta);
        approveSession(ta);
        setTradingAccounts([])
    }

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    return (
        <>
            {active ? <>
                <Container className='py-3'>
                    <Row>
                        <Col xs={12} xl={8} className="mx-auto text-white">
                            <h1>Connect</h1>
                            <p>Connect your Trading Account to any DeFi project. Possibilities are limitless.</p>
                            <Button variant="secondary" onClick={handleShow}>How to Connect?</Button>
                        </Col>
                    </Row>
                </Container>
                <Container className='py-3'>
                    <Row>
                        <Col xs={12} xl={8} className="mx-auto text-white">
                            <h4>WalletConnect URI</h4>
                            <FormControl
                                name="uri"
                                placeholder='Enter URI Here'
                                value={uri}
                                onChange={(e) => onURIPaste(e.target.value)}
                                disabled={tradingAccount ? true : false}
                            />

                        </Col>
                    </Row>
                </Container>
                {
                    loading ? <Container className='py-3'>
                        <Row>
                            <Col xs={12} xl={8} className="mx-auto">
                                <Placeholder as="p" animation="glow" size="lg">
                                    <Placeholder xs={12} className="connect-placeholder" />
                                </Placeholder>
                            </Col>
                        </Row>
                    </Container> : <Container className='py-3'>
                        <Row>
                            {
                                connector && <Col xs={12} xl={8} className="mx-auto text-white">
                                    {
                                        connector.peerMeta &&
                                        <>
                                            <div className={`d-flex align-items-center py-2 px-3 tabborder mb-3`}>
                                                <div className='me-3'>
                                                    <img src={networks[chainId].iconUrls} alt="avatar" style={{ width: '25px' }} />
                                                </div>
                                                <div>
                                                    <p className='p-0 m-0'>
                                                        <span className='text-white'>
                                                            {networks[chainId].nativeCurrency.name}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`d-flex align-items-center py-2 px-3 tabborder mb-3`}>
                                                <div className='me-3'>
                                                    <img src={connector.peerMeta.icons[0]} alt="avatar" style={{ width: '25px' }} />
                                                </div>
                                                <div>
                                                    <p className='p-0 m-0'>
                                                        <span className='text-white'>
                                                            {connector.peerMeta.name}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    }
                                    {
                                        tradingAccount && <>
                                            <h5>Connected Trading Account</h5>
                                            <div className={`d-flex align-items-center py-2 px-3 mb-3 tabborder`}>
                                                <div className='profile me-3' style={{ width: '40px', height: '40px', background: randomColor() }}>
                                                </div>
                                                <div>
                                                    <p className='p-0 m-0'>
                                                        <span className='text-white'>
                                                            {tradingAccount.symbol}
                                                        </span>
                                                    </p>
                                                    <p className='p-0 m-0 text-white'>{truncateAddress(tradingAccount.ta)}</p>
                                                </div>
                                            </div>
                                            <h5>You are connected now. Return to a service and create transaction</h5>
                                        </>
                                    }
                                </Col>
                            }
                            <Col xs={12} xl={8} className="mx-auto text-white">

                                <Row xs={1} sm={2} md={3}>
                                    {
                                        tradingAccounts.map((ta, index) => (
                                            !(constants.AddressZero === ta.ta) &&
                                            <Col key={index} className="mb-3">
                                                <div className={`d-flex align-items-center py-2 px-3 ecosystem ${selectedTradingAccount === ta.ta && 'selectedecosystem'}`} onClick={() => HandleSelectedDao(ta.ta)}>
                                                    <div className='profile me-3' style={{ width: '40px', height: '40px', background: randomColor() }}>
                                                    </div>
                                                    <div>
                                                        <p className='p-0 m-0'>
                                                            <span className='text-white'>
                                                                {ta.name}
                                                            </span>
                                                        </p>
                                                        <p className='p-0 m-0 text-white'>{truncateAddress(ta.ta)}</p>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))
                                    }
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                }
                {
                    (connector && connector.connected) && <Container>
                        <Row>
                            <Col xs={12} xl={8} className="mx-auto">
                                <Button className='w-100' variant="outline-danger" onClick={killSession}>
                                    <BsWifiOff className='icon' /> Disconnect
                                </Button>
                            </Col>
                        </Row>
                    </Container>
                }
                {
                    !tradingAccount && <Container className='py-3'>
                        <Row>
                            <Col xs={12} xl={8} className="mx-auto text-white">
                                <h6>Some examples of DeFi projects that you can connect.</h6>
                                <Row xs={1} sm={2} md={3} lg={4}>
                                    {
                                        defis.map((item, index) => (
                                            <Col className="mb-3" key={index}>
                                                <div className="flip-card">
                                                    <div className="flip-card-inner" style={{ paddingTop: '75px', paddingBottom: '75px' }}>
                                                        <div className="flip-card-front tabborder">
                                                            <GetImage
                                                                url={`/images/${item.image}`}
                                                                alttext="avatar"
                                                                newStyle={{ maxWidth: '100%', width: '40px' }}
                                                            />
                                                            <h6>{item.name}</h6>
                                                        </div>
                                                        <div className="flip-card-back">
                                                            <div className='d-flex align-items-center p-3 pb-0'>
                                                                <GetImage
                                                                    url={`/images/${item.image}`}
                                                                    alttext="avatar"
                                                                    newStyle={{ maxWidth: '100%', width: '30px', marginRight: '5px' }} />
                                                                <h6>{item.name}</h6>
                                                            </div>
                                                            <div className='d-flex p-3'>
                                                                {item.type}
                                                            </div>
                                                            <div className='px-3'>
                                                                <a
                                                                    rel="noopener noreferrer"
                                                                    href={item.url}
                                                                    target='_blank'
                                                                    className='dao-btn m-0 p-0 d-block'
                                                                    style={{ border: '1px solid #2E7BFF' }}
                                                                >Go To Dapp</a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))
                                    }
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                }

                <Modal show={show} onHide={handleClose} centered>
                    <ModalBody>
                        <h4 className="mb-3">How to Connect?</h4>
                        <Row>
                            <Col className='text-center mb-3'>
                                <p className='text-white text-decoration-none px-5 py-1' style={{ border: '1px solid white', borderRadius: '3px' }}>
                                    https://...
                                </p>
                            </Col>
                            <Col xs={12} sm={7} className="mb-3">
                                <p className='text-center p-0 m-0'>Visit the site of DeFi project, that you would like to connect to</p>
                            </Col>
                        </Row>
                        <Row>
                            <Col className="mb-3">
                                <div className='text-center mx-auto' style={{ width: '40px' }}>
                                    <img src="/images/walletconnecticon.svg" style={{ maxWidth: '100%' }} alt="walletconnecticon" />
                                </div>
                            </Col>
                            <Col xs={12} sm={7} className="mb-3">
                                <p className='text-center p-0 m-0'>Click Wallet Connect, then copy the URI to clipboard</p>
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-center mb-3">
                                <Button className='px-4 py-1' size="sm">Connect</Button>
                            </Col>
                            <Col className="mb-3" xs={12} sm={7}>
                                <p className='text-center p-0 m-0'> Come back, paste the URI, and connect your Trading Account</p>
                            </Col>
                        </Row>
                    </ModalBody>
                </Modal>
            </> :
                <>
                    <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                        <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                    </div>
                </>
            }
        </>
    )
}
export default ConnectTA;