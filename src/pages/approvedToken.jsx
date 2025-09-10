import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner } from 'react-bootstrap';
import { HiLockOpen, HiSpeakerphone } from 'react-icons/hi';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import dayjs from 'dayjs';
import ConnectWallet from '../components/sidebar/connectWallet';
import axois from '../utils/api';
import Toastify from '../components/toast';
import { WALLETCONTEXT } from '../contexts/walletContext';
import { BsLightningFill } from 'react-icons/bs';

const ApprovedToken = () => {
    const [loading, setLoading] = useState(false)
    const [iloading, setiLoading] = useState(false)
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);

    // const [daoToken, setDaoToken] = useState('');
    const [symbol, setSymbol] = useState('');
    // const [tokenBalance, setTokenBalance] = useState(0);
    const { chainId, account, active, library } = useWeb3React();
    const { dao, getCustomContract } = WALLETCONTEXT();
    const { address } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        if (account && active && chainId) {
            // getDaoAssets(address);
            getDaoMembers(address);
        }
    }, [account, active, chainId]);
    useEffect(() => {
        if (library) {
            getParamsInfo();
        }
    }, [library]);
    const getParamsInfo = async () => {
        const query = new URLSearchParams(location.search);
        const spender = query.get('targetAddress');
        const token = query.get('tokenAddress');
        const amount = query.get('tokenAmount');
        setFieldValue('token', token || '');
        setFieldValue('spender', spender || '');
        setFieldValue('amount', amount || 0);
        if (!token) return
        try {
            const contract = await getCustomContract(token);
            const name = await contract.symbol();
            setFieldValue('title', `Approved ${name}`);
            setFieldValue('description', `Approve ${amount} ${name} to ${spender}`)
        } catch (error) {
            console.log(error)
        }
    }
    const handleFormSubmit = async ({ title, spender, amount, description, token }) => {
        if (!library) return;
        try {
            setLoading(true);
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(spender, amount)
            const txHash = await contract.getTxHash(
                token,
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
                hex_signature: '0x095ea7b3',
                daoAddress: address,
                target: token,
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
        const { title, spender, amount, description, token } = values;
        if (!library) return;
        try {
            setiLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(spender, amount)
            const txHash = await contract.getTxHash(
                token,
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
            const result = await contract.executePermitted(token, iface, 0);
            Toastify('info', 'Instant Execution Started');
            await result.wait();
            Toastify('success', 'Instant Execution Success');
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: token,
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
    const createForIface = (spender, amount) => {
        let ABI = ["function approve(address spender, uint256 amount)"];
        let iface = new ethers.utils.Interface(ABI);
        let value = Number(amount);
        value = `0x${value.toString(16)}`;
        iface = iface.encodeFunctionData("approve", [spender, value]);
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
            const permitted = await contract.containsPermitted(account);
            setPermitted(permitted);
        } catch (error) {
            console.log(error)
        }
    }
    const getTokenBalance = async (e) => {
        handleChange(e);
        if (!e.target.value) return
        try {
            const contract = await getCustomContract(e.target.value);
            const name = await contract.symbol();
            setSymbol(name)
        } catch (error) {
            Toastify('error', error.message)
        }
    }
    const formSchema = yup.object().shape({
        title: yup.string().required("Title is required"),
        description: yup.string(),
        token: yup.string().required("This is required"),
        spender: yup.string().test('isAddres', 'Invalid address', function (value) {
            if (value) {
                return ethers.utils.isAddress(value);
            } else {
                return true
            }
        }).required("This is required"),
        amount: yup.number().moreThan(0, 'must be more then 0').required('Token Amount is required')
    })
    const {
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        setFieldValue,
        isValid,
        dirty,
        resetForm
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: { title: "", description: "", spender: "", amount: 0, token: "" },
        validationSchema: formSchema
    });

    return (
        <>
            {
                active ? <Container className='my-3'>
                    <Row>
                        <Col xs={12} md={8} className="mx-auto text-white">
                            <h2>Approve Token</h2>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup className='mt-3'>
                                    <p>Approve any token to a spender. This is useful when you interact with DeFi protocols.</p>
                                    <hr />
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel htmlFor='token'>Token</FormLabel>
                                    <FormControl
                                        id="token"
                                        name="token"
                                        type="text"
                                        onChange={getTokenBalance}
                                        onBlur={handleBlur}
                                        value={values.token || ''}
                                    />
                                    {/* <option value="" disabled>Choose Token</option>
                                        {
                                            assets.map((item, index) => (
                                                item.type === 'cryptocurrency' && <option key={index} value={index}>
                                                    {item.contract_name}{' '}
                                                    {item.contract_address}
                                                </option>
                                            ))
                                        }
                                    </FormControl> */}
                                    <small className="text-danger">{touched.token && errors.token}</small>
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel htmlFor="spender" >Spender</FormLabel>
                                    <FormControl
                                        type="text"
                                        id="spender"
                                        name="spender"
                                        placeholder="Spender Address"
                                        onChange={(e) => {
                                            handleChange(e);
                                            if (values.amount > 0 && e.target.value) {
                                                setFieldValue('title', `Approve ${symbol}`)
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        value={values.spender || ""}
                                    />
                                    <small className="text-danger">{touched.spender && errors.spender}</small>
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel htmlFor='amount'>Token Amount</FormLabel>
                                    <FormControl
                                        id="amount"
                                        type="text"
                                        name="amount"
                                        placeholder='Amount'
                                        onChange={(e) => {
                                            handleChange(e);
                                            if (e.target.value > 0 && values.spender) {
                                                setFieldValue('title', `Approve ${symbol}`)
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        value={values.amount}
                                    />
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
                </Container> : <>
                    <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                        <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                    </div>
                </>
            }
        </>
    )
}

export default ApprovedToken;