import React from 'react';
import { Row, Col, Container, FormControl } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { TiUserAdd, TiUserDelete } from 'react-icons/ti';
import { HiLockOpen } from 'react-icons/hi';
import { RiSendPlane2Fill } from 'react-icons/ri';
import { SiSnowflake } from 'react-icons/si';
import { FaLock } from 'react-icons/fa';
import { BsShieldFill, BsCheckCircle, BsPlusCircle, BsPercent } from 'react-icons/bs';
import { MdLaunch } from 'react-icons/md';
import { AiTwotoneSetting } from 'react-icons/ai'
import { WALLETCONTEXT } from '../contexts/walletContext';
import { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { constants } from 'ethers';
import { useState } from 'react';
import ConnectWallet from '../components/sidebar/connectWallet';
import { networks } from '../utils/networks';
const VotingList = () => {
    const { dao, getLpContract } = WALLETCONTEXT();
    const { active, account, chainId } = useWeb3React();
    const { address } = useParams();
    const [gtMintable, setGTMintable] = useState(false);
    const [gtBurnable, setGTBurnable] = useState(false);
    const [lpMintable, setLPMintable] = useState(false);
    const [lpBurnable, setLPBurnable] = useState(false);
    const [LP, setLP] = useState(false);
    const [owner, setOwner] = useState(false);
    const [permitted, setPermitted] = useState(false);
    const [adapter, setAdapter] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (account && active) {
            getDaoMembers(address)
            getDao();
        };
    }, [account, chainId, active])
    const navigation = (path) => {
        navigate(path)
    }

    const getDao = async () => {
        try {

            const contract = await dao(address);
            const lp = await contract.lp();
            getGTStatus(contract);
            if (constants.AddressZero !== lp) {
                setLP(lp);
                getGTStatus(contract);
                getLPStatus(lp)
            }
        } catch (error) {
        }
    }
    const getGTStatus = async (contract) => {
        try {
            const gtMintable = await contract.mintable();
            const gtBurnable = await contract.mintable();
            setGTMintable(gtMintable);
            setGTBurnable(gtBurnable);
        } catch (error) {
        }
    }
    const getLPStatus = async (lpAddress) => {
        try {
            const contract = await getLpContract(lpAddress);
            const lpMintable = await contract.mintableStatusFrozen();
            const lpBurnable = await contract.burnableStatusFrozen();
            setLPMintable(!lpMintable);
            setLPBurnable(!lpBurnable);
        } catch (error) {
            console.log(error);
        }
    }
    const getDaoMembers = async (address) => {
        try {
            const contract = await dao(address);
            const balanceOf = await contract.balanceOf(account);
            if (String(balanceOf) > 0) setOwner(true);
            const permitted = await contract.containsPermitted(account);
            setPermitted(permitted);
            const adapter = await contract.containsAdapter(account);
           setAdapter(adapter);
        } catch (error) {
            console.log(error)
        }
    }
    return (<>
        {
            active && owner ?
                <Container>
                    <Row>
                        <Col className='mx-auto' xs={12} md={12} lg={9}>

                            <Container className='my-3' >
                                <FormControl placeholder='Start Typing Voting Name...' />
                            </Container>
                            <Container className='mb-3 text-white'>
                                <h3>Governance Token</h3>
                            </Container>
                            <Container className='text-white'>
                                <Row xs={1} sm={2} md={3} lg={3}>
                                    {
                                        gtMintable && <Col className='mb-3'>
                                            <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/mintGt/${address}`)}>
                                                <h5 className='d-flex align-items-center'>
                                                    <span><TiUserAdd className='icon' color='#8AB5FF' /></span>
                                                    <span className='text-white' style={{ fontSize: '16px' }}>
                                                        Mint GT
                                                    </span>
                                                </h5>
                                                <p className='text-white' style={{ fontWeight: '100' }}>
                                                    Invite new member or increase existing memeber's voting power.
                                                </p>
                                            </div>
                                        </Col>
                                    }
                                    {
                                        gtBurnable && <Col className='mb-3'>
                                            <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/burnGt/${address}`)}>
                                                <h5 className='d-flex align-items-center '>
                                                    <span><TiUserDelete className='icon' color='#8AB5FF' /></span>
                                                    <span className='text-white' style={{ fontSize: '16px' }}>
                                                        Burn GT
                                                    </span>
                                                </h5>
                                                <p className='text-white' style={{ fontWeight: '100' }}>
                                                    Remove a member or decrease member's voting power.
                                                </p>
                                            </div>
                                        </Col>
                                    }
                                    <Col className='mb-3' >
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/moveGt/${address}`)}>
                                            <h5 className='d-flex align-items-center'>
                                                <span><RiSendPlane2Fill style={{ transform: 'rotate(-45deg)' }} className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Move GT
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Transfer voting power from one address to another.
                                            </p>
                                        </div>
                                    </Col>
                                    {
                                        gtMintable && <Col className='mb-3'>
                                            <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/freezeGtMinting/${address}`)}>
                                                <h5 className='d-flex align-items-center' >
                                                    <span><SiSnowflake className='icon' color='#8AB5FF' /></span>
                                                    <span className='text-white' style={{ fontSize: '16px' }}>
                                                        Disable and Freeze GT Mining
                                                    </span>
                                                </h5>
                                                <p className='text-white' style={{ fontWeight: '100' }}>
                                                    Permanently disables the ability to mint GT tokens.
                                                    it will not be possible to enable the minting of GT tokens.
                                                </p>
                                            </div>
                                        </Col>
                                    }
                                    {
                                        gtBurnable && <Col className='mb-3'>
                                            <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/freezeGtBurning/${address}`)}>
                                                <h5 className='d-flex align-items-center' >
                                                    <span><SiSnowflake className='icon' color='#8AB5FF' /></span>
                                                    <span className='text-white' style={{ fontSize: '16px' }}>
                                                        Disable and Freeze GT Burning
                                                    </span>
                                                </h5>
                                                <p className='text-white' style={{ fontWeight: '100' }}>
                                                    Permanently disables the ability to burn GT tokens.
                                                    it will not be possible to enable the burning of GT tokens.
                                                </p>
                                            </div>
                                        </Col>
                                    }
                                </Row>
                            </Container>
                            <Container className='mb-3 text-white'>
                                <h3>LP Token</h3>
                            </Container>
                            <Container className='text-white'>
                                <Row xs={1} sm={2} md={3} xl={3}>
                                    {
                                        !LP ? <>
                                            <Col className='mb-3'>
                                                <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/createLp/${address}`)}>
                                                    <h5 className='d-flex align-items-center'>
                                                        <span><MdLaunch className='icon' color='#8AB5FF' /></span>
                                                        <span className='text-white' style={{ fontSize: '16px' }}>
                                                            Create LP Token
                                                        </span>
                                                    </h5>
                                                    <p className='text-white' style={{ fontWeight: '100' }}>
                                                        Allows you to create LP tokens.
                                                        You can use LP to raise an investment.
                                                    </p>
                                                </div>
                                            </Col
                                            ></> : <>
                                            <Col className='mb-3'>
                                                <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/initPublicOffer/${address}`)}>
                                                    <h5 className='d-flex align-items-center'>
                                                        <span><MdLaunch className='icon' color='#8AB5FF' /></span>
                                                        <span className='text-white' style={{ fontSize: '16px' }}>
                                                            Initialize Public Offer
                                                        </span>
                                                    </h5>
                                                    <p className='text-white' style={{ fontWeight: '100' }}>
                                                        Launch an IDO for you LP.
                                                        Publically sell it for a fixed price.
                                                        Offer configuration can be changed later.
                                                        Enable and disable it, change rate and currency at any time.
                                                    </p>
                                                </div>
                                            </Col>
                                            <Col className='mb-3'>
                                                <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/initPrivateOffer/${address}`)}>
                                                    <h5 className='d-flex align-items-center '>
                                                        <span><BsShieldFill className='icon' color='#8AB5FF' /></span>
                                                        <span className='text-white' style={{ fontSize: '16px' }}>
                                                            Create Private Offer
                                                        </span>
                                                    </h5>
                                                    <p className='text-white' style={{ fontWeight: '100' }}>
                                                        Privately sell your LP to a specific recipient for a specific price.
                                                        This offer is single-user. Offer configuration can't be change later,
                                                        however you can disable it.
                                                    </p>
                                                </div>
                                            </Col>
                                            <Col className='mb-3' >
                                                <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/disablePrivateOffer/${address}`)}>
                                                    <h5 className='d-flex align-items-center'>
                                                        <span><FaLock className='icon' color='#8AB5FF' /></span>
                                                        <span className='text-white' style={{ fontSize: '16px' }}>
                                                            Disable Private Offer
                                                        </span>
                                                    </h5>
                                                    <p className='text-white' style={{ fontWeight: '100' }}>
                                                        Use this voting in case your investor didn't purchase the offer in time.
                                                    </p>
                                                </div>
                                            </Col>
                                            {
                                                lpMintable && <Col className='mb-3' >
                                                    <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/changeLpMinting/${address}`)}>
                                                        <h5 className='d-flex align-items-center'>
                                                            <span><FaLock className='icon' color='#8AB5FF' /></span>
                                                            <span className='text-white' style={{ fontSize: '16px' }}>
                                                                Change LP Minting Status
                                                            </span>
                                                        </h5>
                                                        <p className='text-white' style={{ fontWeight: '100' }}>
                                                            If you want to sell your LP tokens using offers, You have to keep this status enabled.
                                                            Can be changed later.
                                                        </p>
                                                    </div>
                                                </Col>
                                            }
                                            {
                                                lpBurnable && <Col className='mb-3'>
                                                    <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/changeLpBurning/${address}`)}>
                                                        <h5 className='d-flex align-items-center' >
                                                            <span><FaLock className='icon' color='#8AB5FF' /></span>
                                                            <span className='text-white' style={{ fontSize: '16px' }}>
                                                                Change LP Burning Status
                                                            </span>
                                                        </h5>
                                                        <p className='text-white' style={{ fontWeight: '100' }}>
                                                            Enabled LP burning status allows investors to leave a DAO, Can be changed later.
                                                        </p>
                                                    </div>
                                                </Col>
                                            }
                                            {
                                                lpMintable && <Col className='mb-3'>
                                                    <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/freezeLpMinting/${address}`)}>
                                                        <h5 className='d-flex align-items-center' >
                                                            <span><SiSnowflake className='icon' color='#8AB5FF' /></span>
                                                            <span className='text-white' style={{ fontSize: '16px' }}>
                                                                Freeze LP Minting Status
                                                            </span>
                                                        </h5>
                                                        <p className='text-white' style={{ fontWeight: '100' }}>
                                                            Permanently disables the ability to change the minting status of LP tokens.
                                                            Locks LP minting status in current position. Can't be changed later.
                                                        </p>
                                                    </div>
                                                </Col>
                                            }
                                            {
                                                lpBurnable && <Col className='mb-3'>
                                                    <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/freezeLpBurning/${address}`)}>
                                                        <h5 className='d-flex align-items-center' >
                                                            <span><SiSnowflake className='icon' color='#8AB5FF' /></span>
                                                            <span className='text-white' style={{ fontSize: '16px' }}>
                                                                Freeze LP Burning Status
                                                            </span>
                                                        </h5>
                                                        <p className='text-white' style={{ fontWeight: '100' }}>
                                                            Permanently disables the ability to change the burning status of LP tokens.
                                                            Locks LP Burning status in current position. Can't be changed later.
                                                        </p>
                                                    </div>
                                                </Col>
                                            }
                                        </>
                                    }

                                </Row>
                            </Container>
                            <Container className='mb-3 text-white'>
                                <h3>Transfer & Approve</h3>
                            </Container>
                            <Container className='text-white'>
                                <Row xs={1} sm={2} md={3} lg={3}>
                                    <Col className='mb-3'>
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/sendCoin/${address}`)}>
                                            <h5 className='d-flex align-items-center'>
                                                <span><RiSendPlane2Fill style={{ transform: 'rotate(-45deg)' }} className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Send {networks[chainId].nativeCurrency.symbol}
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Transfer {networks[chainId].nativeCurrency.symbol} from DAO's balance.
                                            </p>
                                        </div>
                                    </Col>
                                    <Col className='mb-3'>
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/sendToken/${address}`)}>
                                            <h5 className='d-flex align-items-center '>
                                                <span><RiSendPlane2Fill style={{ transform: 'rotate(-45deg)' }} className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Send Token
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Transfer any token from DAO's balance.
                                            </p>
                                        </div>
                                    </Col>
                                    <Col className='mb-3' >
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/approvedToken/${address}`)}>
                                            <h5 className='d-flex align-items-center'>
                                                <span><BsCheckCircle className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Approve Token
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Approve any token to a spender.
                                                This is usefull  when you interact with Defi Protocols.
                                            </p>
                                        </div>
                                    </Col>
                                </Row>
                            </Container>
                            <Container className='mb-3 text-white'>
                                <h3>Permitted & Adapters</h3>
                            </Container>
                            <Container className='text-white'>
                                <Row xs={1} sm={2} md={3} lg={3}>
                                    <Col className='mb-3'>
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/addPermitted/${address}`)}>
                                            <h5 className='d-flex align-items-center'>
                                                <span><BsPlusCircle className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Add Permitted
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Allow you to use any smart contract as a module and
                                                also allows the specified address to perform any operation
                                                without voting.
                                            </p>
                                        </div>
                                    </Col>
                                    <Col className='mb-3'>
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/addAdapter/${address}`)}>
                                            <h5 className='d-flex align-items-center '>
                                                <span><BsPlusCircle className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Add Adapter
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Allows you to withdraw part of the funds from third-party smart contracts,
                                                If LP holders decides to leave the DAO.
                                            </p>
                                        </div>
                                    </Col>
                                    {
                                        permitted && <Col className='mb-3'>
                                            <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/removePermitted/${address}`)}>
                                                <h5 className='d-flex align-items-center'>
                                                    <span><BsPlusCircle className='icon' color='#8AB5FF' /></span>
                                                    <span className='text-white' style={{ fontSize: '16px' }}>
                                                        Remove Permitted
                                                    </span>
                                                </h5>
                                                <p className='text-white' style={{ fontWeight: '100' }}>
                                                    Remove Adapter from your DAO.
                                                </p>
                                            </div>
                                        </Col>
                                    }
                                    {
                                        adapter && <Col className='mb-3'>
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/removeAdapter/${address}`)}>
                                            <h5 className='d-flex align-items-center'>
                                                <span><BsPlusCircle className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Remove Adapter
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Remove Permitted from your DAO.
                                            </p>
                                        </div>
                                    </Col>
                                    }
                                </Row>
                            </Container>
                            <Container className='mb-3 text-white'>
                                <h3>Quarom</h3>
                            </Container>
                            <Container className='text-white'>
                                <Row xs={1} sm={2} md={3} lg={3}>
                                    <Col className='mb-3'>
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/changeQuorom/${address}`)}>
                                            <h5 className='d-flex align-items-center'>
                                                <span><BsPercent className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Change Quarom
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Allows to change the decision entry threshold.
                                            </p>
                                        </div>
                                    </Col>
                                </Row>
                            </Container>
                            <Container className='mb-3 text-white'>
                                <h3>Extra</h3>
                            </Container>
                            <Container className='text-white'>
                                <Row xs={1} sm={2} md={3} lg={3} >
                                    <Col className='mb-3'>
                                        <div className='dao-primary-btn px-3 py-3 h-100' onClick={() => navigation(`/customTransaction/${address}`)}>
                                            <h5 className='d-flex align-items-center'>
                                                <span><AiTwotoneSetting className='icon' color='#8AB5FF' /></span>
                                                <span className='text-white' style={{ fontSize: '16px' }}>
                                                    Custom Transaction
                                                </span>
                                            </h5>
                                            <p className='text-white' style={{ fontWeight: '100' }}>
                                                Allows to create any custom transaction.
                                            </p>
                                        </div>
                                    </Col>
                                </Row>
                            </Container>
                        </Col>
                    </Row>
                </Container>
                : <div className='text-center my-5 mx-auto' style={{ maxWidth: '300px' }}>
                    <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                </div>

        }
    </>
    )
}

export default VotingList;