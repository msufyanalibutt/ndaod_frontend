import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { WALLETCONTEXT } from '../contexts/walletContext';
import ConnectWallet from '../components/sidebar/connectWallet';
import { HiLockOpen } from 'react-icons/hi';
import { useWeb3React } from '@web3-react/core';
import { constants } from 'ethers';
import { truncateAddress } from '../utils';
import * as randomColor from 'randomcolor';
import IndexSwap from '../components/swap';

const Swap = () => {
    const [daos, setDaos] = useState([]);
    const [selected, setSelected] = useState(null);
    const { account, active, chainId } = useWeb3React();
    const location = useLocation();
    const { daoList } = WALLETCONTEXT();
    useEffect(() => {
        if (active && chainId) {
            getSearchParams();
            getDaosList();
        }
    }, [active,chainId]);
    const getSearchParams = () => {
        const query = new URLSearchParams(location.search);
        let senderAddress = query.get('senderAddress');
        if (senderAddress) {
            setSelected(senderAddress);
        }

    }
    const getDaosList = async () => {
        try {
            const result = await daoList(account);
            console.log(result)
            setDaos(result);
        } catch (error) {
        }
    }
    const selectedDao = (dao) => {
        setSelected(dao);
    }
    return (
        <>
            {active ? <>
                <Container className='py-3'>
                    <Row>
                        <Col xs={12} xl={9} className="mx-auto text-white">
                            <h1>Swap</h1>
                            <p>Swap your or DAO's assets</p>
                        </Col>
                    </Row>
                </Container>
                <Container className='py-3'>

                    <Row>
                        <Col xs={12} xl={9} className="mx-auto text-white">
                            <h3>Choose Sender Address</h3>
                            <Row xs={1} sm={2} md={3}>
                                <Col className="mb-3">
                                    <div className={`d-flex align-items-center py-2 px-3 ecosystem ${selected === account && 'selectedecosystem'}`} onClick={() => selectedDao(account)}>
                                        <div className='profile me-3' style={{ width: '40px', height: '40px', background: randomColor() }}>
                                        </div>
                                        <div>
                                            <p className='p-0 m-0'>
                                                Your Account
                                            </p>
                                            <p className='p-0 m-0 text-white'>{truncateAddress(account)}</p>
                                        </div>
                                    </div>
                                </Col>
                                {
                                    daos.map((dao, index) => (
                                        !(constants.AddressZero === dao.dao) &&
                                        <Col key={index} className="mb-3">
                                            <div className={`d-flex align-items-center py-2 px-3 ecosystem ${selected === dao.dao && 'selectedecosystem'}`} onClick={() => selectedDao(dao.dao)}>
                                                <div className='profile me-3' style={{ width: '40px', height: '40px', background: randomColor() }}>
                                                </div>
                                                <div>
                                                    <p className='p-0 m-0'>
                                                        <span className='text-white'>
                                                            {dao.daoSymbol}
                                                        </span>
                                                    </p>
                                                    <p className='p-0 m-0 text-white'>{truncateAddress(dao.dao)}</p>
                                                </div>
                                            </div>
                                        </Col>
                                    ))
                                }

                            </Row>
                        </Col>
                    </Row>
                </Container>
                <IndexSwap
                    chainId={chainId}
                    senderAddress={selected}
                    searchParams={ new URLSearchParams(location.search)}
                />
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
export default Swap;