import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner, Modal, InputGroup } from 'react-bootstrap';
import { HiLockOpen, HiSpeakerphone } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { exlcude_Address, PartialExitModule_contract_address, truncateAddress } from '../../utils';
import api from '../../utils/api';
import Toastify from '../../components/toast';
import ConnectWallet from '../../components/sidebar/connectWallet';
import { networks } from '../../utils/networks';
import { ImCross } from 'react-icons/im';
const imageErrorSrc = '/images/NoImageCoinLogo.svg';

const CreatePartialOffer = () => {
    const [loading, setLoading] = useState(false)
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const [recipientPermitted, setRecipientPermitted] = useState(false);
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao, getCustomContract, getLpContract, getPartialExitContract } = WALLETCONTEXT();
    const { address } = useParams();
    const [symbol, setSymbol] = useState(null);
    const [balanceOfLP, setBalanceOfLP] = useState(0);
    const [balanceOfCurrency, setBalanceOfCurrency] = useState(0);
    const [decimals, setDecimals] = useState(0);
    const [assets, setAssets] = useState([]);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    useEffect(() => {
        if (active && address && chainId) {
            getDaoAssets();
            getDaoMembers(address);
        }
    }, [address, chainId, active])
    const handleFormSubmit = async ({ title, description, recipientAddress, tokenAddress, lpAmount, currencyAmount }) => {
        if (!library) return;
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let token = tokenAddress === exlcude_Address[chainId] ? ethers.constants.AddressZero : tokenAddress;
            let iface = createForIface(recipientAddress, lpAmount, token, currencyAmount);
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
            if (!owner) {
                Toastify('error', 'Request failed with status code 400');
                return;
            }
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: PartialExitModule_contract_address[chainId],
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
            await api.post('/create/voting', body);
            setLoading(false)
            navigate(`/dao/${address}/votingPage/${txHash}`);
        } catch (error) {
            Toastify('error', error);
            setLoading(false)
        }
    }
    const formSchema = yup.object().shape({
        title: yup.string().min(3, 'Too Short!').required("Title is required"),
        description: yup.string(),
        recipientAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
            if (value) {
                return ethers.utils.isAddress(value);
            } else {
                return true
            }
        }).test('isAddres', 'Already Claim For Partial Exit Offer', function () {
            return !recipientPermitted
        }).required("This is required"),
        tokenAddressType: yup.string().default('hidden'),
        tokenAddressValue: yup.number().default(-1),
        tokenAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
            if (value) {
                return ethers.utils.isAddress(value);
            } else {
                return true
            }
        }).required("This is required"),
        lpAmount: yup.number().moreThan(0, 'Must be more then 0')
            .test('maxLenght', `Total supply is ${balanceOfLP} LP. Can't be greater than total supply`, function (value) {
                return value <= balanceOfLP;
            }).required('This is required'),
        currencyAmount: yup.number().moreThan(0, 'must be more then 0')
            .test('maxLength', `You must have enough ${symbol} in addition to the amount to pay for gas`, function (value) {
                if (value === balanceOfCurrency) {
                    return false
                } else {
                    return true;
                }
            })
            .test('maxLength', `Low balance. Current balance is ${balanceOfCurrency} ${symbol}`, function (value) {
                return balanceOfCurrency >= value;
            }).required('This is required')
    })
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
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: {
            title: "",
            description: "",
            recipientAddress: "",
            tokenAddress: "",
            lpAmount: 0,
            currencyAmount: 0,
            tokenAddressType: 'hidden',
            tokenAddressValue: -1
        },
        validationSchema: formSchema
    });
    const createForIface = (_recipient, _lpAmount, _tokenAddress, _tokenAmount) => {
        let ABI = [`function createPartialExitOffer(
            address _recipient,
            uint256 _lpAmount,
            address _tokenAddress,
            uint256 _tokenAmount
        )`];
        let iface = new ethers.utils.Interface(ABI);
        let lpAmount = _lpAmount * Math.pow(10, 18);
        lpAmount = `0x${lpAmount.toString(16)}`;
        let tokenAmount = _tokenAmount * Math.pow(10, decimals);
        tokenAmount = `0x${tokenAmount.toString(16)}`;
        iface = iface.encodeFunctionData("createPartialExitOffer", [_recipient, lpAmount, _tokenAddress, tokenAmount]);
        return iface
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
            const permitted = await contract.containsPermitted(PartialExitModule_contract_address[chainId]);
            setPermitted(permitted)
        } catch (error) {
        }
    }
    const getDaoAssets = async () => {
       const url = `/wallets/${address}/tokens?chain=matic`;
        try {
            const result = await api.get('/moralis/api',{url});
            let items = result.data.result;
            setAssets(items);
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
                setDecimals(decimals);
                setSymbol(symbol);
                setBalanceOfCurrency(String(balanceOf) / Math.pow(10, decimals));
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
        handleChange({ target: { name: 'tokenAddress', value: item.token_address, id: 'tokenAddress', type: 'hidden' } })
        setDecimals(item.decimals);
        setSymbol(item.symbol);
        setBalanceOfCurrency(item.balance / Math.pow(10, item.decimals));
        handleClose();
    }
    const maxLPTokenTransfer = () => {
        setFieldValue('lpAmount', Number(balanceOfLP));
    }
    const maxCurrencyTokenTransfer = () => {
        setFieldValue('currencyAmount', Number(balanceOfCurrency));
    }
    const getRecipeintLpAmount = async (e) => {
        handleChange(e);
        setFieldValue('title', `Create Partial Exit Offer for ${truncateAddress(e.target.value)}`)

        if (!e.target.value) return;
        try {
            const pContract = await getPartialExitContract();
            const permitted = await pContract.containsPermitted(e.target.value);
            setRecipientPermitted(permitted);
            const daoContract = await dao(address);
            const lpAddress = await daoContract.lp();
            const contract = await getLpContract(lpAddress);
            const balanceOf = await contract.balanceOf(e.target.value);
            const decimals = await contract.decimals();
            setBalanceOfLP(String(balanceOf) / Math.pow(10, decimals));
        } catch (error) {
        }
    }
    const InstallPermittedDao = async () => {
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForPartialIface(PartialExitModule_contract_address[chainId])
            const txHash = await contract.getTxHash(
                address,
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
                target: address,
                title: `Add Permitted: ${PartialExitModule_contract_address[chainId]}`,
                description: "",
                chainId,
                value: 0,
                nonce: 0,
                createdAt: timestamp,
                timestamp: 0,
                txHash,
                creator: account
            }
            await api.post('/create/voting', body);
            setLoading(false)
            navigate(`/dao/${address}/votingPage/${txHash}`);

        } catch (error) {
            Toastify('error', error);
            setLoading(false)
        }
    }
    const createForPartialIface = (p) => {
        let ABI = ["function addPermitted(address p)"];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("addPermitted", [p]);
        return iface
    }
    return (
        <>
            {
                active ? <>
                    <Container className='my-3'>
                        <Row>
                            <Col xs={12} lg={8} className="mx-auto text-white">
                                <h2>Create Partial Exit Offer</h2>
                                {/* <p>Privately sell your LP to a specific recipient for a specific price. This offer is single-use. Offer configuration can't be changed later, however you can disable it.</p> */}
                                <Form onSubmit={handleSubmit}>
                                    <FormGroup className='mb-3'>
                                        <FormLabel>Recipient</FormLabel>
                                        <FormControl
                                            type="text"
                                            name="recipientAddress"
                                            placeholder="0x"
                                            onChange={getRecipeintLpAmount}
                                            onBlur={handleBlur}
                                            value={values.recipientAddress || ""}
                                        />
                                        <small className="text-danger">{touched.recipientAddress && errors.recipientAddress}</small>
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
                                                                        src={assets[values.tokenAddressValue - 1].logo}
                                                                        alt={assets[values.tokenAddressValue - 1].name}
                                                                        style={{ width: '30px', height: '30px' }}
                                                                        onError={(e) => { e.target.onerror = null; e.target.src = imageErrorSrc }}
                                                                    />
                                                                </div>
                                                                <div className='text-left'>
                                                                    <p className='m-0 p-0'>{assets[values.tokenAddressValue - 1].name}</p>
                                                                    <p className='m-0 p-0'>{truncateAddress(assets[values.tokenAddressValue - 1].token_address)}</p>
                                                                </div>
                                                            </Col>
                                                            <Col className='text-right'>
                                                                <p className='m-0 p-0'>{Number(assets[values.tokenAddressValue - 1].balance / Math.pow(10, assets[values.tokenAddressValue - 1].decimals)).toFixed(2)}{' '}{assets[values.tokenAddressValue - 1].symbol}</p>
                                                                <p className='m-0 p-0'>${Number(assets[values.tokenAddressValue - 1].balance / Math.pow(10, assets[values.tokenAddressValue - 1].decimals)).toFixed(2)}</p>
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
                                        <FormLabel htmlFor='currencyAmount'>Currency Amount</FormLabel>
                                        <InputGroup className='form-amount'>
                                            <FormControl
                                                id="currencyAmount"
                                                type="text"
                                                name="currencyAmount"
                                                placeholder='0.0'
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.currencyAmount || ''}
                                            />
                                            <InputGroup.Text
                                                className='dao-btn'
                                                id="basic-addon1"
                                                style={{ cursor: 'pointer' }}
                                                onClick={maxCurrencyTokenTransfer}
                                            >
                                                MAX
                                            </InputGroup.Text>
                                        </InputGroup>
                                        {
                                            (touched.currencyAmount && errors.currencyAmount) ?
                                                <small className="text-danger">{errors.currencyAmount}</small> :
                                                symbol && <small className='text-muted'>{symbol}</small>
                                        }
                                    </FormGroup>
                                    <FormGroup className='mb-3'>
                                        <FormLabel htmlFor='lpAmount'>LP Amount</FormLabel>
                                        <InputGroup className='form-amount'>
                                            <FormControl
                                                id="lpAmount"
                                                type="text"
                                                name="lpAmount"
                                                placeholder='0.0'
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.lpAmount || ''}
                                            />
                                            <InputGroup.Text
                                                className='dao-btn'
                                                id="basic-addon1"
                                                style={{ cursor: 'pointer' }}
                                                onClick={maxLPTokenTransfer}
                                            >
                                                MAX
                                            </InputGroup.Text>
                                        </InputGroup>
                                        <small className="text-danger">{touched.lpAmount && errors.lpAmount}</small>
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
                                                {
                                                    permitted ? <button
                                                        type="submit"
                                                        className='dao-btn w-100'
                                                        style={{ backgroundColor: '#8AB5FF', color: '#0D0D15', fontSize: '20px' }}
                                                        disabled={!(isValid && dirty) || loading}
                                                    >
                                                        {
                                                            loading ? <Spinner animation="border" variant="primary" /> : <><HiSpeakerphone className='icon' />
                                                                Create Voting</>
                                                        }
                                                    </button> : <button
                                                        type="button"
                                                        className='dao-btn w-100'
                                                        style={{ backgroundColor: '#8AB5FF', color: '#0D0D15', fontSize: '20px' }}
                                                        disabled={loading}
                                                        onClick={InstallPermittedDao}
                                                    >
                                                        {
                                                            loading ? <Spinner animation="border" variant="primary" /> : <><HiSpeakerphone className='icon' />
                                                                Approve</>
                                                        }
                                                    </button>
                                                }
                                            </Col>
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
                                                        src={item.logo}
                                                        alt={item.name}
                                                        style={{ width: '30px', height: '30px' }}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = imageErrorSrc }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className='m-0 p-0'>{item.name}</p>
                                                    <p className='m-0 p-0'>{truncateAddress(item.token_address)}</p>
                                                </div>
                                            </Col>
                                            <Col className='text-right'>
                                                <p className='m-0 p-0'>{Number(item.balance / Math.pow(10, item.decimals)).toFixed(2)}{' '}{item.symbol}</p>
                                                <p className='m-0 p-0'>${Number(item.balance / Math.pow(10, item.decimals)).toFixed(2)}</p>
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

export default CreatePartialOffer;
