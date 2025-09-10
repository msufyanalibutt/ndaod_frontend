import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Modal, FormControl } from 'react-bootstrap';
import axios from 'axios';
import UserFetch from '../../hook/useFetch';
import { IoMdClose } from 'react-icons/io';
import { SIDESHIFTCONTEXT } from '../../contexts/sideShift';
const GetImage = ({ url, newStyle }) => {
    const image = UserFetch({ url })

    return (
        <div className='coin-inner mx-auto' style={newStyle} dangerouslySetInnerHTML={{ __html: image }}>
        </div>
    )
}
const BuyShift = ({setFieldValue}) => {
    const {
        coins,
        setCoins,
        buyCoin,
        setBuyCoin,
        tempCoins 
    } = SIDESHIFTCONTEXT();
    useEffect(() => {
        if (buyCoin) {
            updateFormValues();
        }
    }, [buyCoin]);
    const updateFormValues = ()=>{
        setFieldValue('settleCoin',buyCoin.coin);
        setFieldValue('settleNetwork',buyCoin.network)
    }
    const [show, setShow] = useState(false);
    const handleClose = () => {
        setShow(false);
        setCoins(tempCoins)
    };
    const handleShow = () => setShow(true);
    const HandleSelectedCoin = (item) => {
        setBuyCoin(item)
        handleClose();
    }
    const handleSearch = (value) => {
        if (value) {
            let result = tempCoins.filter(item => {
                if (String(item.coin).toLowerCase().includes(String(value).toLowerCase())) {
                    return true
                } else {
                    return false
                }
            })
            if (result.length > 0) {
                setCoins(result);
            } else {
                setCoins(coins)
            }
        }
    }
    return <>
        <div className='tabborder w-100 text-center p-3 pointer d-flex flex-column' onClick={handleShow}>
            <h6>Settle Network</h6>
            <GetImage
                url={`https://sideshift.ai/api/v2/coins/icon/${buyCoin.name}-${buyCoin.network}`}
                newStyle={{ maxWidth: '50%', width: '100%', margin: "0px auto 10px auto" }}
            />
            <div>{buyCoin.name}</div>
            <div className="text-uppercase text-muted mb-2">
                <small>{buyCoin.coin}</small>
            </div>
            <div
                className="text-uppercase d-inline-block py-1 px-2"
                style={{ border: '2px solid white', minWidth: '100px' }}>{buyCoin.network}
            </div>
        </div>

        <Modal show={show} fullscreen={true} onHide={handleClose}>
            <Modal.Body>
                <Row>
                    <Col className='text-right'>
                        <IoMdClose className='pointer' size="30px" onClick={handleClose} />
                    </Col>
                </Row>
                <h3 className='text-center'>You Receive</h3>
                <Row className='mb-3'>
                    <Col xs={12} md={6} xl={4} className='mx-auto'>
                        <FormControl
                            name='search'
                            placeholder='search'
                            className='text-center'
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </Col>
                </Row>
                <Container>
                    <Row>
                        {
                            (coins && coins.length > 0) && coins.map((item) => (
                                item.networks.map((coin, index) => (
                                    <Col key={index} className="my-3 ">
                                        <div
                                            className={`text-center py-3 ecosystem ${`${item.name}-${coin}` === `${buyCoin.name}-${buyCoin.network}` && 'selectedecosystem'}`}
                                            style={{ outline: 'none' }}
                                            onClick={
                                                () => HandleSelectedCoin({
                                                    coin: item.coin,
                                                    network: coin,
                                                    name: item.name
                                                })}
                                        >
                                            <GetImage
                                                url={`https://sideshift.ai/api/v2/coins/icon/${item.coin}-${coin}`}
                                                newStyle={{ width: '200px', maxWidth: '40%', marginBottom: '10px' }}
                                            />
                                            <div>{item.name}</div>
                                            <div className="text-uppercase text-muted mb-2">
                                                <small>{item.coin}</small>
                                            </div>
                                            <div
                                                className="text-uppercase d-inline-block py-1 px-2"
                                                style={{ border: '2px solid white', minWidth: '100px' }}>{coin}
                                            </div>
                                        </div>
                                    </Col>
                                ))
                            ))
                        }
                    </Row>
                </Container>
            </Modal.Body>
        </Modal>
    </>
}
export default BuyShift;