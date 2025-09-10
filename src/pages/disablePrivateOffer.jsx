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
import axois from '../utils/api';
import Toastify from '../components/toast';
import ConnectWallet from '../components/sidebar/connectWallet';
import { ShopLp_contract_address, truncateAddress } from '../utils';
import { BsLightningFill } from 'react-icons/bs';

const DisablePrivateOffer = () => {
    const [loading, setLoading] = useState(false);
    const [iloading, setiLoading] = useState(false);
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const [privateOffers, setPrivateOffers] = useState([]);
    const navigate = useNavigate();
    const { library, account, chainId, active } = useWeb3React();
    const { dao, getShopLPContract } = WALLETCONTEXT();
    const { address } = useParams();

    useEffect(() => {
        if (active && address && chainId) {
            getDaoMembers(address);
            getPrivateOffers(address);
        }
    }, [address, chainId, active])
    const handleFormSubmit = async ({ title, targetAddress, description }) => {
        if (!library) return;
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(Number(targetAddress));
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
                hex_signature: '0xbfd98dc1',
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
        const { title, targetAddress, description } = values;
        if (!library) return;
        try {
            setiLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(Number(targetAddress));
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
        resetForm
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: { title: "", description: "", targetAddress: "" },
        validationSchema: formSchema
    });
    const createForIface = (id) => {
        let ABI = ["function disablePrivateOffer(uint256 _id)"];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("disablePrivateOffer", [id]);
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
    const getPrivateOffers = async () => {
        try {
            const contract = await getShopLPContract();
            const nooffers = await contract.numberOfPrivateOffers(address);
            let offers = [];
            for (let i = 0; i < String(nooffers); i++) {
                let offer = await contract.privateOffers(address, i);
                offers.push({
                    address: offer.recipient,
                    id: i,
                    isActive: offer.isActive
                });
            }
            setPrivateOffers(offers)
        } catch (error) {
            Toastify('error', error.message);
        }
    }
    return (
        <>
            {
                active ? <>  <Container className='my-3'>
                    <Row>
                        <Col xs={12} md={8} className="mx-auto text-white">
                            <h2>Disable Private Offer</h2>
                            <p>After creating a voting, You can activate it when the quarom is reached</p>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup className='mt-5'>
                                    <hr />
                                </FormGroup>
                                <FormGroup className='mb-3'>
                                    <FormLabel>Target Address</FormLabel>
                                    <FormControl
                                        type="text"
                                        as="select"
                                        name="targetAddress"
                                        placeholder="Target Address"
                                        onChange={(e) => {
                                            handleChange(e);
                                            let value = e.target.value
                                            if (value) {
                                                setFieldValue('title', `Disable private offer for Id: ${Number(value) + 1} ${truncateAddress(privateOffers[Number(value)].address)}`);
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        value={values.targetAddress || ""}
                                    >
                                        <option value="" disabled>Choose Target Address</option>
                                        {
                                            privateOffers.map((item, index) => (
                                                item.isActive && <option key={index} value={index}>{item.id + 1} {item.address}</option>
                                            ))
                                        }
                                    </FormControl>
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
    targetAddress: yup.string().required('This is required!'),
})
export default DisablePrivateOffer;
