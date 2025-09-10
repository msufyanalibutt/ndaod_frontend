import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { WALLETCONTEXT } from '../contexts/walletContext';
import ConnectWallet from '../components/sidebar/connectWallet';
import { HiLockOpen } from 'react-icons/hi';
import { useWeb3React } from '@web3-react/core';
import { constants } from 'ethers';
import { truncateAddress } from '../utils';
import * as randomColor from 'randomcolor';

const GetDaoName = ({ address }) => {
    const [name, setName] = useState('');
    const { getDaoViewerContract } = WALLETCONTEXT();

    useEffect(() => {
        getDaoName()
    }, []);
    const getDaoName = async () => {
        try {
            const contract = await getDaoViewerContract();
            const dao = await contract.getDao(address);
            setName(dao.daoName)
        } catch (error) {
        }
    }
    return (
        <NavLink to={`/dao/${address}`} className='text-white'>
            {name}
        </NavLink>
    )
}

const EcoSystem = () => {
    const [daos, setDaos] = useState([]);
    const { account, active, chainId } = useWeb3React();
    const { createYourDao } = WALLETCONTEXT();
    const navigate = useNavigate();
    useEffect(() => {
        if (active && account) {
            getDaosList();
        }
    }, [account, account, chainId]);
    const getDaosList = async () => {
        try {
            const contract = await createYourDao();
            const daoslist = await contract.getDaos();
            setDaos(daoslist);
        } catch (error) {
        }
    }
    const moveToDao = (address) => {
        navigate(address)
    }
    return (
        <>
            {active ? <>
                <Container className='py-3'>
                    <Row>
                        <Col xs={12} xl={9} className="mx-auto text-white">
                            <h1>Ecosystem</h1>
                            <p>DAOs built on ndaod. Go to DAO to interact with it, participate in voting and buy LP tokens</p>
                        </Col>
                    </Row>
                </Container>
                <Container className='py-3'>
                    <Row>
                        <Col xs={12} xl={9} className="mx-auto text-white">
                            <Row xs={1} sm={2} md={3}>
                                {
                                    daos.map((dao, index) => (
                                        !(constants.AddressZero === dao) &&
                                        <Col key={index} className="mb-3">
                                            <div className='d-flex align-items-center py-2 px-3 ecosystem' onClick={() => moveToDao(`/dao/${dao}`)}>
                                                <div className='profile me-3' style={{ width: '40px', height: '40px', background: randomColor() }}>
                                                </div>
                                                <div>
                                                    <p className='p-0 m-0'>
                                                        <GetDaoName address={dao} />
                                                    </p>
                                                    <p className='p-0 m-0 text-white'>{truncateAddress(dao)}</p>
                                                </div>
                                            </div>
                                        </Col>
                                    ))
                                }

                            </Row>
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
export default EcoSystem;