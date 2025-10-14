import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { HiLockOpen } from 'react-icons/hi';
import { ImCross } from 'react-icons/im';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import axois from '../../utils/api';
import Toastify from '../../components/toast';
import ConnectWallet from '../../components/sidebar/connectWallet';
import { PartialExitModule_contract_address, truncateAddress } from '../../utils';
import ClipBoard from '../../components/clipboard';
import BurnLP from '../../components/partialExit/burnLP';

const DisablePrivateOffers = ({ offerId, recipient }) => {
    const { dao } = WALLETCONTEXT();
    const [loading, setLoading] = useState(false);
    const { library, account, chainId } = useWeb3React();
    const navigate = useNavigate();
    const { address } = useParams();
    const disableOffer = async () => {
        if (!library) return;
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            const iface = createForIface(offerId);
            const txHash = await contract.getTxHash(
                PartialExitModule_contract_address[chainId],
                iface,
                0,
                0,
                timestamp
            )
            const signature = await library.provider.request({
                method: "personal_sign",
                params: [txHash, account]
            })
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: PartialExitModule_contract_address[chainId],
                title: `Disable Private Exit Offer for ${truncateAddress(recipient)}`,
                description: '',
                chainId,
                value: 0,
                nonce: 0,
                createdAt: timestamp,
                timestamp: 0,
                txHash,
                creator: account
            }
            await axois.post('/create/voting', body);
            setLoading(false)
            navigate(`/dao/${address}/votingPage/${txHash}`);
        } catch (error) {
            Toastify('error', error);
            setLoading(false)
        }
    }
    const createForIface = (offerId) => {
        let ABI = [`function disablePartialExitOffer(uint256)`];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("disablePartialExitOffer", [offerId]);
        return iface
    }
    return <>
        <button
            type="button"
            className='dao-btn p-0 m-0 px-2 py-1'
            style={{ borderColor: 'var(--bs-red)', color: 'var(--bs-red)' }}
            onClick={disableOffer}
            disabled={loading}
        >
            {
                loading ? <Spinner animation="border" variant="danger" size="sm" /> : 'Disable'
            }
        </button>
    </>
}
const PrivateExist = () => {
    const [owner, setOwner] = useState(false);
    const [lp, setLP] = useState(false);
    const navigate = useNavigate();
    const { account, chainId, active } = useWeb3React();
    const { dao, getPartialExitContract } = WALLETCONTEXT();
    const { address } = useParams();
    const [partialOffers, setPartialsOffers] = useState([]);
    const [partialOffer, setPartialOffer] = useState(null);
    const [bpOffer, setBPOffer] = useState(false);

    useEffect(() => {
        if (active && account && chainId) {
            getListOfPartialOffers();
            getDaoMembers();
        }
    }, [account, chainId, active]);
    const getDaoMembers = async () => {
        try {
            const contract = await dao(address);
            const balanceOf = await contract.balanceOf(account);
            if (String(balanceOf) > 0) {
                setOwner(true);
            } else {
                setOwner(false);
            }
            const lp = await contract.lp();
            setLP(ethers.constants.AddressZero !== lp);
        } catch (error) {
        }
    }
    const getListOfPartialOffers = async () => {
        try {
            const contract = await getPartialExitContract();
            let result = await contract.getOffers(address);
            result = result.map(item => ({
                ...item,
                isActive: item.isActive,
                recipient: item.recipient,
                lpAmount: ethers.utils.formatEther(item.lpAmount)
            }));
            setPartialsOffers(result)
        } catch (error) {
            Toastify('error', error);
        }
    }
    const navigateToPartial = () => {
        navigate(`/dao/${address}/modules/createPartial`);
    }
    const handleCloseBPOffer = () => {
        setPartialOffer(null);
        setBPOffer(false);
        getListOfPartialOffers();
    }
    const handleShowBPOffer = () => setBPOffer(true);
    const getPartialOffer = (item, index) => {
        setPartialOffer({ ...item, index });
        handleShowBPOffer();
    }
    return (
        <>
            {
                active ? <>
                    <Container>
                        <Row>
                            <Col xs={12} lg={8} className="mx-auto text-white my-3">
                                <h2>Partial Exit Offers</h2>
                                <div className='d-flex align-items-center text-white mb-3'>
                                    <div className='profile' style={{ marginRight: '10px', width: '30px', height: '30px' }}>
                                    </div>
                                    <p className='p-0 m-0' style={{ fontSize: '20px' }}>
                                        {truncateAddress(address)} <ClipBoard address={address} />
                                    </p>
                                </div>
                                {
                                    owner ? <>
                                        {
                                            lp ? <button className='dao-btn w-100' onClick={navigateToPartial}>
                                                Creat Partial Exit Offer
                                            </button> :
                                                <NavLink to={`/createLp/${address}`} className='dao-btn w-100 d-block text-center'>Create LP</NavLink>
                                        }</> : ''
                                }
                            </Col>
                            <Col xs={12} lg={8} className="mx-auto text-white">
                                {
                                    partialOffers.map((item, index) => (
                                        <div className='px-3 py-3 pb-1 mb-3' key={index} style={{ background: '#16161e' }}>
                                            <Row >
                                                <Col className="mb-2">
                                                    <div className='d-flex align-items-center text-white mb-1'>
                                                        <div className='profile' style={{ marginRight: '10px', width: '30px', height: '30px' }}>
                                                        </div>
                                                        <NavLink to={`/profile/${item.recipient}`} className='p-0 m-0 me-2 text-white' style={{ fontSize: '14px' }}>
                                                            {truncateAddress(item.recipient)}
                                                        </NavLink>
                                                        <ClipBoard address={item.recipient} />
                                                    </div>
                                                </Col>
                                                {
                                                    account === item.recipient ? <>{
                                                        item.isActive && <Col className="text-right mb-2">
                                                            <button className='dao-btn p-0 m-0 px-2 py-1' onClick={() => getPartialOffer(item, index)} >Burn LP</button>
                                                        </Col>
                                                    }</> : ''
                                                }
                                            </Row>
                                            <Row>
                                                <Col className="mb-2">
                                                    Offer ID: {index}
                                                    {
                                                        item.isActive ? <span className='outline-success px-2 py-1 ms-5'>ACTIVE</span> :
                                                            <span className='outline-danger px-2 py-1 ms-5'>DISABLED</span>
                                                    }

                                                </Col>
                                                {
                                                    owner ? <>
                                                        {
                                                            item.isActive && <Col className="text-right mb-2">
                                                                <DisablePrivateOffers offerId={index} recipient={item.recipient} />
                                                            </Col>
                                                        }</> : ''
                                                }
                                            </Row>
                                        </div>
                                    ))
                                }

                            </Col>
                        </Row>
                    </Container>
                    <Modal show={bpOffer}  >
                        <Modal.Body>
                            <Row>
                                <Col><h4>Burn LP</h4></Col>
                                <Col className="text-right">
                                    <span className='pointer' onClick={handleCloseBPOffer}>
                                        <ImCross />
                                    </span>
                                </Col>
                            </Row>
                            <hr />
                            <BurnLP item={partialOffer} handleCloseBPOffer={handleCloseBPOffer} />
                        </Modal.Body>
                    </Modal>
                </> : <>
                    <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                        <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                    </div>
                </>
            }
        </>
    )
}

export default PrivateExist;
