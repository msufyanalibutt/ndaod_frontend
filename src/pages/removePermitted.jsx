import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Container, Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner, Modal } from 'react-bootstrap';
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
import { ImCross } from 'react-icons/im';

const RemovePermitted = () => {
    const [loading, setLoading] = useState(false)
    const [iloading, setiLoading] = useState(false)
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao } = WALLETCONTEXT();
    const { address } = useParams();
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [permittedList, setPermittedList] = useState([]);
    const location = useLocation();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        let target = query.get('targetAddress');
        if (target) {
            setFieldValue('targetAddress', target);
            setFieldValue('title', `Remove Permitted: ${target}`);
        }
    }, [])
    useEffect(() => {
        if (active && address && chainId) {
            getPermittedList()
            getDaoMembers(address)
        }
    }, [address, chainId, active])
    const handleFormSubmit = async ({ title, targetAddress, description }) => {
        if (!library) return;
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(targetAddress)
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
                hex_signature: String(iface).slice(0, 10),
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
            Toastify('error', error);
            setLoading(false)
        }
    }
    const instanceHandleSubmit = async () => {
        const { title, targetAddress, description } = values;
        if (!library) return;
        try {
            setiLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(targetAddress)
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
            getPermittedList();
            getDaoMembers(address);
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
        initialValues: { title: "", description: "", targetAddress: "" },
        validationSchema: formSchema
    });
    const createForIface = (p) => {
        let ABI = ["function removePermitted(address p)"];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("removePermitted", [p]);
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
    const getPermittedList = async () => {
        try {
            const contract = await dao(address);
            const permittedList = await contract.getPermitted();
            setPermittedList(permittedList)
        } catch (error) {
        }
    }
    const handlePermitted = (item) => {
        setFieldValue('targetAddress', item);
        setFieldValue('title', `Remove Permitted: ${item}`);
        handleClose();
    }
    return (
        <>
            {
                active ? <>  <Container className='my-3'>
                    <Row>
                        <Col xs={12} lg={8} className="mx-auto text-white">
                            <h2>Remove Permitted</h2>
                            <p>Remove Permitted from your DAO.</p>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup className='mt-3'>
                                    <hr />
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel>Target Address</FormLabel>
                                    <br />
                                    <button type="button" className='dao-btn' onClick={handleShow}>
                                        {
                                            values.targetAddress ? values.targetAddress : "Choose Target Address"
                                        }
                                    </button>
                                    <FormControl
                                        type="hidden"
                                        name="targetAddress"
                                        placeholder="0x"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.targetAddress || ""}
                                    />
                                    <small className="text-danger">{touched.targetAddress && errors.targetAddress}</small>
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
                    <Modal show={show} onHide={handleClose}>
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
                            {
                                permittedList.map((item, index) => (
                                    <div
                                        style={{ fontSize: '14px' }}
                                        className='py-2 px-3 pointer permitted-remove'
                                        key={index}
                                        onClick={() => handlePermitted(item)}>
                                        {item}
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
    targetAddress: yup.string().test('isAddres', 'Invalid address', function (value) {
        if (value) {
            return ethers.utils.isAddress(value);
        } else {
            return true
        }
    }).required("Target adddress is required"),
})
export default RemovePermitted;
