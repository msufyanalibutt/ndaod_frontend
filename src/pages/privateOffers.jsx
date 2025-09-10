import { useWeb3React } from '@web3-react/core';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Modal, ModalBody, Form, FormGroup, FormLabel, FormControl, Spinner } from 'react-bootstrap';
import { WALLETCONTEXT } from '../contexts/walletContext';
import ConnectWallet from '../components/sidebar/connectWallet';
import { HiLockOpen } from 'react-icons/hi';
import { NavLink, useParams } from 'react-router-dom';
import { ShopLp_contract_address, truncateAddress } from '../utils';
import Toastify from '../components/toast';
import { MdClose } from 'react-icons/md'
import { constants } from 'ethers';
const PrivateOffers = () => {
    const { account, active, chainId, library } = useWeb3React();
    const { getShopLPContract, getCustomContract } = WALLETCONTEXT();
    const { address } = useParams();
    // const [owner, setOwner] = useState(false);
    const [privateOffers, setPrivateOffers] = useState([])
    const [show, setShow] = useState(false);
    const [item, setItem] = useState(null);
    const [selected, setSelected] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [approved, setApproved] = useState(false);
    useEffect(() => {
        if (active && account) {
            getPrivateOffers();
        }
    }, [account, active, chainId])

    const getInfo = async (currency) => {
        try {
            setLoading(true)
            const contract = await getCustomContract(currency);
            let allowance = await contract.allowance(account, ShopLp_contract_address[chainId]);
            if (allowance > 0) {
                setApproved(true)
            } else {
                setApproved(false)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
        }
    }
    const getPrivateOffers = async () => {
        try {
            const contract = await getShopLPContract();
            const nopo = await contract.numberOfPrivateOffers(address);
            let offers = [];
            for (let i = 0; i < String(nopo); i++) {
                let offer = await contract.privateOffers(address, i);
                let cContract = await getCustomContract(offer.currency);
                let symbol = await cContract.symbol();
                let decimals = await cContract.decimals();
                offer = {
                    recipient: offer.recipient,
                    currency: offer.currency,
                    lpAmount: String(offer.lpAmount),
                    currencyAmount: String(offer.currencyAmount),
                    isActive: offer.isActive,
                    symbol: symbol,
                    decimals
                }
                offers.push(offer);
            }
            setPrivateOffers(offers);
        } catch (error) {
        }
    }
    const handleClose = () => {
        setItem(null);
        setShow(false);
    };
    const handleShow = async (item, index) => {
        setSelected(index);
        setItem(item);
        setShow(true);
        await getInfo(item.currency);
    };
    const HandleSumbit = async (e) => {
        e.preventDefault();
        if (!library) return;
        try {
            setLoading(true);
            const contract = await getShopLPContract();
            const result = await contract.buyPrivateOffer(address, selected);
            await result.wait();
            await getPrivateOffers();
            handleClose();
            setLoading(false);
        } catch (error) {
            Toastify('error', error.message)
            setLoading(false);
        }
    }
    const addToken = async () => {
        try {
            let currency = item.currency
            let value = String(constants.MaxUint256)
            setLoading(true);
            let contract = await getCustomContract(currency);
            let result = await contract.approve(ShopLp_contract_address[chainId], value);
            await result.wait();
            setLoading(false);
            getInfo(item.currency);
        } catch (error) {
            Toastify('error', error.message)
            setLoading(false);
        }
    }
    return (
        <>
            {
                active ?
                    <Container>
                        <Container>
                            <Row>
                                <Col xs={12} xl={7} className="mx-auto py-3">
                                    <NavLink className="dao-btn btn d-block" to={`/initPrivateOffer/${address}`}>Create Private Offer</NavLink>
                                </Col>
                            </Row>
                        </Container>
                        <Container>

                            <Row>
                                <Col xs={12} xl={7} className="mx-auto py-3">
                                    <Row>
                                        <Col className="mb-3 text-white">
                                            <span>RECIPIENT	</span>
                                        </Col>
                                        <Col className="mb-3 text-white text-center">
                                            <span>OFFER</span>
                                        </Col>
                                        <Col className="mb-3 text-white text-center">
                                            <span>STATUS</span>
                                        </Col>
                                        <Col className="mb-3 text-white">

                                        </Col>
                                    </Row>
                                </Col>
                                <Col xs={12} xl={7} className="mx-auto py-1">
                                    {
                                        (privateOffers && privateOffers.length > 0) && privateOffers.map(
                                            (item, index) => (
                                                <Row key={index}>
                                                    <Col className="mb-3 text-white">
                                                        <span>{truncateAddress(item.recipient)}</span>
                                                    </Col>
                                                    <Col className="mb-3 text-white text-center">
                                                        <span>
                                                            {/* {ethers.utils.formatEther(item.lpAmount/`1e${item.decimals}`)} */}
                                                            {Number(item.lpAmount) / Math.pow(10, 18)} LP = {item.currencyAmount / Math.pow(10, item.decimals)} {item.symbol}
                                                        </span>
                                                    </Col>
                                                    <Col className="mb-3 text-white text-center">
                                                        <span>
                                                            {
                                                                item.isActive ?
                                                                    <button className='outline-success'>ACTIVE</button> :
                                                                    <button className='outline-danger'>DISABLED</button>
                                                            }
                                                        </span>
                                                    </Col>
                                                    <Col className="mb-3 text-white text-right">
                                                        {
                                                            item.recipient === account && <button className='dao-btn p-1 px-3'
                                                                disabled={!item.isActive}
                                                                onClick={() => handleShow(item, index)}>Buy</button>
                                                        }
                                                    </Col>
                                                </Row>
                                            )
                                        )
                                    }
                                </Col>
                            </Row>
                        </Container>
                        <Modal show={show} onHide={handleClose} backdrop={false}>
                            <ModalBody>
                                {
                                    (active && item) ?
                                        <>
                                            <Container>
                                                <div className='text-right'>
                                                    <button className='dao-btn px-2 py-0' onClick={handleClose}>
                                                        <MdClose />
                                                    </button>
                                                </div>
                                                <Form onSubmit={HandleSumbit}>
                                                    <FormGroup>
                                                        <FormLabel>
                                                            Current Private Offer: 1 LP = {
                                                                new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(((item.currencyAmount/Math.pow(10,item.decimals)) / (item.lpAmount/Math.pow(10,18))))
                                                            } {item.symbol}
                                                        </FormLabel>
                                                    </FormGroup>
                                                    <FormGroup className='mb-3'>
                                                        <FormLabel htmlFor='lpAmount'>LP Amount</FormLabel>
                                                        <FormControl
                                                            type="number"
                                                            name="lpAmount"
                                                            id="lpAmount"
                                                            defaultValue={item && item.lpAmount / Math.pow(10, 18)}
                                                            disabled
                                                        />
                                                        <small>LP amount you will buy</small>
                                                    </FormGroup>
                                                    <FormGroup className='mb-3'>
                                                        <FormLabel>currency Amount</FormLabel>
                                                        <FormControl
                                                            type="number"
                                                            name="lpAmount"
                                                            id="lpAmount"
                                                            defaultValue={item && item.currencyAmount / Math.pow(10, item.decimals)}
                                                            disabled
                                                        />
                                                        <small>{item && item.symbol} amount you will pay</small>
                                                    </FormGroup>
                                                    {
                                                        approved ? <FormGroup>
                                                            <button
                                                                className='dao-btn btn d-block w-100'
                                                                type="submit"
                                                                disabled={loading}
                                                            >
                                                                {
                                                                    !loading ? 'Buy LP' : <Spinner animation="border" variant="primary" />
                                                                }
                                                            </button>
                                                        </FormGroup> : <FormGroup>
                                                            <button type='button' onClick={addToken} className='dao-btn w-100' disabled={loading}>
                                                                {
                                                                    loading ? <Spinner animation="border" variant="primary" /> : 'Approve'
                                                                }
                                                            </button>
                                                        </FormGroup>
                                                    }

                                                </Form>
                                            </Container>
                                        </> :
                                        <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                                            <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                                        </div>
                                }
                            </ModalBody>
                        </Modal>
                    </Container> :
                    <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                        <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                    </div>
            }
        </>
    )
}
export default PrivateOffers;