import React, { useState, useEffect } from 'react';
import { AiOutlineRight } from 'react-icons/ai';
import { NavLink } from 'react-router-dom';
import { Row, Col, Placeholder } from 'react-bootstrap';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import * as randomColor from 'randomcolor';

const DaoList = () => {
    const [loading, setLoading] = useState(false);
    const [daoLists, setDaoLists] = useState([]);
    const { active, account, chainId } = useWeb3React();
    const { getUserDaos, daos, dao, getCustomContract } = WALLETCONTEXT();

    useEffect(() => {
        if (daos && daos.length > 0) {
            setLoading(true);
            setDaosList();
        }else{
            setLoading(false);
        }
    }, [daos]);
    useEffect(() => {
        if (active && account) {
            getDaos();
        }
    }, [account, chainId]);
    const getDaos = () => {
        setDaoLists([])
        setLoading(true);
        getUserDaos();
    }
    const setDaosList = async () => {
        let items = [];
        for (let item of daos) {
            try {
                let lpBalance = 0;
                let balanceOf = 0
                if (!(ethers.constants.AddressZero === item.dao)) {
                    const contract = await dao(item.dao);
                    balanceOf = await contract.balanceOf(account);
                    balanceOf = String(balanceOf);
                    const lpAddress = await contract.lp();
                    if (!(ethers.constants.AddressZero === lpAddress)) {
                        let lpContract = await getCustomContract(lpAddress);
                        lpBalance = await lpContract.balanceOf(account);
                        lpBalance = String(lpBalance);
                    }
                }
                if (Number(lpBalance) !== 0 || Number(balanceOf) !== 0) {
                    items.push({
                        dao: item.dao,
                        show: true,
                        name: String(item.daoName).toLowerCase()
                    })
                }

            } catch (error) {
                setLoading(false)
            }
        }
        setDaoLists(items);
        setLoading(false);
    }
    return (
        <>
            {
                active && <>
                    <h6>My DAOS</h6>
                    {
                        loading ? <Placeholder as="div" animation="glow" >
                            <Placeholder xs={12} style={{ backgroundColor: 'rgba(255, 255, 255, 0.16)', height: "20px" }} className="mb-3" />
                        </Placeholder> : <>
                            {
                                daoLists.length > 0 ? daoLists.map((item, index) => (
                                    <Row key={index} className="text-white">
                                        <Col xs={9} className='d-flex align-items-center mb-3'>
                                            <div className='profile me-2' style={{ width: '20px', height: '20px', background: randomColor() }}>
                                            </div>
                                            <NavLink to={`/dao/${item.dao}`} className='text-white' style={{ fontSize: '14px' }}>{item.name}</NavLink>
                                        </Col>
                                        <Col className="mb-3">
                                            <span><AiOutlineRight /></span>
                                        </Col>
                                    </Row>
                                )) : <>
                                    <span>You don't have DAO</span>
                                </>
                            }</>
                    }</>
            }
        </>
    )
}

export default DaoList;