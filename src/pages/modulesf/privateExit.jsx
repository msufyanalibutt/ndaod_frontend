import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner, FormCheck, FormText, Modal } from 'react-bootstrap';
import { HiLockOpen } from 'react-icons/hi';
import { ImCross } from 'react-icons/im';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { FiMinus } from 'react-icons/fi';
import { constants } from 'ethers';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import api from '../../utils/api';
import Toastify from '../../components/toast';
import ConnectWallet from '../../components/sidebar/connectWallet';
import { exlcude_Address, PrivateExitModule_contract_address, truncateAddress } from '../../utils';
import ClipBoard from '../../components/clipboard';
import BurnLP from '../../components/privateExit/burnLP';
const imageErrorSrc = '/images/NoImageCoinLogo.svg';

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
                PrivateExitModule_contract_address[chainId],
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
                target: PrivateExitModule_contract_address[chainId],
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
            await api.post('/create/voting', body);
            setLoading(false)
            navigate(`/dao/${address}/votingPage/${txHash}`);
        } catch (error) {
            Toastify('error', error);
            setLoading(false)
        }
    }
    const createForIface = (offerId) => {
        let ABI = [`function disablePrivateExitOffer(uint256)`];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("disablePrivateExitOffer", [offerId]);
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
const PrivateExit = () => {
    const [loading, setLoading] = useState(false);
    const [owner, setOwner] = useState(false);
    const [lp, setLP] = useState(false);
    const [assets, setAssets] = useState([]);
    const [privateOffers, setPrivateOffers] = useState([]);
    const [privateOffer, setPrivateOffer] = useState(null);
    const [spOffer, setspOffer] = useState(false);
    const [bpOffer, setBPOffer] = useState(false);
    // const [balanceOf, setBalanceOf] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);
    const [approved, setApproved] = useState(false);
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao, getCustomContract, getLpContract, getPrivateExitContract } = WALLETCONTEXT();
    const { address } = useParams();

    useEffect(() => {
        if (active && account && chainId) {
            getListOfPrivateOffers();
            getDaoMembers(address);
            getDaoAssets(address);
            getInfo();
        }
    }, [account, chainId, active]);
    useEffect(() => {
        if (assets && assets.length) {
            let ass = assets.map(item => {
                return {
                    checked: item.type === 'dust',
                    logo_url: item.logo_url,
                    type: item.type,
                    input: "check",
                    address: item.contract_address,
                    contract_name: item.contract_name,
                    contract_address: item.contract_address,
                    defaultValue: 0,
                    value: '',
                    balance: item.balance,
                    decimals: item.contract_decimals || 18
                }
            })
            setFieldValue('tokenAddresses', [...ass])
        }
    }, [assets]);
    const getInfo = async () => {
        try {
            setLoading(true);
            const daoContract = await dao(address);
            const lpAddress = await daoContract.lp();
            const contract = await getLpContract(lpAddress);
            let allowance = await contract.allowance(account, lpAddress);
            let totalSupply = await contract.totalSupply();
            setTotalSupply(ethers.utils.formatEther(totalSupply))
            allowance = String(allowance);
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
    const getListOfPrivateOffers = async () => {
        try {
            const contract = await getPrivateExitContract();
            let result = await contract.getOffers(address);
            result = result.map(item => ({
                ...item,
                isActive: item.isActive,
                recipient: item.recipient,
                lpAmount: ethers.utils.formatEther(item.lpAmount)
            }));
            setPrivateOffers(result)
        } catch (error) {
            Toastify('error', error);
        }
    }
    const handleFormSubmit = async ({ recipientAddress, lpAmount }) => {
        if (!library) return;
        try {
            let _ethIndex = values.tokenAddresses.findIndex((item) => item.contract_address === exlcude_Address[chainId])
            let _ethValue = values.tokenAddresses[_ethIndex].value || "0";
            _ethValue = ethers.utils.parseEther(_ethValue);
            let tokens = [];
            let amounts = [];
            values.tokenAddresses.filter((item, index) => {
                if (_ethIndex !== index) {
                    if (item.checked) {
                        if (Number(item.value) > 0) {
                            tokens.push(item.contract_address);
                            let value = Math.pow(10, item.decimals) * Number(item.value || 0);
                            value = `0x${value.toString(16)}`;
                            amounts.push(value);
                        }
                    }
                }
                return item
            });
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            const iface = createForIface(recipientAddress, ethers.utils.parseEther(lpAmount), _ethValue, tokens, amounts);
            const txHash = await contract.getTxHash(
                PrivateExitModule_contract_address[chainId],
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
                target: PrivateExitModule_contract_address[chainId],
                title: `Private Exit Offer for ${recipientAddress}`,
                description: '',
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
    const createForIface = (_recipient, _lpAmount, _ethAmount, _tokenAddresses, _tokenAmounts) => {
        let ABI = [`function createPrivateExitOffer(
            address _recipient,
            uint256 _lpAmount,
            uint256 _ethAmount,
            address[] memory _tokenAddresses,
            uint256[] memory _tokenAmounts
        )`];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("createPrivateExitOffer", [_recipient, _lpAmount, _ethAmount, _tokenAddresses, _tokenAmounts]);
        return iface
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
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: { title: "", description: "", recipientAddress: "", lpAmount: 0, tokenAddresses: [] },
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
            const lp = await contract.lp();
            setLP(ethers.constants.AddressZero !== lp);
        } catch (error) {
        }
    }
    const getDaoAssets = async (address) => {
        const url = `/${chainId}/address/${address}/balances_v2`;
        try {
            const result = await api.post('/covalent/api',url);
            let items = result.data.data.items;
            setAssets(items);
        } catch (error) {
        }
    }
    const getTokenSymbol = async (e, index) => {
        let contractaddress = e.target.value;
        let tokenAddresses = values.tokenAddresses;
        tokenAddresses[index].address = contractaddress
        setFieldValue('tokenAddresses', [...tokenAddresses]);
        if (!ethers.utils.isAddress(contractaddress)) return;
        try {
            // Toastify('info', 'Checking balance this address:start');
            let contract = await getCustomContract(contractaddress);
            let symbol = await contract.symbol();
            let balanceof = await contract.balanceOf(address);
            let decimals = await contract.decimals();
            if (symbol) {
                let item = {
                    checked: true,
                    logo_url: imageErrorSrc,
                    type: 'cryptocurrency',
                    input: "check",
                    address: contractaddress,
                    contract_name: contractaddress,
                    contract_symbol: symbol,
                    contract_address: contractaddress,
                    defaultValue: 0,
                    value: 0,
                    balance: balanceof,
                    decimals: decimals
                }
                tokenAddresses = values.tokenAddresses;
                tokenAddresses[index] = item;
                setFieldValue('tokenAddresses', [...tokenAddresses]);
                // Toastify('success', 'Checking balance this address:success');
            } else {
                Toastify('error', 'There is no token on this address');
            }
        } catch (error) {
            Toastify('error', 'There is no token on this address');
        }

    }
    const addTokenAddress = () => {
        let tokenAddresses = values.tokenAddresses;
        setFieldValue('tokenAddresses', [...tokenAddresses, {
            input: 'input',
            address: ''
        }])
    }
    const selectToken = (checked, index) => {
        let tokenAddresses = values.tokenAddresses;
        tokenAddresses[index].checked = checked;
        setFieldValue('tokenAddresses', [...tokenAddresses]);
    }
    const changeTotenValue = (value, index) => {
        let tokenAddresses = values.tokenAddresses;
        tokenAddresses[index].value = value;
        setFieldValue('tokenAddresses', [...tokenAddresses]);
    }
    const deleteTokenAddress = (index) => {
        let tokenAddresses = values.tokenAddresses;
        tokenAddresses.splice(index, 1);
        setFieldValue('tokenAddresses', [...tokenAddresses])
    }
    const addToken = async () => {
        try {
            let value = String(constants.MaxUint256);
            setLoading(true);
            const daoContract = await dao(address);
            const lpAddress = await daoContract.lp();
            const contract = await getLpContract(lpAddress);
            const result = await contract.approve(lpAddress, value);
            await result.wait();
            setLoading(false);
            getInfo();
        } catch (error) {
            Toastify('error', error.message)
            setLoading(false);
        }
    }
    const handleClosespOffer = () => setspOffer(false);
    const handleShowspOffer = () => setspOffer(true);
    const handleCloseBPOffer = () => {
        setPrivateOffer(null);
        setBPOffer(false);
        getListOfPrivateOffers();
    }
    const handleShowBPOffer = () => setBPOffer(true);
    const getPrivateOffer = (item, index) => {
        setPrivateOffer({ ...item, index });
        handleShowBPOffer();
    }

    return (
        <>
            {
                active ? <>
                    <Container>
                        <Row>
                            <Col xs={12} lg={8} className="mx-auto text-white my-3">
                                <h2>Private Exit Offers</h2>
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
                                            lp ? <button
                                                className='dao-btn w-100'
                                                onClick={handleShowspOffer}
                                            >Creat Private Exist Offer</button> :
                                                <NavLink to={`/createLp/${address}`} className='dao-btn w-100 d-block text-center'>Create LP</NavLink>
                                        }</> : ''
                                }
                            </Col>
                            <Col xs={12} lg={8} className="mx-auto text-white">
                                {
                                    privateOffers.map((item, index) => (
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
                                                            <button className='dao-btn p-0 m-0 px-2 py-1' onClick={() => getPrivateOffer(item, index)}>Burn LP</button>
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
                    <Modal show={spOffer} onHide={handleClosespOffer}>
                        <Modal.Body>
                            <Row>
                                <Col xs={12} className="mx-auto text-white">
                                    <Row>
                                        <Col>
                                            <h5>Create Private Exit Offer</h5>
                                        </Col>
                                        <Col className="text-right">
                                            <span className='pointer' onClick={handleClosespOffer}>
                                                <ImCross />
                                            </span>
                                        </Col>
                                    </Row>
                                    <Form onSubmit={handleSubmit}>
                                        <FormGroup className='mt-3'>
                                            <hr />
                                        </FormGroup>
                                        <FormGroup className='mb-3'>
                                            <FormLabel htmlFor="recipientAddress" >Recipient Address</FormLabel>
                                            <FormControl
                                                type="text"
                                                id="recipientAddress"
                                                name="recipientAddress"
                                                placeholder="Recipient Address"
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.recipientAddress || ""}
                                            />
                                            <small className="text-danger">{touched.recipientAddress && errors.recipientAddress}</small>
                                        </FormGroup>
                                        <FormGroup className='my-3'>
                                            <FormLabel htmlFor='lpAmount'>Lp Amount</FormLabel>
                                            <FormControl
                                                id="lpAmount"
                                                type="text"
                                                name="lpAmount"
                                                placeholder='0.0'
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.lpAmount || ''}
                                            />
                                            {
                                                (touched.lpAmount && errors.lpAmount) ?
                                                    <small className="text-danger">{errors.lpAmount}</small> :
                                                    values.lpAmount > 0 ? <span className='text-muted'>{`This is ${Number((values.lpAmount / totalSupply) * 100).toFixed(4)}% share of DAO funds.`}</span> : ''
                                            }

                                        </FormGroup>
                                        <FormGroup className='my-3'>
                                            {
                                                values.tokenAddresses.map((asset, index) => {
                                                    return (
                                                        asset.input === 'check' ? <FormGroup className='mb-3' key={index}>
                                                            <Row>
                                                                <Col className='d-flex align-items-center text-white'>
                                                                    <FormCheck
                                                                        className="me-2"
                                                                        name="checkbox"
                                                                        checked={asset.checked}
                                                                        onChange={(e) => selectToken(e.target.checked, index)}
                                                                        disabled={asset.type === 'dust' ? true : !values.lpAmount}
                                                                    />
                                                                    <img
                                                                        src={asset.logo_url}
                                                                        style={{ width: '30px', height: '30px' }}
                                                                        alt="avatar"
                                                                        onError={(e) => { e.target.onerror = null; e.target.src = imageErrorSrc }}
                                                                    />
                                                                    <span className='ms-2'>{ethers.utils.isAddress(asset.contract_name) ? truncateAddress(asset.contract_name) : asset.contract_name}</span>
                                                                </Col>
                                                                <Col className='text-left'>
                                                                    {/* {new Intl.NumberFormat('en-US', { maximumFractionDigits: 4, notation: "compact", compactDisplay: "short" }).format(asset.defaultValue)} */}
                                                                    <FormControl
                                                                        type="number"
                                                                        placeholder='Quantity'
                                                                        value={asset.value}
                                                                        onChange={(e) => changeTotenValue(e.target.value, index)}
                                                                    />
                                                                    <FormText>
                                                                        {new Intl.NumberFormat('en-US', { maximumFractionDigits: 4, notation: "compact", compactDisplay: "short" }).format(asset.balance / Math.pow(10, asset.decimals))}
                                                                    </FormText>
                                                                </Col>
                                                            </Row>
                                                        </FormGroup> : <FormGroup className="mb-3" key={index}>
                                                            <div className='d-flex' style={{ position: 'relative' }}>
                                                                <button
                                                                    type="button"
                                                                    className='dao-btn-danger px-2 py-1'
                                                                    style={{ fontSize: '20px', marginRight: '10px' }}
                                                                    onClick={() => deleteTokenAddress(index)}
                                                                ><FiMinus className='icons' /></button>
                                                                <FormControl
                                                                    id="address"
                                                                    name="address"
                                                                    placeholder='Token Address'
                                                                    onChange={(e) => getTokenSymbol(e, index)}
                                                                    onBlur={(e) => {
                                                                        handleBlur(e);
                                                                        // getTokenSymbol(e, index)
                                                                    }}
                                                                    value={asset.address || ''} />
                                                            </div>
                                                            {(errors.tokenAddresses && touched.address && errors.tokenAddresses[index]) && <small className="text-danger">{errors.tokenAddresses[index].address}</small>}
                                                        </FormGroup>)
                                                }
                                                )
                                            }
                                        </FormGroup>
                                        {
                                            approved && <FormGroup className="mb-3">
                                                <button
                                                    type='button'
                                                    className='dao-btn w-100'
                                                    onClick={addTokenAddress}>Add Token</button>
                                            </FormGroup>
                                        }
                                        <FormGroup className="mb-3">
                                            {
                                                approved ?
                                                    <button
                                                        type='submit'
                                                        className='dao-btn w-100' disabled={!(isValid && dirty) || loading}
                                                        style={{ backgroundColor: '#8AB5FF', color: '#0D0D15', fontSize: '20px' }} >
                                                        {
                                                            loading ? <Spinner animation="border" variant="primary" /> : 'Create Voting'
                                                        }
                                                    </button> :
                                                    <button type='button' onClick={addToken} className='dao-btn w-100' disabled={loading}>
                                                        {
                                                            loading ? <Spinner animation="border" variant="primary" /> : 'Approve'
                                                        }
                                                    </button>
                                            }
                                        </FormGroup>
                                    </Form>
                                </Col>
                            </Row>
                        </Modal.Body>
                    </Modal>
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
                            <BurnLP item={privateOffer} handleCloseBPOffer={handleCloseBPOffer} />
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
    recipientAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
        if (value) {
            return ethers.utils.isAddress(value);
        } else {
            return true
        }
    }).required("Recipient address is required"),
    lpAmount: yup.number().moreThan(0, 'Must be more then 0').required('This is required'),
    tokenAddresses: yup.array(
        yup.object().shape({
            address: yup.string().test('isAddres', 'Invalid address', function (value) {
                if (value) {
                    return ethers.utils.isAddress(value);
                } else {
                    return true
                }
            }).required("This is required")
        })
    )
})
export default PrivateExit;
