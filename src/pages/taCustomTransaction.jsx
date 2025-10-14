import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner } from 'react-bootstrap';
import { HiLockOpen, HiSpeakerphone } from 'react-icons/hi';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../contexts/walletContext';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import axois from '../utils/api';
import Toastify from '../components/toast';
import ConnectWallet from '../components/sidebar/connectWallet';
import { BsLightningFill } from 'react-icons/bs';

const TACustomTransaction = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao, getShopTAccountContract } = WALLETCONTEXT();
    const { address } = useParams();
    const location = useLocation();
    useEffect(() => {
        if (active && address && chainId) {
        }
    }, [address, chainId, active])
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const targetAddress = query.get('targetAddress');
        const data = query.get('data');
        const value = ethers.utils.formatEther(query.get('value') || "0");
        const title = query.get('title');
        const description = query.get('desc');
        setFieldValue('targetAddress', targetAddress);
        setFieldValue('data', data);
        setFieldValue('value', value);
        setFieldValue('title', title ? title : '');
        setFieldValue('description', description);
    }, [])
    const handleFormSubmit = async ({ data, value, targetAddress }) => {
        if (!library) return;
        try {
            setLoading(true)
            const contract = await getShopTAccountContract(address);
            // let timestamp = dayjs().unix();
            let v = ethers.utils.parseEther(value);
            // let body = {
            //     signature,
            //     data,
            //     hex_signature: String(data).slice(0, 10),
            //     daoAddress: address,
            //     target: targetAddress,
            //     title,
            //     description,
            //     chainId,
            //     value,
            //     nonce: 0,
            //     createdAt: timestamp,
            //     timestamp: 0,
            //     txHash,
            //     creator: account
            // } 
            // await axois.post('/create/voting', body);
            Toastify('info', 'Execution Started');
            const result = await contract.executePermitted(targetAddress, data, v)
            await result.wait();
            Toastify('success', 'Execution Success');
            setLoading(false);
            navigate(`/connectTa/${targetAddress}`);
        } catch (error) {
            Toastify('error', error);
            setLoading(false)
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
        initialValues: { title: "", description: "", targetAddress: "", data: "", value: 0 },
        validationSchema: formSchema
    });
    return (
        <>
            {
                active ? <>  <Container className='my-3'>
                    <Row>
                        <Col xs={12} md={8} className="mx-auto text-white">
                            <h2>Custom Transaction</h2>
                            <p>After creating a voting, You can activate it when the quarom is reached</p>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup className='mt-5'>
                                    <hr />
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel>Target Address</FormLabel>
                                    <FormControl
                                        type="text"
                                        name="targetAddress"
                                        placeholder="Target Address"
                                        onChange={(e) => {
                                            handleChange(e);
                                            if (e.target.value) {
                                                setFieldValue('title', `Custom Tx: ${e.target.value}`);
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        value={values.targetAddress || ""}
                                    />
                                    <small className="text-danger">{touched.targetAddress && errors.targetAddress}</small>
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel htmlFor='data'>Data</FormLabel>
                                    <FormControl
                                        id="data"
                                        type="text"
                                        name="data"
                                        placeholder='0x'
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.data || ''}
                                    />
                                    <small className="text-danger">{touched.data && errors.data}</small>
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel htmlFor='value'>Value</FormLabel>
                                    <FormControl
                                        id="value"
                                        type="text"
                                        name="value"
                                        placeholder='0'
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.value || ''}
                                    />
                                    <small className="text-danger">{touched.value && errors.value}</small>
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
                                                disabled={!(isValid && dirty) || loading}
                                            >
                                                {
                                                    loading ? <Spinner animation="border" variant="primary" /> : <><HiSpeakerphone className='icon' />
                                                        Execute</>
                                                }
                                            </button>
                                        </Col>
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
    title: yup.string().min(3, 'Too Short!').required("Title is required"),
    description: yup.string(),
    targetAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
        if (value) {
            return ethers.utils.isAddress(value);
        } else {
            return true
        }
    }).required("Target adddress is required"),
    data: yup.string().matches(/^\(?[0][x]([a-zA-Z0-9]{1,})$/, 'Invalid data, e.g 0x432qe0dassava').required("This is required"),
    value: yup.number().required('This required')
})
export default TACustomTransaction;
