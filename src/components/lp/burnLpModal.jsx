import React, { useEffect, useState } from 'react';
import { Form, FormGroup, FormLabel, Modal, ModalBody, FormControl, Spinner, Row, Col, InputGroup, FormCheck } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { exlcude_Address, truncateAddress } from '../../utils';
import { constants, ethers } from 'ethers';
import Toastify from '../toast';
import ConnectWallet from '../sidebar/connectWallet';
import { HiLockOpen } from 'react-icons/hi';
import { useWeb3React } from '@web3-react/core';
import { MdClose } from 'react-icons/md';
import { FiMinus } from 'react-icons/fi';
const BurnLPModal = ({
    burnModal,
    setBurnModal,
    lpAddress,
    getLpContract,
    getCustomContract,
    assets,
}) => {
    const [approved, setApproved] = useState(false);
    const [balanceOf, SetbalanceOf] = useState(0);
    const [loading, setLoading] = useState(false);
    const [totalSupply, setTotalSupply] = useState(0);
    const { account, active, chainId } = useWeb3React();

    useEffect(() => {
        if (account && active) {
            getInfo();
        }
    }, [account, active]);
    useEffect(() => {
        if (assets && assets.length) {
            let ass = assets.map(item => {
                return {
                    checked: item.type === 'dust',
                    type: item.type,
                    input: "check",
                    address: item.contract_address,
                    contract_name: item.contract_name,
                    contract_address: item.contract_address,
                    defaultValue: 0,
                    value: item.balance || 0,
                    decimals: item.contract_decimals || 18
                }
            })
            setFieldValue('tokenAddresses', [...ass])
        }
    }, [assets])

    const getInfo = async () => {
        try {
            setLoading(true)
            const contract = await getLpContract(lpAddress);
            let allowance = await contract.allowance(account, lpAddress);
            let balanceOf = await contract.balanceOf(account);
            let decimals = await contract.decimals();
            let totalSupply = await contract.totalSupply();
            setTotalSupply(ethers.utils.formatEther(totalSupply))
            SetbalanceOf(String(balanceOf) / Math.pow(10, decimals));
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
    const handleFormSubmit = async (body) => {
        try {
            setLoading(true);
            let ass = body.tokenAddresses;
            ass = ass.filter(item => {
                if (item.checked) {
                    return item
                } else {
                    return false
                }
            });
            ass = ass.map(item => item.address);
            let index = ass.indexOf(exlcude_Address[chainId])
            ass.splice(index, 1);
            let value = ethers.utils.parseEther(String(body.lpAmount));
            const contract = await getLpContract(lpAddress);
            const result = await contract.burn(value, ass, [], []);
            await result.wait();
            setLoading(false);
            setBurnModal(false)
        } catch (error) {
            Toastify('error', error.message);
            setLoading(false);
        }
    }


    const addTokenAddress = () => {
        let tokenAddresses = values.tokenAddresses;
        setFieldValue('tokenAddresses', [...tokenAddresses, {
            input: 'input',
            address: ''
        }])
    }
    const deleteTokenAddress = (index) => {
        let tokenAddresses = values.tokenAddresses;
        tokenAddresses.splice(index, 1);
        setFieldValue('tokenAddresses', [...tokenAddresses])
    }
    // const handleAddress = (value, index, tokenAddress) => {
    //     let tokenAddresses = values.tokenAddresses;
    //     tokenAddress.address = value;
    //     tokenAddresses[index] = tokenAddress;
    //     setFieldValue('tokenAddresses', [...tokenAddresses])
    // }
    const addToken = async () => {
        try {
            let value = constants.MaxUint256
            setLoading(true);
            let contract = await getLpContract(lpAddress);
            let result = await contract.approve(lpAddress, value);
            await result.wait();
            setLoading(false);
            getInfo();
        } catch (error) {
            Toastify('error', error.message)
            setLoading(false);
        }
    }

    const maxTokenTransfer = async () => {
        setFieldValue('lpAmount', Number(balanceOf));
        if (!Number(balanceOf) > 0) {
            return;
        }
        let cAssets = values.tokenAddresses;
        let ass = cAssets.map(item => {
            let share = balanceOf / totalSupply;
            return {
                ...item,
                defaultValue: (share * item.value) / Math.pow(10, item.decimals),

            }
        });
        setFieldValue('tokenAddresses', [...ass])
    }
    const handleChangeAmount = (e) => {
        handleChange(e);
        let value = e.target.value;
        if (!value && value <= 0) {
            value = 0
        }
        let cAssets = values.tokenAddresses;
        let share = value / totalSupply;
        let ass = cAssets.map(item => {
            return {
                ...item,
                defaultValue: (share * item.value) / Math.pow(10, item.decimals),
            }
        })
        setFieldValue('tokenAddresses', [...ass]);
    }

    const getTokenSymbol = async (e, index) => {
        let contractaddress = e.target.value;
        let tokenAddresses = values.tokenAddresses;
        tokenAddresses[index].address = contractaddress
        setFieldValue('tokenAddresses', [...tokenAddresses]);
        if (!ethers.utils.isAddress(contractaddress)) return;
        try {
            Toastify('info', 'Checking balance this address:start');
            let contract = await getCustomContract(contractaddress);
            // let name = await contract.name();
            let symbol = await contract.symbol();
            if (symbol) {
                let item = {
                    checked: false,
                    type: 'cryptocurrency',
                    input: "check",
                    address: contractaddress,
                    contract_name: contractaddress,
                    contract_symbol: symbol,
                    contract_address: contractaddress,
                    defaultValue: 0,
                    value: 0,
                    decimals: 0
                }
                tokenAddresses = values.tokenAddresses;
                tokenAddresses[index] = item;
                setFieldValue('tokenAddresses', [...tokenAddresses]);
                Toastify('success', 'Checking balance this address:success');
            } else {
                Toastify('error', 'There is no token on this address');
            }
        } catch (error) {
            Toastify('error', 'There is no token on this address');
        }

    }
    const selectToken = (checked, index) => {
        let tokenAddresses = values.tokenAddresses;
        tokenAddresses[index].checked = checked;
        setFieldValue('tokenAddresses', [...tokenAddresses]);
    }
    const formSchema = yup.object().shape({
        lpAmount: yup.number().moreThan(0, 'Must be more then 0').test('maxLength', `Total supply is ${balanceOf} LP. Can't be greater than total supply`, function (value) {
            return value <= balanceOf;
        }).required('This is required'),
        tokenAddresses: yup.array(
            yup.object().shape({
                address: yup.string().test('isAddres', 'Invalid address', function (value) {
                    if (value) {
                        return ethers.utils.isAddress(value);
                    } else {
                        return true
                    }
                }).required("This is required")
            })
        )
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
        dirty
    } = useFormik({
        validateOnChange: true,
        onSubmit: handleFormSubmit,
        initialValues: {
            lpAmount: 0, tokenAddresses: []
        },
        validationSchema: formSchema
    });
    return (
        <Modal show={burnModal} onHide={() => setBurnModal(false)} >
            {
                active ?
                    <ModalBody>
                        <Form onSubmit={handleSubmit}>
                            <FormGroup className='mb-3'>
                                <Row>
                                    <Col>
                                        Burn LP
                                    </Col>
                                    <Col className="text-right">
                                        <button type='button' className='dao-btn px-2 py-0' onClick={() => setBurnModal(false)}>
                                            <MdClose />
                                        </button>
                                    </Col>
                                </Row>
                            </FormGroup>
                            <FormGroup className='mb-3'>
                                <FormLabel htmlFor='lpAmount'>Lp Amount</FormLabel>
                                <InputGroup className='form-amount'>
                                    <FormControl
                                        id="lpAmount"
                                        type="text"
                                        name="lpAmount"
                                        placeholder='0.0'
                                        onChange={handleChangeAmount}
                                        onBlur={handleBlur}
                                        value={values.lpAmount || ''}
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
                                <small className="text-danger">{touched.lpAmount && errors.lpAmount}</small>
                            </FormGroup>
                            {
                                (values.tokenAddresses && values.tokenAddresses.length > 0) && <>
                                    {
                                        values.tokenAddresses.map((asset, index) => {
                                            return (
                                                asset.input === 'check' ? <FormGroup className='mb-3' key={index}>
                                                    <Row>
                                                        <Col className='d-flex'>
                                                            <FormCheck
                                                                className="me-2"
                                                                name="checkbox"
                                                                checked={asset.checked}
                                                                onChange={(e) => selectToken(e.target.checked, index)}
                                                                disabled={asset.type === 'dust'}
                                                                label={ethers.utils.isAddress(asset.contract_name) ? truncateAddress(asset.contract_name) : asset.contract_name}
                                                            />
                                                        </Col>
                                                        <Col className='text-right'>
                                                            {new Intl.NumberFormat('en-US', { maximumFractionDigits: 4, notation: "compact", compactDisplay: "short" }).format(asset.defaultValue)}
                                                        </Col>
                                                    </Row>
                                                </FormGroup> : <FormGroup className="mb-3" key={index}>
                                                    <div className='d-flex' style={{ position: 'relative' }}>
                                                        <button
                                                            type="button"
                                                            className='dao-btn-danger px-2 py-1'
                                                            style={{ fontSize: '20px', marginRight: '10px' }}
                                                            onClick={() => deleteTokenAddress(index)}
                                                        ><FiMinus className='icons' /></button>
                                                        <FormControl
                                                            id="address"
                                                            name="address"
                                                            placeholder='Token Address'
                                                            onChange={(e) => getTokenSymbol(e, index)}
                                                            onBlur={(e) => {
                                                                handleBlur(e);
                                                                // getTokenSymbol(e, index)
                                                            }}
                                                            value={asset.address || ''} />
                                                    </div>
                                                    {(errors.tokenAddresses && touched.address && errors.tokenAddresses[index]) && <small className="text-danger">{errors.tokenAddresses[index].address}</small>}
                                                </FormGroup>);
                                        })
                                    }
                                </>
                            }
                            {
                                approved && <FormGroup className="mb-3">
                                    <button
                                        type='button'
                                        className='dao-btn w-100'
                                        onClick={addTokenAddress}>Add Token</button>
                                </FormGroup>
                            }
                            <FormGroup className="mb-3">
                                {
                                    approved ?
                                        <button
                                            type='submit'
                                            className='dao-btn w-100' disabled={!(isValid && dirty) || loading}>
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
                    </ModalBody> : <>
                        <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                            <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                        </div>
                    </>
            }
        </Modal>
    )
}

export default BurnLPModal;