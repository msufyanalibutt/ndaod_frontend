import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';
import { ethers } from 'ethers';
import { truncateAddress } from '../utils';
import { networks } from '../utils/networks';
import { ImNewTab } from 'react-icons/im';
const Transactions = ({ chainId, address, covalent, account }) => {
    const [transactions, setTransactions] = useState([])
    useEffect(() => {
        getTransactions()
    }, [chainId])
    const getTransactions = async () => {
        const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/transactions_v2/?key=${covalent}`
        try {
            const result = await axios.get(url);
            setTransactions(result.data.data.items);
        } catch (error) {
        }
    }
    return (
        <>
            <Row>
                <Col>
                    <h4 className='text-white'>Transaction History</h4>
                </Col>
                <Col className='text-right mb-3'>
                    <a href={`${networks[chainId].blockExplorerUrls}/address/${account}`} target={"_blank"} className='dao-btn p-2 d-flex justify-content-center ms-auto' style={{ maxWidth: '150px' }}>
                        <img
                            style={{ maxWidth: '25px' }}
                            className='img-fluid rounded-circle'
                            src={networks[chainId].iconUrls[0]}
                            alt={networks[chainId].nativeCurrency.name} />
                        &nbsp;
                        {networks[chainId].nativeCurrency.name}
                    </a>
                </Col>
            </Row>
            <Row>
                <Col>
                    TXHASH
                </Col>
                <Col>
                    DATE
                </Col>
                <Col>
                    TIME
                </Col>
                <Col>
                    GAS FEE
                </Col>
            </Row>
            {
                (transactions && transactions.length > 0) ? <>
                    {
                        transactions.map((transaction, index) => (
                            <Row key={index}>
                                <Col className='py-3' >
                                    <a
                                        rel="noopener noreferrer"
                                        href={`${networks[chainId].blockExplorerUrls}/tx/${transaction.tx_hash}`}
                                        target="_blank" className='text-white'>
                                        {truncateAddress(transaction.tx_hash)}

                                    </a>
                                    &nbsp;
                                    <ImNewTab />
                                </Col>
                                <Col className='py-3'>
                                    {moment(transaction.block_signed_at).format("ddd,DD MMM YYYY")}
                                </Col>
                                <Col className='py-3'>
                                    {moment(transaction.block_signed_at).format("hh:mm")}
                                </Col>
                                <Col className='py-3'>
                                    {Number(ethers.utils.formatEther(transaction.fees_paid)).toFixed(2)}
                                </Col>

                            </Row>
                        ))
                    }
                </> : <div className='text-white py-4 text-center'>You don't have any transaction</div>
            }
        </>
    )
}

export default Transactions;