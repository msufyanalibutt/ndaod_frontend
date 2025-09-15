import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, InputGroup, Spinner, Modal } from 'react-bootstrap';
import { HiLockOpen, HiSpeakerphone } from 'react-icons/hi';
import { ImCross } from 'react-icons/im';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import dayjs from 'dayjs';
import api from '../utils/api';
import { exlcude_Address, truncateAddress } from '../utils';
import ConnectWallet from '../components/sidebar/connectWallet';
import axois from '../utils/api';
import Toastify from '../components/toast';
import { WALLETCONTEXT } from '../contexts/walletContext';
import { BsLightningFill } from 'react-icons/bs';
import { networks } from '../utils/networks';
const imageErrorSrc = '/images/NoImageCoinLogo.svg';
const SendToken = () => {
    const [loading, setLoading] = useState(false)
    const [iloading, setiLoading] = useState(false)
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const [assets, setAssets] = useState([]);
    const [decimal, setDecimal] = useState(0);
    const [daoToken, setDaoToken] = useState('');
    const [symbol, setSymbol] = useState('');
    const [tokenBalance, setTokenBalance] = useState(0);
    const { chainId, account, active, library } = useWeb3React();
    const { dao, getCustomContract } = WALLETCONTEXT();
    const { address } = useParams();
    const navigate = useNavigate();
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [searchParams] = useSearchParams();
    useEffect(()=>{
        updateFormFields()
    },[]);
    const updateFormFields= ()=>{
        const params= searchParams;
        const TA = params.get('TA');
        if(TA){
            setFieldValue('recipientAddress',TA)
        }
    }
    useEffect(() => {
        if (account && active && chainId) {
            getDaoAssets(address);
            getDaoMembers(address);
        }
    }, [account, active, chainId])
    const handleFormSubmit = async ({ title, recipientAddress, amount, description }) => {
        if (!library) return;
        try {
            setLoading(true);
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(recipientAddress, amount)
            const txHash = await contract.getTxHash(
                daoToken,
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
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: daoToken,
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
        const { title, recipientAddress, amount, description } = values;
        if (!library) return;
        try {
            setiLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(recipientAddress, amount)
            const txHash = await contract.getTxHash(
                daoToken,
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
            const result = await contract.executePermitted(daoToken, iface, 0);
            Toastify('info', 'Instant Execution Started');
            await result.wait();
            Toastify('success', 'Instant Execution Success');
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: daoToken,
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
    const createForIface = (recipientAddress, amount) => {
        let ABI = ["function transfer(address recipientAddress, uint256 amount)"];
        let iface = new ethers.utils.Interface(ABI);
        let value = amount * Math.pow(10, decimal);
        value = `0x${value.toString(16)}`;
        iface = iface.encodeFunctionData("transfer", [recipientAddress, value]);
        return iface
    }
    const getDaoAssets = async () => {
        const url = `/${chainId}/address/${address}/balances_v2`;
        try {
            const result = await api.post('/covalent/api',{url});
            let items = result.data.data.items;
            items = items.filter((item) => item.contract_address !== exlcude_Address[chainId])
            setAssets(items);
        } catch (error) {
        }
    }
    const maxTokenTransfer = () => {
        setFieldValue('amount', tokenBalance);
        if (tokenBalance > 0 && values.recipientAddress) {
            setFieldValue('title', `Send ${tokenBalance} ${symbol} to ${values.recipientAddress}`)
        }
    }
    const formSchema = yup.object().shape({
        title: yup.string().required("Title is required"),
        description: yup.string(),
        // token: yup.string().required("This is required"),
        recipientAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
            if (value) {
                return ethers.utils.isAddress(value);
            } else {
                return true
            }
        }).required("This is required"),
        amount: yup.number().moreThan(0, 'must be more then 0')
            .test('maxLength', `You must have enough ${symbol} in addition to the amount to pay for gas`, function (value) {
                if (value === tokenBalance) {
                    return false
                } else {
                    return true;
                }
            })
            .test('maxLength', `Low balance. Current balance is ${tokenBalance} ${symbol}`, function (value) {
                return tokenBalance >= value;
            }).required('Token Amount is required')
    })
    const {
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        setFieldValue,
        setErrors,
        isValid,
        dirty,
        resetForm
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: {
            title: "",
            description: "",
            recipientAddress: "",
            amount: 0,
            tokenAddressType: 'hidden',
            tokenAddressValue: -1
        },
        validationSchema: formSchema
    });
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
    const getTokenSymbol = async (e) => {
        handleChange(e);
        if (!e.target.value) return
        try {
            let contract = await getCustomContract(e.target.value);
            let symbol = await contract.symbol();
            let decimals = await contract.decimals();
            let balanceOf = await contract.balanceOf(address);
            if (symbol) {
                setDecimal(decimals);
                setSymbol(symbol);
                setDaoToken(e.target.value);
                setTokenBalance(balanceOf / Math.pow(10, decimals));
                // setFieldValue('title', `Initialize Public Offer (Status: ${values.active ? 'Active' : 'Disable'})`)
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
        setDecimal(item.contract_decimals);
        setSymbol(item.contract_ticker_symbol);
        setDaoToken(item.contract_address);
        setTokenBalance(item.balance / Math.pow(10, item.contract_decimals));
        handleClose();
    }
    return (
        <>
            {
                active ? <Container className='my-3'>
                    <Row>
                        <Col xs={12} md={8} className="mx-auto text-white">
                            <h2>Send Token</h2>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup className='mt-3'>
                                    <p>Transfer Any Token from DAO's balance.</p>
                                    <hr />
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel>Token</FormLabel>
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
                                    <span className='text-muted'>Token</span>
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
                                {/* <FormGroup className='mb-3'>
                                    <FormLabel htmlFor='token'>Token</FormLabel>
                                    <FormControl
                                        id="token"
                                        name="token"
                                        type="text"
                                        as="select"
                                        onChange={getTokenBalance}
                                        onBlur={handleBlur}
                                        value={values.token || ''}
                                    >
                                        <option value="" disabled>Choose Token</option>
                                        {
                                            assets.map((item, index) => (
                                                <option key={index} value={index}>
                                                    {item.contract_name}{' '}
                                                    {item.contract_address}
                                                </option>
                                            ))
                                        }
                                    </FormControl>
                                    <small className="text-danger">{touched.token && errors.token}</small>
                                </FormGroup> */}
                                <FormGroup className='mb-3'>
                                    <FormLabel htmlFor="recipientAddress" >Recipient Address</FormLabel>
                                    <FormControl
                                        type="text"
                                        id="recipientAddress"
                                        name="recipientAddress"
                                        placeholder="Recipient Address"
                                        onChange={(e) => {
                                            handleChange(e);
                                            if (values.amount > 0 && e.target.value) {
                                                setFieldValue('title', `Send ${values.amount} ${symbol} to ${e.target.value}`)
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        value={values.recipientAddress || ""}
                                    />
                                    <small className="text-danger">{touched.recipientAddress && errors.recipientAddress}</small>
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel htmlFor='amount'>Token Amount</FormLabel>
                                    <InputGroup className='form-amount'>
                                        <FormControl
                                            id="amount"
                                            type="text"
                                            name="amount"
                                            placeholder='Amount'
                                            onChange={(e) => {
                                                handleChange(e);
                                                if (e.target.value > 0 && values.recipientAddress) {
                                                    setFieldValue('title', `Send ${e.target.value} ${symbol} to ${values.recipientAddress}`)
                                                }
                                            }}
                                            onBlur={handleBlur}
                                            value={values.amount}
                                        />
                                        <InputGroup.Text
                                            className='dao-btn'
                                            id="basic-addon1"
                                            onClick={maxTokenTransfer}
                                        >
                                            MAX
                                        </InputGroup.Text>
                                    </InputGroup>
                                    <small className="text-danger">{touched.amount && errors.amount}</small>
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
                </Container> : <>
                    <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                        <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                    </div>
                </>
            }
        </>
    )
}

export default SendToken;