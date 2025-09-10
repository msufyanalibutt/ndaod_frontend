import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Row, Col, FormControl, Form, FormGroup, FormLabel, Spinner, Placeholder } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { constants, ethers } from 'ethers';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import Toastify from '../../components/toast';
import { exlcude_Address, PartialExitModule_contract_address } from '../../utils';
const imageErrorSrc = '/images/NoImageCoinLogo.svg';

const GetTokenInfo = ({ token, chainId, tokenAmount }) => {
    const { getCustomContract } = WALLETCONTEXT();
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [balanceOf, setBalanceOf] = useState(0)
    const [loading, setLoading] = useState(false)
    const getName = async () => {
        try {
            setLoading(true);
            const tokenAddress = token === ethers.constants.AddressZero ? exlcude_Address[chainId] : token;
            const contract = await getCustomContract(tokenAddress);
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();
            setTokenSymbol(symbol);
            setBalanceOf(tokenAmount / Math.pow(10, decimals));
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (token) {
            getName();
        }
    }, [token]);
    return (
        <>
            {
                loading ? <Placeholder as="div" animation="glow" >
                    <Placeholder xs={12} style={{ backgroundColor: '#16161e', height: "50px" }} className="mb-3" />
                </Placeholder> : <Row className='m-0 p-0 py-3'>
                    <Col className='d-flex align-items-center text-white' >
                        <img
                            src={imageErrorSrc}
                            style={{ width: '30px', height: '30px' }}
                            alt={imageErrorSrc}
                        />
                        <span className='ms-2'>{tokenSymbol}</span>
                    </Col>
                    <Col className='text-left'>
                        <FormControl
                            type="number"
                            placeholder='0.0'
                            defaultValue={balanceOf}
                            disabled
                        />
                    </Col>
                </Row>
            }
        </>
    )
}
const BurnLP = ({ item, handleCloseBPOffer }) => {
    const [loading, setLoading] = useState(false);
    // const [balanceOf, setBalanceOf] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);
    const [approved, setApproved] = useState(false);
    const { library, account, chainId } = useWeb3React();
    const { dao, getLpContract, getPartialExitContract } = WALLETCONTEXT();
    const { address } = useParams();

    useEffect(() => {
        if (item) {
            setFieldValue('lpAmount', Number(item.lpAmount))
            getInfo();
        }
    }, [item]);

    const getInfo = async () => {
        try {
            setLoading(true);
            const daoContract = await dao(address);
            const lpAddress = await daoContract.lp();
            const contract = await getLpContract(lpAddress);
            let allowance = await contract.allowance(account, PartialExitModule_contract_address[chainId]);
            let decimals = await contract.decimals();
            let totalSupply = await contract.totalSupply();
            setTotalSupply(String(totalSupply) / Math.pow(10, decimals));
            setFieldValue('totalSupply', String(totalSupply) / Math.pow(10, decimals))
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
    const handleFormSubmit = async () => {
        if (!library) return;
        try {
            setLoading(true);
            const contract = await getPartialExitContract(PartialExitModule_contract_address[chainId]);
            const result = await contract.partialExit(address, item.index);
            await result.wait();
            setLoading(false);
            handleCloseBPOffer();
        } catch (error) {
            Toastify('error', error.message);
            setLoading(false)
        }
    }
    const formSchema = yup.object().shape({
        totalSupply: yup.number(),
        lpAmount: yup.number().moreThan(0, 'Must be more then 0').test('maxLength', `Total supply is ${totalSupply} LP. Can't be greater than total supply`, function (value) {
            if (value <= totalSupply) {
                return true
            } else {
                return false;
            }
        }).required('This is required'),
    })
    const {
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        setFieldValue,
    } = useFormik({
        onSubmit: handleFormSubmit,
        initialValues: { title: "", description: "", recipientAddress: "", lpAmount: 0, tokenAddresses: [] },
        validationSchema: formSchema
    });
    const addToken = async () => {
        try {
            let value = String(constants.MaxUint256);
            setLoading(true);
            const daoContract = await dao(address);
            const lpAddress = await daoContract.lp();
            const contract = await getLpContract(lpAddress);
            const result = await contract.approve(PartialExitModule_contract_address[chainId], value);
            await result.wait();
            setLoading(false);
            getInfo();
        } catch (error) {
            Toastify('error', error.message)
            setLoading(false);
        }
    }
    return (
        <>
            <Form onSubmit={handleSubmit}>
                <FormGroup className='mb-3'>
                    <FormLabel htmlFor='maxLpAmount' >Lp Amount</FormLabel>
                    <FormControl
                        id="lpAmount"
                        type="number"
                        name="lpAmount"
                        placeholder='0'
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.lpAmount}
                        disabled
                    />
                    {
                        (touched.lpAmount && errors.lpAmount) ?
                            <small className="text-danger">{errors.lpAmount}</small> :
                            values.lpAmount > 0 ? <span className='text-muted'>{`This is ${totalSupply === 0 ? 0 : Number((values.lpAmount / totalSupply) * 100).toFixed(4)
                                }% share of DAO funds.`}</span> : ''
                    }
                </FormGroup>
                <FormGroup className='mb-3' style={{ backgroundColor: '#16161e' }}>
                    {item && <GetTokenInfo token={item.tokenAddress} tokenAmount={item.tokenAmount} chainId={chainId} />}
                </FormGroup>
                <FormGroup className="mb-3">
                    {
                        approved ?
                            <button
                                type='submit'
                                className='dao-btn w-100' disabled={loading}
                                style={{ backgroundColor: '#8AB5FF', color: '#0D0D15', fontSize: '20px' }} >
                                {
                                    loading ? <Spinner animation="border" variant="primary" /> : 'Burn LP'
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
        </>
    )
}

export default BurnLP;
