import React, { useState, useEffect } from 'react';
import ConnectWallet from '../components/sidebar/connectWallet';
import { HiLockOpen, HiOutlineEye } from 'react-icons/hi';
import { AiOutlineLock } from 'react-icons/ai';
import { MdOutlineVerified } from 'react-icons/md';
import { BsShareFill, BsPersonFill } from 'react-icons/bs';
import { FiSettings } from 'react-icons/fi';
import { NavLink, useParams } from 'react-router-dom';
import { Container, Row, Col, Dropdown, Tabs, Tab, Table } from 'react-bootstrap';
import { useWeb3React } from '@web3-react/core';
import { WALLETCONTEXT } from '../contexts/walletContext';
import * as randomColor from 'randomcolor';
import Dao from '../components/home/index';
import VotingList from '../components/voting/VotingList';
import { truncateAddress, covalent, index_contract_address } from '../utils';
import { constants, ethers } from 'ethers';
import Transactions from '../components/transactions';
import axios from 'axios';
import MyAssets from '../components/home/myassets';
import { networks } from '../utils/networks';

const Home = () => {
    // const [loading, setLoading] = useState(false);
    const { account } = useParams();
    const [assets, setAssets] = useState([]);
    const [balance, setBalance] = useState(0)
    const [daos, setDaos] = useState([]);
    const { active, chainId, library } = useWeb3React();
    const { getDaoViewerContract } = WALLETCONTEXT();

    useEffect(() => {
    }, [daos]);
    useEffect(() => {
        if (active && account) {
            getDaoList()
            getMyAssets();
        }
    }, [account, active]);
    const getDaoList = async () => {
        try {
            const contract = await getDaoViewerContract();
            const result = await contract.getDaos(index_contract_address[chainId])
            setDaos(result);
            const balance = await library.getBalance(account);
            setBalance(ethers.utils.formatEther(balance));
        } catch (error) {
        }

    }
    const getMyAssets = async () => {
        const url = `https://api.covalenthq.com/v1/${chainId}/address/${account}/balances_v2/?key=${covalent}`;
        try {
            const result = await axios.get(url);
            let items = result.data.data.items;
            setAssets(items);
        } catch (error) {
        }
    }
    return (
        <div className='home'>
            {
                !active && <>
                    <div className='circle my-5'>
                        <div className='circle-filter'>

                        </div>
                        <div className='circle-image'>
                            <img src="/images/home-conect-your-wallet.svg" alt='cirlcle' />
                        </div>
                    </div>

                    <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                        <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                    </div>
                    <div className='text-center home-points mx-auto' >
                        <div className='box'>
                            <div className='left'><HiOutlineEye className='icons' /></div>
                            <div className='right'>View only permissions. We will never do anything without your permission</div>
                        </div>
                        <div className='box'>
                            <div className='left'><AiOutlineLock className='icons' /></div>
                            <div className='right'>
                                <a href="/#">Audited Smart Contract</a>
                            </div>
                        </div>
                        <div className='box'>
                            <div className='left'><MdOutlineVerified className='icons' /></div>
                            <div className='right'>Trusted by more than 20.000 Users</div>
                        </div>
                    </div>
                </>
            }
            {
                active && <>
                    <Container className='mt-3'>
                        <Row>
                            <Col xs={12} lg={7} className="mx-auto">
                                <Row>
                                    <Col className='d-flex align-items-center  text-white'>
                                        <div className='profile' style={{ marginRight: '20px' }}>

                                        </div>
                                        <div>
                                            <h4>{truncateAddress(account)}</h4>
                                            <h4>
                                                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, notation: "compact", compactDisplay: "short" }).format(balance)}
                                                {' '}
                                                {networks[chainId].nativeCurrency.symbol}
                                            </h4>
                                        </div>
                                    </Col>
                                    <Col className='d-flex justify-content-end text-white align-items-center'>
                                        <div>
                                            <Dropdown align='end'>
                                                <Dropdown.Toggle className='setting-icon' ><FiSettings size={'24px'} /></Dropdown.Toggle>
                                                <Dropdown.Menu >
                                                    <Dropdown.Item href="#/action-1">Change avatar</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                    <Container>
                        <Row>
                            <Col xs={12} lg={7} className="mx-auto pt-3">
                                <Tabs
                                    defaultActiveKey="home"
                                    className="mb-3"
                                >
                                    <Tab eventKey="home" title={<><BsShareFill className='icon' /><span>DAO INTERACTION</span></>}>
                                        <div className='mydaotoken text-white p-3 mb-3 tabborder'>
                                            <Row>
                                                <Col>
                                                    <h4>My DAO Tokens</h4>
                                                </Col>
                                                <Col className='text-right pt-2'>
                                                    <NavLink to="/dao/create" className='dao-btn text-center'>
                                                        Create a Dao
                                                    </NavLink>
                                                </Col>
                                            </Row>
                                            <div className='py-4'>
                                                {
                                                    daos && daos.length > 0 ? <Table >
                                                        <thead>
                                                            <tr className='border-0'>
                                                                <th className='text-muted'>Dao</th>
                                                                <th className='text-muted text-center'>GT</th>
                                                                <th className='text-muted text-center'>LP</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                daos.map((dao, index) => (
                                                                    (constants.AddressZero !== dao.dao) && <tr key={index} className='border-0'>
                                                                        <Dao address={dao.dao} name={dao.daoName} bgColor={randomColor()} account={account} />
                                                                    </tr>
                                                                ))
                                                            }
                                                        </tbody>
                                                    </Table> : <h6 className='text-center'>YOU DON'T HAVE ANY DAO TOKENS</h6>
                                                }
                                            </div>
                                        </div>
                                        {
                                            (daos && daos.length > 0) && <>
                                                {
                                                    daos.map((dao, index) => (
                                                        <VotingList
                                                            key={index}
                                                            address={dao.dao}
                                                            name={dao.daoName}
                                                            activated={false}
                                                            active={true}
                                                            sign={true}
                                                            over={false}
                                                            create={true}
                                                        />
                                                    ))
                                                }
                                            </>
                                        }
                                    </Tab>
                                    <Tab eventKey="profile" title={<><BsPersonFill className='icon' /><span>Profile</span></>}>
                                        <div className='myassets text-white tabborder mb-3 p-3'>
                                            <MyAssets assets={assets} chainId={chainId} />
                                        </div>
                                        <div className='mytransaction text-white tabborder p-3'>
                                            {
                                                account && <Transactions chainId={chainId} address={account} account={account} covalent={covalent} />
                                            }
                                        </div>
                                    </Tab>
                                </Tabs>
                            </Col>
                        </Row>
                    </Container>
                </>
            }
        </div>
    )
}

export default Home;