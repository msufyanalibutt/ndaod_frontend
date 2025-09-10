import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner, InputGroup } from 'react-bootstrap';
import { HiLockOpen, HiSpeakerphone } from 'react-icons/hi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../contexts/walletContext';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import axois from '../utils/api';
import Toastify from '../components/toast';
import ConnectWallet from '../components/sidebar/connectWallet';
import { networks } from '../utils/networks';
import { BsLightningFill } from 'react-icons/bs';

const SendMatic = () => {
    const [loading, setLoading] = useState(false)
    const [iloading, setiLoading] = useState(false)
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const [daoBalance, setDaoBalance] = useState(0);
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao } = WALLETCONTEXT();
    const { address,DAddress } = useParams();
    useEffect(() => {
        updateFormFields()
    }, []);
    const updateFormFields = () => {
        if (DAddress) {
            setFieldValue('recipientAddress', DAddress)
        }
    }
    useEffect(() => {
        if (active && address && chainId) {
            getDaoMembers(address);
            getDaoBalance();
        }
    }, [address, chainId, active]);
    const getDaoBalance = async () => {
        try {
            let result = await library.getBalance(address);
            result = String(result);
            result = result / Math.pow(10, 18);
            setDaoBalance(result);
        } catch (error) {
        }
    }
    const handleFormSubmit = async ({ title, recipientAddress, amount, description }) => {
        if (!library) return;
        try {
            setLoading(true);
            const contract = await dao(recipientAddress);
            let timestamp = dayjs().unix();
            let iface = createForIface(recipientAddress, '0x', amount);
            console.log(iface)
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
            if (!owner) {
                Toastify('error', 'Request failed with status code 400');
                return;
            }
            let body = {
                signature,
                data: iface,
                hex_signature: '',
                daoAddress: recipientAddress,
                target: address,
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
            navigate(`/dao/${recipientAddress}/votingPage/${txHash}`);
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
            let { iface, value } = createForIface(amount);
            const txHash = await contract.getTxHash(
                recipientAddress,
                iface,
                value,
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
            const result = await contract.executePermitted(recipientAddress, iface, value);
            Toastify('info', 'Instant Execution Started');
            await result.wait();
            Toastify('success', 'Instant Execution Success');
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: recipientAddress,
                title,
                description,
                chainId,
                value: ethers.utils.formatEther(value),
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
    const getDaoMembers = async (address) => {
        try {
            const contract = await dao(DAddress);
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
    const maxTokenTransfer = (e) => {
        handleChange({ target: { name: 'amount', value: daoBalance, type: 'text', id: 'amount' } });
        setFieldValue('title', `Send ${daoBalance} MATIC To ${values.recipientAddress}`);
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
        }).required("Target adddress is required"),
        amount: yup.number().moreThan(0, 'Must be more then 0')
            .test('maxLength', `You must have enough ${chainId && networks[chainId].nativeCurrency.symbol} in addition to the amount to pay for gas`, function (value) {
                if (value === daoBalance) {
                    return false
                } else {
                    return true;
                }
            }).test('maxLength', `Low balance. Current balance is ${Number(daoBalance).toFixed(4)} MATIC`, function (value) {
                return value <= daoBalance;
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
        resetForm
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: { title: "", description: "", recipientAddress: "", amount: 0 },
        validationSchema: formSchema
    });
    const createForIface = (target, data, amount) => {
        let ABI = ["function widthDraw(address _target,bytes calldata _data,uint256 _value)"];
        let iface = new ethers.utils.Interface(ABI);
        let value = ethers.utils.parseEther(amount);
        iface = iface.encodeFunctionData("widthDraw", [target, data, value]);
        return iface
    }
    return (
        <>
            {
                active ? <>  <Container className='my-3'>
                    <Row>
                        <Col xs={12} md={8} className="mx-auto text-white">
                            <h2>Send {networks[chainId].nativeCurrency.symbol}</h2>
                            <p>Send Matic from trading Account to Dao.</p>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup className='mt-3'>
                                    <hr />
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel>Recipient Address</FormLabel>
                                    <FormControl
                                        type="text"
                                        name="recipientAddress"
                                        placeholder="Recipient Address"
                                        onChange={(e) => {
                                            handleChange(e);
                                            if (e.target.value && values.amount > 0) {
                                                setFieldValue('title', `Send ${values.amount} ${networks[chainId].nativeCurrency.symbol} To ${e.target.value}`);
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        value={values.recipientAddress || ""}
                                    />
                                    <small className="text-danger">{touched.recipientAddress && errors.recipientAddress}</small>
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel htmlFor='amount'>{networks[chainId].nativeCurrency.symbol} Amount</FormLabel>
                                    <InputGroup className='form-amount'>
                                        <FormControl
                                            id="amount"
                                            type="text"
                                            name="amount"
                                            placeholder='Amount'
                                            onChange={(e) => {
                                                handleChange(e);
                                                if (e.target.value > 0 && values.recipientAddress) {
                                                    setFieldValue('title', `Send ${e.target.value} MATIC To ${values.recipientAddress}`);
                                                }
                                            }}
                                            onBlur={handleBlur}
                                            value={values.amount || ''}
                                        />
                                        <InputGroup.Text
                                            className='dao-btn'
                                            id="basic-addon1"
                                            style={{ cursor: 'pointer' }}
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
                </Container>
                </> : <>
                    <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                        <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                    </div>
                </>
            }
        </>
    )
}

export default SendMatic;
