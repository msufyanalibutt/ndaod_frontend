import { useWeb3React } from '@web3-react/core';
import React, { useState, useEffect } from 'react';
import { Row, Col, Modal, ModalBody, FormControl } from 'react-bootstrap';
import { MdOutlineClose } from 'react-icons/md';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import { exlcude_Address, truncateAddress } from '../../utils';
import { networks } from '../../utils/networks';
import Toastify from '../toast';

const imageErrorSrc = '/images/NoImageCoinLogo.svg';
const GetImage = ({ url, alttext }) => {

    return (
        <LazyLoadImage
            className='img-fluid'
            effect="blur"
            src={url}
            alt={alttext}
            style={{ maxWidth: '40px', width: '100%' }}
            onError={(e) => {e.target.onerror = null; e.target.src = imageErrorSrc}}
        />
    )
}
const BuySwap = ({
    tokens,
    setTokenAddress,
    tokenAddress,
    handleChange,
    handleBlur,
    values,
    setFieldValue,
    senderAddress
}) => {
    const { chainId } = useWeb3React();
    const [buySelected, setBuySelected] = useState(null);
    const [maxBalance, setMaxBalance] = useState(0);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const { getCustomContract } = WALLETCONTEXT();
    const [buyTokens, setBuyTokens] = useState([]);
    const [search, setSearch] = useState('');
    useEffect(() => {
        if (tokenAddress && tokens && tokens.length) {
            setBuyTokens(tokens);
            updateSetSellected();
        }
    }, [tokenAddress, tokens]);
    const updateSetSellected = () => {
        let token = tokens.filter(item => item.address.toLowerCase() === tokenAddress.toLowerCase());
        getCoinBalance(token[0] || tokens[0]);
    }
    const getCoinBalance = async (item) => {
        try {
            setCoinSelected(item);
            let address = item.address === networks[chainId].inchCoin ? exlcude_Address[chainId] : item.address;
            const contract = await getCustomContract(address);
            if (senderAddress) {
                const balance = await contract.balanceOf(senderAddress);
                setMaxBalance(String(balance) / Math.pow(10, item.decimals));
            }
        } catch (error) {
        }
    }
    const setCoinSelected = (item) => {
        setBuySelected(item)
        setTokenAddress(item.address);
        setFieldValue('toName', item.symbol);
        setFieldValue('todecimals', item.decimals);
    }
    const setCoinSelectedByModal = (item) => {
        setBuySelected(item)
        setTokenAddress(item.address);
        setFieldValue('toName', item.symbol);
        setFieldValue('todecimals', item.decimals);
        setSearch('');
        setBuySelected(tokens);
        handleClose();
    }
    const HandleBuyBalance = () => {
        Toastify('info', 'This field cannot be changed. Change only the amount of the sale');
    }
    const searchBuyTokens = (value) => {
        if (value === '') {
            setBuyTokens(tokens);
            return
        }
        let items = buyTokens;
        items = items.filter(item => {
            if (String(item.symbol).toLowerCase().includes(value.toLowerCase()) || String(item.address).toLowerCase().includes(value.toLowerCase())) {
                return true
            } else {
                return false
            }
        })
        if (items.length > 0) {
            setBuyTokens(items);
        } else {
            setBuyTokens(tokens);
        }
    }
    const getBuyTokens = (value) => {
        setSearch(value);
        searchBuyTokens(value)
    }
    return <>
        <div className='tabborder p-3'>
            <Row>
                <Col>
                    <p>You Buy</p>
                </Col>
                <Col className='text-right'>
                    <p>Balance: {Number(maxBalance).toFixed(4)}</p>
                </Col>
            </Row>
            <Row>
                <Col>
                    <button type="button" className='dao-btn d-flex align-items-center justify-content-center' onClick={handleShow}>
                        {
                            buySelected ? <>
                                <img
                                    src={buySelected.logoURI}
                                    style={{ maxWidth: '30px', marginRight: '10px' }} alt={buySelected.logoURI} 
                                    onError={(e) => {e.target.onerror = null; e.target.src = imageErrorSrc}}
                                    />
                                <span>{buySelected.symbol}</span>
                                <MdKeyboardArrowDown />
                            </> : (tokens && tokens.length) && <>
                                <img
                                    src={tokens[0].logoURI}
                                    style={{ maxWidth: '30px', marginRight: '10px' }}
                                    alt={tokens[0].logoURI}
                                    onError={(e) => {e.target.onerror = null; e.target.src = imageErrorSrc}}
                                />
                                <span>{tokens[0].symbol}</span>
                                <MdKeyboardArrowDown />
                            </>
                        }
                    </button>
                    <p className='p-0 m-0 py-1'>
                        {
                            buySelected && <>
                                {
                                    buySelected.address === networks[chainId].inchCoin ? <span>{buySelected.name}</span> : <a
                                        className='text-white'
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        href={`${networks[chainId].blockExplorerUrls}/token/${buySelected.address}`}>
                                        {buySelected && buySelected.name}
                                    </a>
                                }
                            </>
                        }
                    </p>
                </Col>
                <FormControl
                    type="hidden"
                    id="toName"
                    name="toName"
                    className="text-right"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.toName || ""}
                />
                <Col>
                    <FormControl
                        type="text"
                        id="toBalance"
                        name="toBalance"
                        className="text-right"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onClick={HandleBuyBalance}
                        value={values.toBalance || ''}
                        readOnly
                    />
                </Col>
            </Row>
        </div>
        <Modal show={show} onHide={() => {
            setSearch('');
            setBuyTokens(tokens);
            handleClose();
        }} >
            <ModalBody >
                <Row>
                    <Col><h5>Select Token</h5></Col>
                    <Col className="text-right">
                        <button type="button" className='dao-btn p-0 px-2' onClick={handleClose}><MdOutlineClose /></button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <FormControl
                            id="search"
                            name="search"
                            placeholder='Search Token'
                            value={search}
                            onChange={(e) => getBuyTokens(e.target.value)}
                        />
                    </Col>
                </Row>
                {
                    (tokens && tokens.length > 0) && <Row xs={1} className="scroll mt-2"  >
                        {
                            buyTokens.map((item, index) => (
                                <Col key={index} className="token-item py-1" onClick={() => setCoinSelectedByModal(item)}>
                                    <Row>
                                        <Col>
                                            <div className='d-inline-flex align-items-center'>
                                                <div className='me-3'>
                                                    <GetImage url={item.logoURI} alttext={item.symbol} />
                                                </div>
                                                <div>
                                                    <h6>{item.symbol}</h6>
                                                    <p className='m-0 p-0'>{truncateAddress(item.address)}</p>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col className='text-right'>
                                            <h6>{0.0}{' '}{item.symbol}</h6>
                                            <p className='m-0 p-0'>${0.0}</p>
                                        </Col>
                                    </Row>
                                </Col>
                            ))
                        }
                    </Row>
                }
            </ModalBody>
        </Modal>
    </>
}
export default BuySwap;