import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner, InputGroup } from 'react-bootstrap';
import { HiLockOpen, HiSpeakerphone } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../contexts/walletContext';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import axois from '../utils/api';
import Toastify from '../components/toast';
import ConnectWallet from '../components/sidebar/connectWallet';
import { BsLightningFill } from 'react-icons/bs';

const MoveGt = () => {
    const [loading, setLoading] = useState(false)
    const [iloading, setiLoading] = useState(false)
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const [addressAmount, setAddressAmount] = useState('')
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao } = WALLETCONTEXT();
    const { address } = useParams();
    useEffect(() => {
        if (active && address && chainId) {
            getDaoMembers(address)
        }
    }, [address, chainId, active])
    const handleFormSubmit = async ({ title, targetAddress, recipientAddress, amount, description }) => {
        if (!library) return;
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(targetAddress, recipientAddress, Number(amount))
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
                hex_signature: '0xbb35783b',
                daoAddress: address,
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
            navigate(`/dao/${address}/votingPage/${txHash}`);

        } catch (error) {
            Toastify('error', error.message);
            setLoading(false)
        }
    }
    const instanceHandleSubmit = async () => {
        const { title, targetAddress, recipientAddress, amount, description } = values;
        if (!library) return;
        try {
            setiLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(targetAddress, recipientAddress, Number(amount))
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
            if (!permitted) {
                Toastify('error', 'Request failed with status code 400');
                return;
            }
            const result = await contract.executePermitted(address, iface, 0);
            Toastify('info', 'Instant Execution Started');
            await result.wait();
            Toastify('success', 'Instant Execution Success');
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: address,
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
        setFieldValue,
        isValid,
        dirty,
        resetForm
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: { title: "", description: "", targetAddress: "", recipientAddress: "", amount: addressAmount },
        validationSchema: formSchema
    });
    const createForIface = (targetAddress, recipientAddress, amount) => {
        let ABI = ["function move(address,address,uint256)"];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("move", [targetAddress, recipientAddress, amount]);
        return iface
    }

    const maxTokenTransfer = async () => {
        // setFieldValue('amount', Number(addressAmount))
        handleChangeAmount({
            target: {
                value: addressAmount
            }
        })
    }
    const handleChangeAmount = async ({ target }) => {
        if (Number(target.value) > Number(addressAmount)) {
            return;
        }
        setFieldValue('amount', target.value);
        if (target.value) {
            setFieldValue('title', `Move ${target.value} GT`);
        }
        if (target.value > 0 && values.targetAddress && values.recipientAddress) {
            setFieldValue('description', `Move ${target.value} GT from ${values.targetAddress} To ${values.recipientAddress}`);
        }
    }
    const getBalanceOfAddress = async (addr) => {
        try {
            const contract = await dao(address);
            const balanceOf = await contract.balanceOf(addr);
            setAddressAmount(Number(String(balanceOf)).toFixed(1));
        } catch (error) {
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
    return (
        <>
            {
                active ? <>
                    <Container className='my-3'>
                        <Row>
                            <Col xs={12} md={8} className="mx-auto text-white">
                                <h2>Create Voting in Showtime DAO</h2>
                                <p>After creating a voting, You can activate it when the quarom is reached</p>
                                <Form onSubmit={handleSubmit}>
                                    <FormGroup>
                                        <FormControl
                                            type="text"
                                            defaultValue={"Move GT"}
                                            readOnly
                                        />
                                    </FormGroup>
                                    <FormGroup className='mt-5'>
                                        <p>Transfer voting power from one address to another.</p>
                                        <hr />
                                    </FormGroup>
                                    <FormGroup className='mb-3'>
                                        <FormLabel>Sender Address</FormLabel>
                                        <FormControl
                                            type="text"
                                            name="targetAddress"
                                            placeholder="Sender Address"
                                            onChange={(e) => {
                                                setFieldValue('targetAddress', e.target.value);
                                                if (ethers.utils.isAddress(e.target.value)) {
                                                    getBalanceOfAddress(e.target.value)
                                                }
                                                if ((e.target.value && values.recipientAddress) && values.amount > 0) {
                                                    setFieldValue('description', `Move ${values.amount} GT from ${e.target.value} To ${values.recipientAddress}`);
                                                }
                                            }}
                                            onBlur={handleBlur}
                                            value={values.targetAddress || ""}
                                        />
                                        <small className="text-danger">{touched.targetAddress && errors.targetAddress}</small>
                                    </FormGroup>
                                    <FormGroup className='mb-3'>
                                        <FormLabel>Recipient Address</FormLabel>
                                        <FormControl
                                            type="text"
                                            name="recipientAddress"
                                            placeholder="Recipient Address"
                                            onChange={(e) => {
                                                setFieldValue('recipientAddress', e.target.value);
                                                if ((e.target.value && values.targetAddress) && values.amount > 0) {
                                                    setFieldValue('description', `Move ${values.amount} GT from ${values.targetAddress} To ${e.target.value}`);
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
                                                type="number"
                                                name="amount"
                                                placeholder='Amount'
                                                onChange={handleChangeAmount}
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
                                            onChange={(e) => {
                                                setFieldValue('description', e.target.value)
                                            }}
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
const formSchema = yup.object().shape({
    title: yup.string().min(3, 'Too Short!').max(50, 'Too Long!').required("Title is required"),
    recipientAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
        if (value) {
            return ethers.utils.isAddress(value);
        } else {
            return true
        }
    }).required("Recipient address is required"),
    targetAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
        if (value) {
            return ethers.utils.isAddress(value);
        } else {
            return true
        }
    }).required("Sender address is required"),
    amount: yup.number().moreThan(0, 'Must be more then 0').required('Token Amount is required')
})
export default MoveGt;