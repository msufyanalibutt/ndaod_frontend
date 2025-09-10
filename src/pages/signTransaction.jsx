import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { HiMenuAlt2 } from 'react-icons/hi';
import { BsClockFill, BsFillCheckCircleFill } from 'react-icons/bs';
import { HiFingerPrint, HiLockOpen } from 'react-icons/hi';
import moment from 'moment';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { db } from '../initFirebase';
import { query, collection, onSnapshot, where, getDocs } from 'firebase/firestore';
import { truncateAddress } from '../utils';
import { WALLETCONTEXT } from '../contexts/walletContext';
import { hexlify } from '@ethersproject/bytes';
import axios from '../utils/api';
import axois from 'axios';
import Toastify from '../components/toast';
import ConnectWallet from '../components/sidebar/connectWallet';
import { ethers } from 'ethers';
import ClipBoard from '../components/clipboard';

const SignTransaction = () => {
    const { address, txhash } = useParams();
    const { active, account, library } = useWeb3React();
    const { dao, getDaoViewerContract } = WALLETCONTEXT();
    const [trans, setTrans] = useState(null);
    const [loading, setLoading] = useState(false);
    const [quarom, setQuarom] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);
    const [hexSignature, setHexSignature] = useState(null);
    const [share, setShare] = useState(0);
    const [show, setShow] = useState(false);
    const [validUser, setValidUser] = useState(false);
    const [msg, setMsg] = useState({
        status: ''
    })
    const navigate = useNavigate();
    useEffect(() => {
        if (account) {
            getSingedTransaction();
        }
    }, [account]);
    const getSingedTransaction = async () => {
        setLoading(true)
        const q = query(collection(db, 'Voting'), where('txHash', '==', txhash))
        onSnapshot(q, async (querySnapshot) => {
            try {
                let doc = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                doc = doc[0];
                if (doc) {
                    setTrans(doc);
                    let result = '';
                    let hex_signature = await axois.get(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${doc.hex_signature}&ordering=created_at`);
                    setHexSignature(hex_signature.data.results.length > 0 && hex_signature.data.results[0].text_signature);
                    let contract = await getDaoViewerContract();
                    let users = doc.signatures.map((item) => item.userAddress);
                    let shared = await contract.getShare(address, users);
                    let quarom = shared.quorum;
                    let totalSupply = String(shared.totalSupply);
                    let share = String(shared.share);
                    setQuarom(quarom);
                    setTotalSupply(totalSupply);
                    setShare(share);

                    contract = await dao(address);
                    result = await contract.VOTING_DURATION();
                    const balanceOf = await contract.balanceOf(account);
                    if (String(balanceOf) > 0) {
                        setValidUser(true)
                    } else {
                        setValidUser(false)
                    }
                    if (doc.timestamp > 0) {
                        setMsg({ status: 'activated' })
                    } else {
                        if (dayjs().unix() - doc.createdAt < result) {
                            if (Math.round((share / totalSupply) * 100) >= quarom) {
                                setMsg({ status: 'activate' })
                            } else {
                                setMsg({ status: 'sign' })
                            }
                        } else {
                            setMsg({ status: 'over' })
                        }
                    }

                    setLoading(false);
                    setShow(false);
                }
            } catch (error) {
                Toastify('error', error.message);
            }
        })
    }
    const signTransaction = () => {
        if (!library) return;

        const { txHash, id } = trans;
        const q = query(collection(db, 'Voting'), where('txHash', '==', txhash));
        getDocs(q).then(async (querySnapshot) => {
            let doc = querySnapshot.docs.map(doc => ({ ...doc.data() }));
            doc = doc[0];
            if (!doc) return
            let user = doc.signatures.filter(item => item.userAddress === account.toLowerCase());
            if (user && user.length > 0) {
                // alert('Already Signed!')
                Toastify('info', 'Already Signed!')
                return
            };
            try {
                setShow(true)
                const signature = await library.provider.request({
                    method: "personal_sign",
                    params: [txHash, account]
                })
                user = {
                    signature: signature,
                    userAddress: account
                }
                Toastify('info', 'Sign Voting!');
                await axios.post(`/sign/voting/${id}`, user);
                Toastify('info', 'Voting Signed!');
            } catch (error) {
                setShow(false)
                Toastify('error', error.message);
            }
        }).catch(error => {
            setShow(false)
            Toastify('error', error.message);
        })
    }
    const activateTransaction = async () => {
        try {
            setShow(true)
            const { data, value, nonce, signatures, daoAddress, target, createdAt, txHash } = trans;
            const contract = await dao(daoAddress);
            let sigs = signatures.map(item => hexlify(item.signature));
            let v = ethers.utils.parseEther(value || "0");
            let result = await contract.execute(target, data, v, nonce, createdAt, sigs);
            Toastify('info', 'Activating Voting');
            await result.wait();
            Toastify('info', 'Voting Activated');
            let body = {
                txHash,
                timestamp: dayjs().unix(),
                daoAddress
            }
            result = await axios.post('/update/voting', body);
            navigate(`/dao/${address}`)
        } catch (error) {
            setShow(false)
            if (error && error.data) {
                Toastify('error', error.data.message)
            } else {
                Toastify('error', error.message);
            }
        }
    }
    return (
        <>
            {
                !active ? <div className='mx-auto mt-5' style={{ maxWidth: '300px' }}>
                    <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                </div> : <>
                    {
                        (loading || !trans) ? <span className='text-white'>Loading...</span> : <Container className='my-3 text-white'>
                            <Row>
                                <Col xs={8} className="mx-auto">
                                    <Container>
                                        <h3 style={{ overflowWrap: 'break-word' }}>
                                            {trans && trans.title}
                                        </h3>
                                        <div>
                                            <span className='text-muted'>Status: </span>
                                            {msg.status === 'sign' && <button className='dao-warning-btn'>IN PROGRESS</button>}
                                            {
                                                msg.status === 'activate' && <button className='outline-success'>READY TO ACTIVATE</button>
                                            }
                                            {msg.status === 'over' && <button className='outline-danger'>VOTING IS OVER</button>}
                                            {
                                                msg.status === 'activated' && <button
                                                    className='dao-btn p-0 px-2'
                                                    style={{ fontSize: '12px', borderRadius: 0 }}>
                                                    ACTIVATED
                                                </button>
                                            }
                                        </div>
                                        <hr />
                                    </Container>
                                    <Container>
                                        <div className='d-flex'>
                                            <div className='me-3'>
                                                <HiMenuAlt2 />
                                            </div>
                                            <div>
                                                <h5>Description</h5>
                                                <p className='text-muted'>
                                                    {trans && trans.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Container>
                                    <Container>
                                        <div className='d-flex'>
                                            <div className='me-3'>
                                                <BsClockFill />
                                            </div>
                                            <div>
                                                <h5>Created</h5>
                                                <p className='text-muted'>
                                                    {moment(trans.createdAt * 1000).format("hh:mm | MMMM DD,YYYY")}
                                                </p>
                                            </div>
                                        </div>
                                    </Container>
                                    <Container>
                                        <div className='d-flex'>
                                            <div className='me-3'>
                                                <BsFillCheckCircleFill />
                                            </div>
                                            <div>
                                                <h5>Signatures</h5>
                                                {
                                                    msg.status === 'activated' && <p>
                                                        <span>Quorum: </span><span className='text-success'>
                                                            {Math.round((share / totalSupply) * 100)}%/{quarom}%
                                                        </span>
                                                    </p>
                                                }
                                                {
                                                    trans && trans.signatures.map((signature, index) => (
                                                        <p key={index}>
                                                            <small>{truncateAddress(signature.userAddress)}</small>
                                                        </p>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </Container>
                                    <Container>
                                        <Row >
                                            <Col className='my-3'>
                                                Target:
                                            </Col>
                                            <Col className="text-right my-3">
                                                {truncateAddress(trans.target)}{' '}
                                                <ClipBoard address={trans.target} />
                                            </Col>
                                        </Row>
                                        <Row >
                                            <Col className='my-3'>
                                                Value:
                                            </Col>
                                            <Col className="text-right my-3" style={{ overflowWrap: 'break-word' }}>
                                                {trans.value}
                                            </Col>
                                        </Row>
                                        <Row >
                                            <Col className='col-12 col-md-4 my-3'>
                                                data
                                            </Col>
                                            <Col className='col-12 col-md-8 my-3' >
                                                <div className='form-control disabled' style={{ overflowY: 'scroll', height: '200px', overflowWrap: 'break-word' }}>
                                                    <p><span>Function: {hexSignature}</span></p>
                                                    <p>{trans.data}</p>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Container>
                                    {
                                        validUser && <Container className='text-center'>
                                            {
                                                msg.status === 'over' && <button
                                                    className='outline-danger '
                                                    style={{ padding: '10px 20px', fontSize: 'inherit', borderRadius: '5px' }}>
                                                    Voting Is Over</button>
                                            }
                                            {
                                                msg.status === 'sign' && <button
                                                    className='dao-btn'
                                                    onClick={signTransaction}
                                                    disabled={show}
                                                >
                                                    {
                                                        show ? <Spinner animation="border" variant="info" /> : <><HiFingerPrint className='icon' />Sign Voting</>
                                                    }

                                                </button>
                                            }
                                            {
                                                msg.status === 'activate' && <button
                                                    className='outline-success outline-success-hover'
                                                    style={{ padding: '10px 20px', fontSize: 'inherit', borderRadius: '5px' }}
                                                    onClick={activateTransaction}
                                                    disabled={show} >
                                                    {
                                                        show ? <Spinner animation="border" variant="info" /> : <><HiFingerPrint className='icon' />Activate Voting</>
                                                    }
                                                </button>
                                            }
                                        </Container>
                                    }
                                </Col>
                            </Row>
                        </Container>
                    }
                </>
            }   </>

    )
}

export default SignTransaction;