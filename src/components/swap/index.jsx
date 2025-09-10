import React, { useState, useEffect } from 'react';
import { Row, Col, Container, Form, FormGroup, Spinner } from 'react-bootstrap';
import SellSwap from './sell';
import BuySwap from './buy';
import axios from 'axios';
import { networks } from '../../utils/networks';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import { constants, ethers } from 'ethers';
import Toastify from '../toast';
import { useNavigate } from 'react-router-dom';
import { FiArrowDown } from 'react-icons/fi';



const Index = ({ senderAddress, searchParams }) => {
    const navigate = useNavigate();
    const { chainId, account } = useWeb3React();
    const { getCustomContract, getSwapContract } = WALLETCONTEXT();
    const [loading, setLoading] = useState(false);
    const [tokens, setTokens] = useState([]);

    const [toAddress, setToAddress] = useState(null)
    const [fromAddress, setFromAddress] = useState(null);
    const [approved, setApproved] = useState(false);
    const [maxBalance, setMaxBalance] = useState(0);
    const [data, setData] = useState(null);
    useEffect(() => {
        if (chainId) {
            getTokens();
        }
    }, [chainId]);
    useEffect(() => {
        const tokenAddress = searchParams.get('tokenAddress');
        if (tokenAddress) {
            setFromAddress(tokenAddress)
        } else {
            setFromAddress(networks[chainId].inchCoin)
        }
    }, []);
    useEffect(() => {
        if (fromAddress && account) {
            getInfo()
        }
    }, [fromAddress, senderAddress]);
    useEffect(() => {
        if (chainId) {
            setToAddress(networks[chainId].inchUsdt);
        }
    }, [chainId]);
    useEffect(() => {
        if (fromAddress && chainId) {
            ApproveFromAddress();
        }
    }, [fromAddress, chainId]);
    const ApproveFromAddress = async () => {
        try {
            let url = `https://api.1inch.io/v4.0/${chainId}/approve/transaction/?amount=115792089237316195423570985008687907853269984665640564039457584007913129639935&tokenAddress=${fromAddress}`;
            await axios.get(url)
        } catch (error) {
        }
    }
    const getInfo = async () => {
        try {
            if (fromAddress === networks[chainId].inchCoin) {
                setApproved(true);
                return
            }
            if (!senderAddress) {
                return
            }
            setLoading(true)
            const contract = await getCustomContract(fromAddress);
            let allowance = await contract.allowance(senderAddress, networks[chainId].inch);
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
    const getTokens = async () => {
        try {
            const result = await axios.get(`https://api.1inch.io/v4.0/${chainId}/tokens`);
            let tokens = result.data.tokens;
            tokens = Object.entries(tokens).map(item => item[1]);
            setTokens(tokens);
        } catch (error) {
        }
    }

    const replaceAddresses = () => {
        let from = fromAddress;
        let to = toAddress;
        setFromAddress(to);
        setToAddress(from);
        getConversionRate(values.toBalance, { decimals: values.todecimals });
    }
    const getConversionRate = async (value, item) => {
        if (!value || value < 0) {
            setFieldValue('toBalance', 0);
            return
        } else {
            if (value === values.fromBalance) return
            try {
                let amount = value * Math.pow(10, item.decimals);
                amount = amount.toLocaleString('fullwide', { useGrouping: false });
                let url = `https://api.1inch.io/v4.0/137/quote/?fromTokenAddress=${fromAddress}&toTokenAddress=${toAddress}&amount=${amount}&fee=0.4`;
                let result = await axios.get(url);
                let toToken = result.data.toToken;
                toToken = result.data.toTokenAmount / Math.pow(10, toToken.decimals);
                setFieldValue('toBalance', toToken);
                url = `https://api.1inch.io/v4.0/137/swap/?fromAddress=${senderAddress}&fromTokenAddress=${fromAddress}&toTokenAddress=${toAddress}&amount=${amount}&slippage=1&fee=0.4&referrerAddress=0x883c0b62b82fb6C0E62BaE3e300B6E8e12bCa43b&disableEstimate=true`;
                result = await axios.get(url);
                let data = result.data.tx.data;
                setData(data);
            } catch (error) {
            }

        }
    }
    const handleFormSubmit = async (body) => {
        if (!data) return;
        const iface = new ethers.utils.Interface(['function swap(address,(address,address,address,address,uint256,uint256,uint256,bytes),bytes)'])
        let result = iface.decodeFunctionData('swap', data);
        let swapped = {
            srcToken: result[1][0],
            dstToken: result[1][1],
            srcReceiver: result[1][2],
            dstReceiver: result[1][3],
            amount: result[1][4],
            minReturnAmount: result[1][5],
            flags: result[1][6],
            permit: result[1][7]
        }
        if (senderAddress !== account) {
            let bew = createForIface(result[0], swapped, result[2]);
            moveToSwapToken(bew, networks[chainId].inchCoin === fromAddress ? swapped.amount._hex : 0);
            return
        }
        try {
            setLoading(true);
            const contract = await getSwapContract(networks[chainId].inch);
            let value = networks[chainId].inchCoin === fromAddress ? swapped.amount : 0;
            result = await contract.swap(
                result[0],
                swapped,
                result[2], { value: value });
            await result.wait();
            setLoading(false);
            resetFields();
        } catch (error) {
            Toastify('error', error.message)
            setLoading(false);
        }
    }
    const formSchema = yup.object().shape({
        fromBalance: yup.number().moreThan(0, 'Must be more then 0')
            .test('maxLength', `You must have enough ${networks[chainId].nativeCurrency.symbol} in addition to the amount to pay for gas`, function (value) {
                if (value === maxBalance && fromAddress === networks[chainId].inchCoin) {
                    return false
                } else {
                    return true;
                }
            }).test('maxLength', 'Amount exceeds balance', function (value) {
                if (maxBalance === 0 || value > maxBalance) {
                    return false
                } else {
                    return true
                }
            }).required('This is required'),
        toBalance: yup.number().moreThan(0, 'Must be more then 0').required('This is required')
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
        initialValues: { fromBalance: 0, toBalance: 0, fromName: '', toName: '', todecimals: 0, fromdecimals: 0 },
        validationSchema: formSchema
    });
    const addToken = async () => {
        try {
            setLoading(true);
            let value = constants.MaxUint256;
            if (senderAddress !== account) {
                moveToApprovedToken();
                return
            }
            let contract = await getCustomContract(fromAddress);
            let result = await contract.approve(networks[chainId].inch, value);
            await result.wait();
            setLoading(false);
            getInfo()
        } catch (error) {
            Toastify('error', error.message)
            setLoading(false);
        }
    }
    const moveToApprovedToken = () => {
        let value = constants.MaxInt256;
        value = String(value);
        value = value.toLocaleString('fullwide', { useGrouping: false })
        navigate(`/approvedToken/${senderAddress}?targetAddress=${networks[chainId].inch}&tokenAddress=${fromAddress}&tokenAmount=${value}`, { replace: true })
    }
    const resetFields = () => {
        resetForm()
    }
    const moveToSwapToken = async (bew, value) => {
        const { fromName, toName, fromBalance, toBalance } = values;
        navigate(`/customTransaction/${senderAddress}?targetAddress=${networks[chainId].inch}&data=${bew}&value=${value}&title=1inch: Swap ${fromName} to ${toName}&desc=Swap ${fromBalance} ${fromName} to ${toBalance} ${toName}`);
    }
    const createForIface = (caller, desc, bew) => {
        let ABI = ["function swap(address caller,tuple(address srcToken,address dstToken,address srcReceiver,address dstReceiver,uint256 amount, uint256 minReturnAmount, uint256 flags ,bytes permit),bytes data)"];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("swap", [caller, desc, bew]);
        return iface
    }
    return <>
        <Container>
            <Form onSubmit={handleSubmit}>
                <FormGroup className='mb-3'>
                    <Row>
                        <Col xs={12} xl={9} className="mx-auto text-white">
                            <h4>Swap</h4>
                            <SellSwap
                                tokens={tokens}
                                senderAddress={senderAddress}
                                tokenAddress={fromAddress}
                                setTokenAddress={setFromAddress}
                                searchParams={searchParams}
                                values={values}
                                errors={errors}
                                touched={touched}
                                handleBlur={handleBlur}
                                handleChange={handleChange}
                                handleSubmit={handleSubmit}
                                setFieldValue={setFieldValue}
                                getConversionRate={getConversionRate}
                                maxBalance={maxBalance}
                                setMaxBalance={setMaxBalance}
                            />
                            <div className='my-5 d-flex justify-content-center align-items-center'>
                                <div className='pointer replace-circle' onClick={replaceAddresses}>
                                    <FiArrowDown className='replaceicon' fontSize={'24px'} />
                                </div>
                            </div>
                            <BuySwap
                                tokens={tokens}
                                senderAddress={senderAddress}
                                tokenAddress={toAddress}
                                setTokenAddress={setToAddress}
                                searchParams={searchParams}
                                values={values}
                                errors={errors}
                                touched={touched}
                                handleBlur={handleBlur}
                                handleChange={handleChange}
                                handleSubmit={handleSubmit}
                                setFieldValue={setFieldValue}
                            />
                        </Col>
                    </Row>
                </FormGroup>
                <Row>
                    <Col xs={12} xl={9} className="mx-auto text-white">
                        <FormGroup className="text-white">
                            <Row>
                                <Col>
                                    <p className='p-0 m-0'>Rate:</p>
                                </Col>
                                <Col className="text-right">
                                    <p className='p-0 m-0'>
                                        {
                                            values.toBalance > 0 && values.fromBalance > 0 ?
                                                `1 ${values.toName} = ${Number(values.fromBalance / values.toBalance).toFixed(4)} ${values.fromName}`
                                                : 'Insert token amount to see rate'
                                        }
                                    </p>
                                </Col>
                            </Row>
                        </FormGroup>
                        <FormGroup className="mb-3 text-white">
                            <Row>
                                <Col>
                                    <p className='p-0 m-0'>Slippage:</p>
                                </Col>
                                <Col className="text-right">
                                    <p className='p-0 m-0'>1%</p>
                                </Col>
                            </Row>
                        </FormGroup>
                        {
                            approved ? <FormGroup className="mb-5">
                                <button
                                    type="submit"
                                    className='dao-btn w-100'
                                    style={{ backgroundColor: '#8AB5FF', color: '#0D0D15', fontSize: '20px', fontWeight: 'bold' }}
                                    disabled={!(isValid && dirty && senderAddress) || loading}
                                >
                                    {
                                        loading ? <Spinner animation="border" variant="primary" /> : 'Swap'
                                    }
                                </button>
                            </FormGroup> : <FormGroup className='my-3'>
                                <button
                                    type="button"
                                    className='dao-btn w-100'
                                    style={{ backgroundColor: '#8AB5FF', color: '#0D0D15', fontSize: '20px', fontWeight: 'bold' }}
                                    disabled={loading}
                                    onClick={addToken}
                                >
                                    {
                                        loading ? <Spinner animation="border" variant="primary" /> : 'Approved'
                                    }
                                </button>
                            </FormGroup>
                        }
                    </Col>
                </Row>


            </Form>
        </Container>
    </>
}

export default Index;