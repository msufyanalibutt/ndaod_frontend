import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { constants } from 'ethers';
import { AiFillFire } from 'react-icons/ai';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import { PartialExitModule_contract_address, PrivateExitModule_contract_address, ShopLp_contract_address } from '../../utils';
import PublicModalOffer from './publicOfferModal';
import BurnLPModal from './burnLpModal';

const LPToken = (daoConfig) => {
    const { account, active,chainId } = useWeb3React();
    const { getCustomContract, getShopLPContract, getLpContract, dao } = WALLETCONTEXT();
    const [pactive, setpactive] = useState(false);
    const [status, setStatus] = useState('');
    const [symbol, setSymbol] = useState('');
    const [rate, setRate] = useState(0);
    const [currency, setCurrency] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [plpOffer, setPlpOffer] = useState(0);
    const [burnModal, setBurnModal] = useState(false);
    const [privateExit, setPrivateExit] = useState(false);
    const [partialExit, setPartialExit] = useState(false);
    useEffect(() => {
        getPublicOffer();
        getPrivateOffers();
        getPrivateExitOffer();
        getPartialExitOffer();
    }, [daoConfig]);
    const getPublicOffer = async () => {
        try {
            let contract = await getShopLPContract();
            const result = await contract.publicOffers(daoConfig.address);
            if (result.currency === constants.AddressZero) {
                setStatus('initPublic')
            } else {
                setCurrency(result.currency);
                setpactive(result.isActive)
                contract = await getCustomContract(result.currency);
                let decimals = await contract.decimals();
                setRate(String(result.rate) / Math.pow(10, decimals));
                let symbol = await contract.symbol();
                setSymbol(symbol);
                setStatus('publicOffer')
            }
        } catch (error) {
        }
    }
    const addToken = async () => {
        setOpenModal(true);
    }
    const getPrivateOffers = async () => {
        try {
            let contract = await getShopLPContract();
            const result = await contract.numberOfPrivateOffers(daoConfig.address);
            setPlpOffer(String(result));
        } catch (error) {
        }
    }
    const getPrivateExitOffer = async () => {
        try {
            const daoContract = await dao(daoConfig.address);
            const permitted = await daoContract.containsPermitted(PrivateExitModule_contract_address[chainId]);
            setPrivateExit(permitted)
        } catch (error) {
        }
    }
    const getPartialExitOffer = async () => {
        try {
            const daoContract = await dao(daoConfig.address);
            const permitted = await daoContract.containsPermitted(PartialExitModule_contract_address[chainId]);
            setPartialExit(permitted)
        } catch (error) {
        }
    }
    return (
        <>
            <Row xs={1} sm={1} md={1}>
                <Col className="mb-3">
                    <Card className='border-0'>
                        <Card.Body style={{ background: '#16161e' }}>
                            <Row >
                                <Col xss={12} md={9} lg={6} className="mb-3">
                                    <p className='mb-0 pb-0'>
                                        Public Offer&nbsp;
                                        <small>
                                            <b>
                                                {status === 'publicOffer' ?
                                                    <span className='text-success'>1 LP = {rate} {symbol} </span> :
                                                    <span className='text-muted'>(There is no offer)</span>}
                                            </b>
                                        </small>
                                    </p>
                                    <p className='text-muted mb-0 pb-0'>
                                        Anyone can buy DAO's LP tokens for fixed price.
                                    </p>
                                </Col>
                                <Col className='text-right mb-3'>
                                    {
                                        status === 'initPublic' && <NavLink className="dao-btn p-2" to={`/initPublicOffer/${daoConfig.address}`}>Init Public Offer</NavLink>
                                    }
                                    {
                                        status === 'publicOffer' && <button
                                            disabled={!pactive}
                                            className="dao-btn p-2"
                                            onClick={addToken}
                                        >Public Offer</button>
                                    }
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col className="mb-3">
                    <Card className='border-0'>
                        <Card.Body style={{ background: '#16161e' }}>
                            <Row >
                                <Col xss={12} md={9} lg={6} className="mb-3">
                                    <p className='mb-0 pb-0'>
                                        {plpOffer} Private Offers
                                    </p>
                                    <p className='text-muted mb-0 pb-0'>
                                        Chosen recipients can buy LP tokens for special price.
                                    </p>
                                </Col>
                                <Col className='text-right mb-3'>
                                    {
                                        (plpOffer === 0) ?
                                            <NavLink
                                                className="dao-btn p-2 btn"
                                                to={`/initPrivateOffer/${daoConfig.address}`}>
                                                Create Private Offer
                                            </NavLink> :
                                            <NavLink
                                                className="dao-btn p-2 btn"
                                                to={`/dao/${daoConfig.address}/privateOffers`}>
                                                Private Offers
                                            </NavLink>
                                    }

                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col className="mb-3">
                    <Card className='border-0'>
                        <Card.Body style={{ background: '#16161e' }}>
                            <Row >
                                <Col xss={12} md={9} lg={6} className="mb-3">
                                    <p className='mb-0 pb-0'>
                                        Burn LP
                                    </p>
                                    <p className='text-muted mb-0 pb-0'>
                                        Burn LP tokens and get all DAO assets proportional to the share.
                                    </p>
                                </Col>
                                <Col className='text-right mb-3'>
                                    <button
                                        className="dao-btn p-2"
                                        onClick={() => setBurnModal(true)}
                                    ><AiFillFire className="icon" />Burn LP</button>

                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                {
                    privateExit && <Col className="mb-3">
                        <Card className='border-0'>
                            <Card.Body style={{ background: '#16161e' }}>
                                <Row >
                                    <Col xss={12} md={9} lg={6} className="mb-3">
                                        <p className='mb-0 pb-0'>
                                            Private Exit
                                        </p>
                                        <p className='text-muted mb-0 pb-0'>
                                            Chosen LP holder can sell their LP tokens for special price.
                                        </p>
                                    </Col>
                                    <Col className='text-right mb-3'>
                                        <NavLink
                                            className="dao-btn p-2"
                                            to={`/dao/${daoConfig.address}/modules/privateExit`}
                                        >Private Exit</NavLink>

                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                }
                {
                    partialExit && <Col className="mb-3">
                        <Card className='border-0'>
                            <Card.Body style={{ background: '#16161e' }}>
                                <Row >
                                    <Col xss={12} md={9} lg={6} className="mb-3">
                                        <p className='mb-0 pb-0'>
                                            Partial Exit
                                        </p>
                                        <p className='text-muted mb-0 pb-0'>
                                            Chosen LP holder can sell their LP tokens for special price.
                                        </p>
                                    </Col>
                                    <Col className='text-right mb-3'>
                                        <NavLink
                                            className="dao-btn p-2"
                                            to={`/dao/${daoConfig.address}/modules/partialExit`}
                                        >Partial Exit</NavLink>

                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                }
            </Row>
            {openModal && <PublicModalOffer
                setOpenModal={setOpenModal}
                openModal={openModal}
                currency={currency}
                symbol={symbol}
                rate={rate}
                account={account}
                getCustomContract={getCustomContract}
                ShopLp_contract_address={ShopLp_contract_address[chainId]}
                name={daoConfig.name}
                daoAddress={daoConfig.address}
                getShopLPContract={getShopLPContract}
                active={active}
            />}
            {
                burnModal && <BurnLPModal
                    burnModal={burnModal}
                    setBurnModal={setBurnModal}
                    lpAddress={daoConfig.lpAddress}
                    getCustomContract={getCustomContract}
                    ShopLp_contract_address={ShopLp_contract_address[chainId]}
                    getShopLPContract={getShopLPContract}
                    getLpContract={getLpContract}
                    assets={daoConfig.assets}
                    address={daoConfig.address}
                />
            }
        </>
    )
}

export default LPToken;