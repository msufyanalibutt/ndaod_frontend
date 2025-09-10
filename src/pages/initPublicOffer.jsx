import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner, FormCheck, Modal } from 'react-bootstrap';
import { HiLockOpen, HiSpeakerphone } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../contexts/walletContext';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { covalent, exlcude_Address, ShopLp_contract_address, truncateAddress } from '../utils';
import axois from '../utils/api';
import Toastify from '../components/toast';
import ConnectWallet from '../components/sidebar/connectWallet';
import { BsLightningFill } from 'react-icons/bs';
import { ImCross } from 'react-icons/im';
import axios from 'axios';
import { networks } from '../utils/networks';
const imageErrorSrc = '/images/NoImageCoinLogo.svg';
const InitPublicOffer = () => {
    const [loading, setLoading] = useState(false)
    const [iloading, setiLoading] = useState(false)
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao, getCustomContract } = WALLETCONTEXT();
    const { address } = useParams();
    const [symbol, setSymbol] = useState(null);
    const [decimals, setDecimals] = useState(0);
    const [assets, setAssets] = useState([]);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    useEffect(() => {
        if (active && address && chainId) {
            getDaoMembers(address);
            getDaoAssets();
        }
    }, [address, chainId, active])
    const handleFormSubmit = async ({ active, title, tokenAddress, rate, description }) => {
        if (!library) return;
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(active, tokenAddress, rate)
            const txHash = await contract.getTxHash(
                ShopLp_contract_address[chainId],
                iface,
                0,
                0,
                timestamp
            )
            const signature = await library.provider.request({
                method: "personal_sign",
                params: [txHash, account]
            })
            if (!owner) {
                Toastify('error', 'Request failed with status code 400');
                return;
            }
            let body = {
                signature,
                data: iface,
                hex_signature: '0x56819c80',
                daoAddress: address,
                target: ShopLp_contract_address[chainId],
                title,
                description,
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
            Toastify('error', error.message);
            setLoading(false)
        }
    }
    const instanceHandleSubmit = async () => {
        const { active, title, tokenAddress, rate, description } = values;
        if (!library) return;
        try {
            setiLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(active, tokenAddress, rate)
            const txHash = await contract.getTxHash(
                ShopLp_contract_address[chainId],
                iface,
                0,
                0,
                timestamp
            )
            const signature = await library.provider.request({
                method: "personal_sign",
                params: [txHash, account]
            })
            if (!owner) {
                Toastify('error', 'Request failed with status code 400');
                return;
            }
            if (!permitted) {
                Toastify('error', 'Request failed with status code 400');
                return;
            }
            const result = await contract.executePermitted(ShopLp_contract_address[chainId], iface, 0);
            Toastify('info', 'Instant Execution Started');
            await result.wait();
            Toastify('success', 'Instant Execution Success');
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: ShopLp_contract_address[chainId],
                title,
                description,
                chainId,
                value: 0,
                nonce: 0,
                createdAt: timestamp,
                timestamp: dayjs().unix(),
                txHash,
                creator: account
            }
            await axois.post('/create/voting', body);
            setiLoading(false);
            resetForm();
        } catch (error) {
            Toastify('error', error.message);
            setiLoading(false)
        }
    }
    const {
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        isValid,
        dirty,
        setFieldValue,
        setErrors,
        resetForm
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: {
            title: "",
            description: "",
            tokenAddress: "",
            rate: 0,
            active: true,
            tokenAddressType: 'hidden',
            tokenAddressValue: -1
        },
        validationSchema: formSchema
    });
    const createForIface = (_isActive, tokenAddress, rate) => {
        let ABI = ["function initPublicOffer(bool _isActive ,address _currency, uint256 rate)"];
        let iface = new ethers.utils.Interface(ABI);
        let value = Math.pow(10, decimals) * Number(rate);
        value = `0x${value.toString(16)}`
        iface = iface.encodeFunctionData("initPublicOffer", [_isActive, tokenAddress, value]);
        return iface
    }
    const getTokenSymbol = async (e) => {
        handleChange(e);
        if (!e.target.value) return
        try {
            let contract = await getCustomContract(e.target.value);
            let symbol = await contract.symbol();
            let decimals = await contract.decimals();
            if (symbol) {
                setDecimals(decimals);
                setSymbol(symbol);
                setFieldValue('title', `Initialize Public Offer (Status: ${values.active ? 'Active' : 'Disable'})`)
            } else {
                Toastify('error', 'There is no token on this address');
                setErrors({ tokenAddress: 'There is no token on this address' })
                setSymbol(null);
            }
        } catch (error) {
            Toastify('error', 'There is no token on this address');
            setErrors({ tokenAddress: 'There is no token on this address' });
            setSymbol(null);
        }

    }
    const getDaoMembers = async (address) => {
        try {
            const contract = await dao(address);
            const balanceOf = await contract.balanceOf(account);
            if (String(balanceOf) > 0) {
                setOwner(true);
            } else {
                setOwner(false);
            }
            const permitted = await contract.containsPermitted(account);
            setPermitted(permitted);
        } catch (error) {
        }
    }
    const getDaoAssets = async () => {
        const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?key=${covalent}`;
        try {
            const result = await axios.get(url);
            let items = result.data.data.items;
            items = items.filter((item) => item.contract_address !== exlcude_Address[chainId])
            setAssets(items);
        } catch (error) {
        }
    }
    const handleManualInputAddress = (item, index) => {
        if (item === 0) {
            setFieldValue('tokenAddress', '');
            setFieldValue('tokenAddressType', 'text');
            setFieldValue('tokenAddressValue', 0);
            handleClose();
            return;
        }
        setFieldValue('tokenAddressValue', index);
        setFieldValue('tokenAddressType', 'hidden');
        handleChange({ target: { name: 'tokenAddress', value: item.contract_address, id: 'tokenAddress', type: 'hidden' } })
        setDecimals(item.contract_decimals);
        setSymbol(item.contract_ticker_symbol);
        handleClose();
    }
    return (
        <>
            {
                active ? <>
                    <Container className='my-3'>
                        <Row>
                            <Col xs={12} lg={8} className="mx-auto text-white">
                                <h2>Edit or Disable Public Offer</h2>
                                <p>After creating a voting, You can activate it when the quarom is reached</p>
                                <Form onSubmit={handleSubmit}>
                                    <FormGroup className="mb-3" controlId="formBasicCheckbox">
                                        <FormCheck
                                            name="active"
                                            id="active"
                                            label="Active Offer"
                                            checked={values.active}
                                            onChange={(e) => {
                                                handleChange(e);
                                                setFieldValue('title', `Initialize Public Offer (Status: ${values.active ? 'Active' : 'Disable'})`)
                                            }}
                                            onBlur={handleBlur}
                                        />
                                        <span className='text-muted'>Active Offer</span>
                                    </FormGroup>
                                    <FormGroup className='mb-3'>
                                        <FormLabel>Currency to buy LP</FormLabel>
                                        <br />
                                        <button type="button" className='dao-btn w-100' onClick={handleShow}>
                                            {
                                                values.tokenAddressValue === -1 ? "Choose Token" :
                                                    values.tokenAddressValue === 0 ? "Manual Input Token Address" :
                                                        <Row>
                                                            <Col className='d-flex align-items-center'>
                                                                <div className='me-3'>
                                                                    <img
                                                                        src={assets[values.tokenAddressValue - 1].logo_url}
                                                                        alt={assets[values.tokenAddressValue - 1].contract_name}
                                                                        style={{ width: '30px', height: '30px' }}
                                                                        onError={(e) => { e.target.onerror = null; e.target.src = imageErrorSrc }}
                                                                    />
                                                                </div>
                                                                <div className='text-left'>
                                                                    <p className='m-0 p-0'>{assets[values.tokenAddressValue - 1].contract_name}</p>
                                                                    <p className='m-0 p-0'>{truncateAddress(assets[values.tokenAddressValue - 1].contract_address)}</p>
                                                                </div>
                                                            </Col>
                                                            <Col className='text-right'>
                                                                <p className='m-0 p-0'>{Number(assets[values.tokenAddressValue - 1].balance / Math.pow(10, assets[values.tokenAddressValue - 1].contract_decimals)).toFixed(6)}{' '}{assets[values.tokenAddressValue - 1].contract_ticker_symbol}</p>
                                                                <p className='m-0 p-0'>${Number(assets[values.tokenAddressValue - 1].balance / Math.pow(10, assets[values.tokenAddressValue - 1].contract_decimals)).toFixed(2)}</p>
                                                            </Col>
                                                        </Row>
                                            }

                                        </button>
                                        <br />
                                        <span className='text-muted'>Currency to buy LP</span>
                                    </FormGroup>
                                    {
                                        values.tokenAddressType !== 'hidden' && <FormGroup className='mb-3'>
                                            <FormLabel>Manual Input Token Address</FormLabel>
                                            <FormControl
                                                type={values.tokenAddressType}
                                                name="tokenAddress"
                                                placeholder="0x"
                                                onChange={(e) => {
                                                    getTokenSymbol(e);
                                                }}
                                                onBlur={handleBlur}
                                                value={values.tokenAddress || ""}
                                            />
                                            {
                                                (touched.tokenAddress && errors.tokenAddress) ?
                                                    <small className="text-danger">{touched.tokenAddress && errors.tokenAddress}</small> :
                                                    <small className="text-muted">
                                                        {`If you want to use ${networks[chainId].nativeCurrency.symbol}, use ${networks[chainId].wName} instead: ${networks[chainId].wCoin}`}
                                                    </small>
                                            }
                                        </FormGroup>
                                    }
                                    <FormGroup className='mb-3'>
                                        <FormLabel htmlFor='rate'>Rate</FormLabel>
                                        <FormControl
                                            id="rate"
                                            type="rate"
                                            name="rate"
                                            placeholder='0'
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.rate || ''}
                                        />
                                        {
                                            (touched.rate && errors.rate) ? <small className="text-danger">{touched.rate && errors.rate}</small> : <p className='text-muted p-0 mb-0'>1 LP = {symbol ? values.rate > 0 ? `${values.rate} ${symbol}` : `1 ${symbol}` : '1 Currency Token / Rate'}</p>
                                        }
                                    </FormGroup>
                                    <FormGroup className='mb-3' >
                                        <FormLabel htmlFor="title">Title</FormLabel>
                                        <FormControl
                                            id="title"
                                            type="text"
                                            name="title"
                                            placeholder='Title'
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.title || ""}
                                        />
                                        <small className="text-danger">{touched.title && errors.title}</small>
                                    </FormGroup>
                                    <FormGroup className='mb-3'>
                                        <FormLabel htmlFor="description">Description</FormLabel>
                                        <FormControl
                                            id="description"
                                            as="textarea"
                                            rows={5}
                                            name="description"
                                            placeholder='Description'
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.description || ""}

                                        />
                                        <small className="text-danger">{touched.description && errors.description}</small>
                                    </FormGroup>
                                    <FormGroup className='my-3'>
                                        <Row>
                                            <Col>
                                                <button
                                                    type="submit"
                                                    className='dao-btn w-100'
                                                    style={{ backgroundColor: '#8AB5FF', color: '#0D0D15', fontSize: '20px' }}
                                                    disabled={!(isValid && dirty) || loading || iloading}
                                                >
                                                    {
                                                        loading ? <Spinner animation="border" variant="primary" /> : <><HiSpeakerphone className='icon' />
                                                            Create Voting</>
                                                    }
                                                </button>
                                            </Col>
                                            {
                                                permitted && <Col>
                                                    <button
                                                        type="button"
                                                        className='dao-btn w-100'
                                                        style={{ backgroundColor: '#A2E6C2', color: '#0D0D15', fontSize: '20px' }}
                                                        onClick={instanceHandleSubmit}
                                                        disabled={!(isValid && dirty) || iloading}
                                                    >
                                                        {
                                                            iloading ? <Spinner animation="border" variant="dark" /> : <><BsLightningFill className='icon' />
                                                                Instance Exucute</>
                                                        }
                                                    </button>
                                                </Col>
                                            }
                                        </Row>
                                    </FormGroup>
                                </Form>
                            </Col>
                        </Row>
                    </Container>
                    <Modal show={show} onHide={handleClose} centered>
                        <Modal.Body className='py-3'>
                            <Row>
                                <Col xs={9}>
                                    <h5 className='px-3'>Choose Target Address</h5>
                                </Col>
                                <Col className="text-right">
                                    <span className='pointer' onClick={handleClose}>
                                        <ImCross />
                                    </span>
                                </Col>
                            </Row>
                            <div
                                style={{ fontSize: '14px' }}
                                className='py-2 px-3 pointer permitted-remove'
                                onClick={() => handleManualInputAddress(0, 0)}
                            >
                                Manual Input Token Address
                            </div>
                            {
                                assets.map((item, index) => (
                                    <div
                                        style={{ fontSize: '14px' }}
                                        className='py-2 px-3 pointer permitted-remove'
                                        key={index} onClick={() => handleManualInputAddress(item, index + 1)}>
                                        <Row>
                                            <Col className='d-flex align-items-center'>
                                                <div className='me-3'>
                                                    <img
                                                        src={item.logo_url}
                                                        alt={item.contract_name}
                                                        style={{ width: '30px', height: '30px' }}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = imageErrorSrc }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className='m-0 p-0'>{item.contract_name}</p>
                                                    <p className='m-0 p-0'>{truncateAddress(item.contract_address)}</p>
                                                </div>
                                            </Col>
                                            <Col className='text-right'>
                                                <p className='m-0 p-0'>{Number(item.balance / Math.pow(10, item.contract_decimals)).toFixed(6)}{' '}{item.contract_ticker_symbol}</p>
                                                <p className='m-0 p-0'>${Number(item.balance / Math.pow(10, item.contract_decimals)).toFixed(2)}</p>
                                            </Col>
                                        </Row>
                                    </div>
                                ))
                            }
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
const formSchema = yup.object().shape({
    title: yup.string().min(3, 'Too Short!').required("Title is required"),
    description: yup.string(),
    tokenAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
        if (value) {
            return ethers.utils.isAddress(value);
        } else {
            return true
        }
    }).required("This is required"),
    rate: yup.number().moreThan(0, 'Must be more then 0').required('This is required'),
    tokenAddressType: yup.string().default('hidden'),
    tokenAddressValue: yup.number().default(-1),
})
export default InitPublicOffer;
