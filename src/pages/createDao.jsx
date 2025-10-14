import React, { useState, useEffect } from 'react';
import { Col, Container, Form, FormControl, FormGroup, Row, Spinner } from 'react-bootstrap';
import ConnectWallet from '../components/sidebar/connectWallet';
import { HiLockOpen } from 'react-icons/hi';
import { TiUserAdd, TiUserDelete, TiArrowSortedDown, TiArrowSortedUp } from 'react-icons/ti';
import { useNavigate } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { WALLETCONTEXT } from '../contexts/walletContext';
import Toastify from '../components/toast';
import { ethers } from 'ethers';

const CreateDao = () => {
    const {
        active,
        account
    } = useWeb3React();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (account) {
            setFieldValue('partners', [{
                address: account,
                amount: 1,
                share: 100
            }])
        }
    }, [account]);
    const { createYourDao, daoList } = WALLETCONTEXT();
    const navigate = useNavigate();
    const handleFormSubmit = async (values) => {
        try {
            setLoading(true)
            let part = [];
            let share = [];
            values.partners.map((partner) => {
                part.push(partner.address);
                share.push(partner.amount);
                return partner
            })

            let contract = await createYourDao();
            let result = await contract.create(values.daoName, values.daoSymbol, values.quarom, part, share);
            Toastify('info', 'Creating Dao!')
            await result.wait();
            Toastify('success', 'Dao Created!')
            result = await daoList(account);
            result = result[result.length - 1];
            setLoading(false);
            navigate(`/dao/${result.dao}`);
        } catch (error) {
            Toastify('error', error);
            setLoading(false);
        }
    }
    const {
        errors,
        touched,
        values,
        handleBlur,
        handleChange,
        handleSubmit,
        setFieldValue,
        isValid,
        dirty
    } = useFormik({
        validateOnChange: true,
        onSubmit: handleFormSubmit,
        initialValues: {
            daoName: "", daoSymbol: "", quarom: 51, partners: []
        },
        validationSchema: formSchema
    });
    const increaseQuarom = () => {
        let value = values.quarom;
        if (values.quarom < 100) {
            setFieldValue("quarom", Number(value) + 1)
        }
    }
    const decreaseQuarom = () => {
        let value = values.quarom;
        if (values.quarom > 1) {
            setFieldValue("quarom", Number(value) - 1)
        }
    }
    const addPartner = () => {
        let partners = values.partners;
        setFieldValue('partners', [...partners, {
            address: '',
            amount: '',
            share: 0
        }])
    }
    const deletePartner = (index) => {
        let partners = values.partners;
        partners.splice(index, 1);
        setFieldValue('partners', [...partners])
    }
    const handleAddress = (value, index, partner) => {
        let partners = values.partners;
        partner.address = value;
        partners[index] = partner;
        setFieldValue('partners', [...partners])
    }
    const handleAmount = (value, index, partner) => {
        let partners = values.partners;
        partner.amount = value;
        partners[index] = partner;
        setFieldValue('partners', [...partners])
    }
    const getShare = (partner) => {
        let partners = values.partners;
        let totalSupply = 0;
        partners.map(item => {
            totalSupply += Number(item.amount);
            return item;
        })
        partner.share = (partner.amount / totalSupply) * 100;
        return Math.round(partner.share)
    }

    return (
        <>
            {active ? <>  <Container className='py-3'>
                <Row>
                    <Col sm={12} md={7} className='mx-auto'>
                        <h2 className='text-left text-white'>Create a DAO</h2>
                        <p className='text-white'>
                            Choose a name and symbol for the DAO, GT will get the same parameters.
                            Distribute GT between addresses that will participate in voting
                        </p>
                        {
                            !active && <div className='mx-auto mt-5' style={{ maxWidth: '300px' }}>
                                <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                            </div>
                        }
                    </Col>
                </Row>
                {
                    active &&
                    <Form onSubmit={handleSubmit}>
                        <Row className="mt-3">
                            <Col sm={12} md={7} className='mx-auto'>
                                <h5 className='text-white' >
                                    Name your DAO
                                </h5>
                                <FormGroup>
                                    <Form.Label className='text-white' htmlFor="daoName">
                                        DAO name
                                    </Form.Label >
                                    <FormControl
                                        id="daoName"
                                        name="daoName"
                                        value={values.daoName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {
                                        touched.daoName && errors.daoName ? <small className='text-danger'>{touched.daoName && errors.daoName}</small> : <Form.Label style={{ color: 'rgba(255, 255, 255, 0.48)' }}>
                                            <small>DAO name</small>
                                        </Form.Label>
                                    }
                                </FormGroup>
                                <FormGroup>
                                    <Form.Label className='text-white' htmlFor="daoSymbol">
                                        DAO symbol
                                    </Form.Label >
                                    <FormControl
                                        id="daoSymbol"
                                        name="daoSymbol"
                                        value={values.daoSymbol}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {
                                        touched.daoSymbol && errors.daoSymbol ? <small className='text-danger'>{touched.daoSymbol && errors.daoSymbol}</small> : <Form.Label style={{ color: 'rgba(255, 255, 255, 0.48)' }}>
                                            <small>DAO symbol</small>
                                        </Form.Label>
                                    }

                                </FormGroup>
                            </Col>
                            <Col sm={12} md={7} className='mx-auto mt-5'>
                                <h5 className='text-white' >
                                    Set up Partners & Shares
                                </h5>
                                {
                                    values.partners.map((partner, index) => (
                                        <div key={index}>
                                            <FormGroup >
                                                <Form.Label className="text-white" htmlFor="partnerAddress">
                                                    Partner address
                                                </Form.Label>
                                                <div className='d-flex' style={{ position: 'relative' }}>
                                                    <FormControl
                                                        id="partnerAddress"
                                                        name="address"
                                                        onBlur={handleBlur}
                                                        value={partner.address}
                                                        onChange={({ target }) => handleAddress(target.value, index, partner)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className='dao-btn-danger px-2 py-1'
                                                        style={{ fontSize: '20px', marginLeft: '15px' }}
                                                        title="Remove Partner"
                                                        onClick={() => deletePartner(index)}
                                                    ><TiUserDelete className='icons' /></button>
                                                </div>
                                                {
                                                    (errors.partners && touched.address && errors.partners[index]) && <small className="text-danger">{errors.partners[index].address}</small>
                                                }
                                            </FormGroup>
                                            <FormGroup>
                                                <Form.Label className="text-white" htmlFor="gtAmount">
                                                    GT Amount
                                                </Form.Label>
                                                <div className='d-flex'>
                                                    <FormControl
                                                        type="number"
                                                        id="gtAmount"
                                                        name={`amount`}
                                                        onBlur={handleBlur}
                                                        value={partner.amount}
                                                        onChange={({ target }) => handleAmount(target.value, index, partner)}
                                                    />
                                                    <button type="button"
                                                        className="percentage-btn px-2 py-1"
                                                        style={{ fontSize: '20px', marginLeft: '15px' }}>
                                                        {getShare(partner, index)}%
                                                    </button>
                                                </div>
                                                {

                                                    (errors.partners && touched.amount && errors.partners[index]) && <small className="text-danger">{errors.partners[index].amount}</small>
                                                }
                                            </FormGroup>
                                            {
                                                values.partners.length - 1 !== index && <hr style={{ borderColor: '#767680' }} />
                                            }
                                        </div>
                                    ))
                                }
                                <FormGroup className='mt-3'>
                                    <button
                                        onClick={addPartner}
                                        type="button" className='dao-btn w-100' style={{ fontWeight: 'bold' }}>
                                        <TiUserAdd className='icon' style={{ fontWeight: 'bold' }} />
                                        Add Partner
                                    </button>
                                </FormGroup>
                            </Col>
                            <Col sm={12} md={7} className='mx-auto mt-5'>
                                <h5 className='text-white' >
                                    Set up a Quorum
                                </h5>
                                <Row>
                                    <Col className="col-12">
                                    </Col>
                                    <Col xl={3} className="mb-3">
                                        <div className='quorom d-flex'>
                                            <FormControl
                                                type="number"
                                                min="1"
                                                max="100"
                                                name="quarom"
                                                value={values.quarom}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <div className='quorom-btn d-flex flex-column'>
                                                <button
                                                    type="button"
                                                    className="quorom-btn-1 p-0"
                                                    onClick={increaseQuarom}>
                                                    <TiArrowSortedUp />
                                                </button>
                                                <div className='p-0 m-0 w-100' style={{ borderTop: '1px solid rgba(255, 255, 255, 0.16)' }} ></div>
                                                <button
                                                    type="button"
                                                    className="quorom-btn-2 p-0"
                                                    onClick={decreaseQuarom} >
                                                    <TiArrowSortedDown />
                                                </button>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xl={9} className="h-100">
                                        <FormGroup className="h-100">
                                            <div className='h-100 d-flex align-items-center justify-content-center'>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="100"
                                                    className="slider w-100"
                                                    id="myRange"
                                                    value={values.quarom}
                                                    onChange={({ target }) => setFieldValue("quarom", target.value)}
                                                    onBlur={handleBlur}
                                                />
                                            </div>
                                        </FormGroup>
                                    </Col>
                                    <Col className="col-12 my-5 text-center">
                                        <div className='mx-auto' style={{ width: "300px" }}>
                                            <button
                                                type='submit'
                                                className='dao-btn px-5 w-100'
                                                style={{ backgroundColor: '#8AB5FF', color: '#0D0D15', fontSize: '20px' }}
                                                disabled={!(isValid && dirty) || loading}
                                            >
                                                {
                                                    loading ? <Spinner animation="border" variant="primary" /> : 'Create a DAO'
                                                }
                                            </button>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Form>

                }
            </Container>
            </>
                :
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
    daoName: yup.string().min(3, 'Too Short!').max(50, 'Too Long!').required("This is required!"),
    daoSymbol: yup.string().min(3, 'Too Short!').max(50, 'Too Long!').required("This is required!"),
    quarom: yup.number().moreThan(0, 'Must be more then 0').required("This is required!"),
    partners: yup.array(
        yup.object().shape({
            address: yup.string().test('isAddres', 'Invalid address', function (value) {
                if (value) {
                    return ethers.utils.isAddress(value);
                } else {
                    return true
                }
            }).required("This is required"),
            amount: yup.number().moreThan(0, 'Must be more then 0').required("This is required!"),
            share: yup.number().moreThan(0, 'Must be more then 0').required("This is required!")
        })
    )
})

export default CreateDao;