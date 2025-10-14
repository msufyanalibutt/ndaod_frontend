import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner } from 'react-bootstrap';
import { HiLockOpen, HiSpeakerphone } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../contexts/walletContext';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import {  ShopTrading_contract_address } from '../utils'
import axois from '../utils/api';
import Toastify from '../components/toast';
import ConnectWallet from '../components/sidebar/connectWallet';
import { BsLightningFill } from 'react-icons/bs';

const CreateTa = () => {
    const [loading, setLoading] = useState(false);
    const [iloading, setiLoading] = useState(false);
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao } = WALLETCONTEXT();
    const { address } = useParams();
    const [name, setName] = useState('');
    useEffect(() => {
        if (account) {
            getDao();
        }
    }, [account]);
    useEffect(() => {
        if (active && address && chainId) {
            getDaoMembers(address)
        }
    }, [address, chainId, active])
    const getDao = async () => {
        try {
            const contract = await dao(address);
            const name = await contract.name();
            setName(name);
        } catch (error) {
        }
    }
    const handleFormSubmit = async ({ title, description, taName, taSymbol }) => {
        if (!library) return;
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(taName, taSymbol);
            const txHash = await contract.getTxHash(
                ShopTrading_contract_address[chainId],
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
                target: ShopTrading_contract_address[chainId],
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
            Toastify('error', error);
            setLoading(false)
        }
    }
    const instanceHandleSubmit = async () => {
        const { title, description, taName, taSymbol } = values;
        if (!library) return;
        try {
            setiLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(taName, taSymbol);
            const txHash = await contract.getTxHash(
                ShopTrading_contract_address[chainId],
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
            const result = await contract.executePermitted(ShopTrading_contract_address[chainId], iface, 0);
            Toastify('info', 'Instant Execution Started');
            await result.wait();
            Toastify('success', 'Instant Execution Success');
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: ShopTrading_contract_address[chainId],
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
            Toastify('error', error);
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
        resetForm
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: { title: "", description: "", taName: "", taSymbol: "" },
        validationSchema: formSchema
    });
    const createForIface = (_taName, _taSymbol) => {
        let ABI = ["function createTa(string memory _TAName, string memory _TASymbol)"];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("createTa", [_taName, _taSymbol]);
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
        }
    }
    return (
        <>
            {active ? <>
                <Container className='my-3'>
                    <Row>
                        <Col xs={12} md={8} className="mx-auto text-white">
                            <h2>Create Trading Account</h2>
                            <p><span className="text-muted">Dao Name: </span>{name.toUpperCase()}</p>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup className='mt-3'>
                                    <hr />
                                </FormGroup>
                                <FormGroup className='mb-3' >
                                    <FormLabel htmlFor="taName">Trading Account Name</FormLabel>
                                    <FormControl
                                        id="taName"
                                        type="text"
                                        name="taName"
                                        onChange={(e) => {
                                            handleChange(e);
                                            setFieldValue('taSymbol', e.target.value.toUpperCase());
                                            if (e.target.value.length > 0)
                                                setFieldValue('title', `Create Trading Account ${e.target.value} (${e.target.value.toUpperCase()})`)
                                        }}
                                        onBlur={handleBlur}
                                        value={values.taName || ""}
                                    />
                                    <small className="text-danger">{touched.taName && errors.taName}</small>
                                </FormGroup>
                                <FormGroup className='mb-3' >
                                    <FormLabel htmlFor="taSymbol">Trading Account Symbol</FormLabel>
                                    <FormControl
                                        id="taSymbol"
                                        type="text"
                                        name="taSymbol"
                                        placeholder='Title'
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.taSymbol || ""}
                                    />
                                    <small className="text-danger">{touched.taSymbol && errors.taSymbol}</small>
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
            </> :
                <>
                    <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                        <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                    </div>
                </>
            }
        </>
    )
}
const formSchema = yup.object().shape({
    taName: yup.string().min(3, 'Too Short!').required("Trading Account Name is required"),
    taSymbol: yup.string().min(3, 'Too Short!').required("Trading Account Symbol is required"),
    title: yup.string().min(3, 'Too Short!').required("Title is required"),
    description: yup.string()
})
export default CreateTa;
