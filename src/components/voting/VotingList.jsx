import { ethers } from 'ethers';
import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { db } from '../../initFirebase';
import { query, collection, onSnapshot, where } from 'firebase/firestore';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import { calculateDate, truncateAddress } from '../../utils';
import dayjs from 'dayjs';
import { useWeb3React } from '@web3-react/core';
import loadash from 'lodash';
const VotingList = ({ address, name, activated, over, sign, create }) => {
    const { getDaoViewerContract, dao } = WALLETCONTEXT();
    const [votingList, setVotingList] = useState([]);
    const { active, chainId } = useWeb3React();
    const [show, setShow] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        if (active && chainId) {
            getVotingList()
        }
    }, [active, chainId,address]);
    const getVotingList = () => {
        if (!(ethers.constants.AddressZero === address)) {
            const q = query(collection(db, 'Voting'), where('daoAddress', '==', address.toLowerCase()));
            onSnapshot(q, async (querySnapshot) => {
                try {
                    let docs = querySnapshot.docs.map(doc => ({ ...doc.data() }));
                    docs = docs.filter((item) => item.chainId === chainId)
                    if (docs.length > 0) {
                        let items = [];
                        for (let doc of docs) {
                            let contract = await getDaoViewerContract();
                            let users = doc.signatures.map((item) => item.userAddress);
                            let shared = await contract.getShare(address, users);
                            let quarom = shared.quorum;
                            let totalSupply = String(shared.totalSupply);
                            let share = String(shared.share);
                            contract = await dao(address);
                            let voting_duration = await contract.VOTING_DURATION();
                            doc.duration = voting_duration;
                            doc.quarom = quarom;
                            doc.totalSupply = totalSupply;
                            doc.share = share;
                            doc.activated = false;
                            doc.active = false;
                            doc.sign = false;
                            doc.over = false;

                            if (doc.timestamp > 0) {
                                // setMsg({ status: 'activated' })
                                doc.activated = true;
                            } else {
                                if (dayjs().unix() - doc.createdAt < voting_duration) {
                                    if (Math.round((share / totalSupply) * 100) >= quarom) {
                                        // setMsg({ status: 'activate' })
                                        doc.active = true
                                    } else {
                                        // setMsg({ status: 'sign' })
                                        doc.sign = true;
                                    }
                                } else {
                                    // setMsg({ status: 'over' })
                                    doc.over = true;
                                }
                            }
                            items.push(doc);
                        }
                        items = items.filter((item) => {
                            if (item.activated && activated) {
                                return item;
                            }
                            if (item.active && active) {
                                return item;
                            }
                            if (item.over && over) {
                                return item;
                            }
                            if (item.sign && sign) {
                                return item;
                            }
                            return false;
                        })
                        items = loadash.orderBy(items, ['active','sign','activated','createdAt'], ['desc','desc','desc','desc']);
                        setVotingList(items);
                        if (items.length > 0) {
                            setShow(true)
                        }
                    }
                } catch (error) {
                }
            })
        }
    }
    const moveToSignature = (txHash) => {
        navigate(`/dao/${address}/votingPage/${txHash}`)
    }
    return (
        <>
            {
                show && <div className='myvoting text-white p-3 tabborder mb-3' >
                    {
                        create && <Row>
                            <Col>
                                <h4>My voting</h4>
                            </Col>
                            <Col >
                                <div className='text-right pt-3'>
                                    <NavLink to={`/votingList/${address}`} className='dao-btn text-center'>
                                        Create Voting
                                    </NavLink>
                                </div>
                            </Col>
                        </Row>
                    }
                    {
                        create && <div className='p3-4'>
                            <p className='mb-0 pb-0'>{name}</p>
                            {truncateAddress(address)}
                        </div>
                    }
                    {
                        votingList.map((voting, index) => (
                            <div className='voting-hover px-3 py-3 my-1' onClick={() => moveToSignature(voting.txHash)} key={index}>
                                <Row>
                                    <Col style={{ overflowWrap: 'break-word' }}>
                                        <p className='mb-0 pb-0'>{voting.title}</p>
                                        {voting.sign && <button className='dao-warning-btn'>IN PROGRESS</button>}
                                        {
                                            voting.active && <button className='outline-success'>READY TO ACTIVATE</button>
                                        }
                                        {voting.over && <button className='outline-danger'>VOTING IS OVER</button>}
                                        {
                                            voting.activated && <button
                                                className='dao-btn p-0 px-2'
                                                style={{ fontSize: '12px', borderRadius: 0 }}>
                                                ACTIVATED
                                            </button>
                                        }
                                    </Col>
                                    {
                                        !voting.over && <Col className='text-right'>
                                            <p className='p-0 m-0'><span>QUORUM: </span>
                                                <span>{Math.round((voting.share / voting.totalSupply) * 100)}%</span></p>
                                            {!voting.activated && <p>{calculateDate(voting.createdAt)}</p>}
                                        </Col>
                                    }
                                </Row>
                            </div>
                        ))
                    }
                </div>
            }
        </>
    )
}

export default VotingList;