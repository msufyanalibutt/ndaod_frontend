import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Placeholder } from 'react-bootstrap';
import { RiDeleteBinLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import { truncateAddress } from '../../utils';
import ClipBoard from '../clipboard';
import Toastify from '../toast';
import * as randomColor from 'randomcolor';
const Index = ({ daoAddress }) => {
    const navigate = useNavigate();
    const { dao } = WALLETCONTEXT();
    const [loading, setLoading] = useState(false);
    const [permittedList, setPermittedList] = useState([]);
    const [adapterList, setAdapterList] = useState([]);

    useEffect(() => {
        if(daoAddress){
            getPermittedList();
        }
    }, [daoAddress]);
    const getPermittedList = async () => {
        try {
            setLoading(true);
            const contract = await dao(daoAddress);
            const result = await contract.getPermitted();
            setPermittedList(result);
            const adapters = await contract.getAdapters();
            setAdapterList(adapters);
            setLoading(false);
        } catch (error) {
            Toastify('error', error.message);
            setLoading(false);
        }
    }
    const addPermitted = () => {
        navigate(`/addPermitted/${daoAddress}`);
    }
    const deletePermitted = (item) => {
        navigate(`/removePermitted/${daoAddress}?targetAddress=${item}`);
    }
    const deleteAdapter = (item) => {
        navigate(`/removeAdapter/${daoAddress}?targetAddress=${item}`);
    }
    return (
        <>
            {
                !loading ? <>
                    <div className='tabborder px-3 py-3'>
                        <Row className='mb-3'>
                            <Col className='text-white'>
                                <span>Permitted List</span>
                            </Col>
                            <Col className='text-right'>
                                <button className='dao-btn px-2 py-1' onClick={addPermitted}>Add Permitted</button>
                            </Col>
                        </Row>
                        {
                            (permittedList && permittedList.length > 0) ? <>

                                {
                                    permittedList.map((item, index) => (
                                        <Row key={index}>
                                            <Col className='d-flex align-items-center text-white mb-3'>
                                                <div className='profile' style={{ marginRight: '10px', width: '30px', height: '30px',backgroundColor:randomColor() }}>
                                                </div>
                                                <span className='text-muted me-2'>{truncateAddress(item)}</span>
                                                <ClipBoard address={item} />
                                            </Col>
                                            <Col className='text-right mb-3'>
                                                <Button variant='outline-danger' size="sm" onClick={() => deletePermitted(item)}>
                                                    <RiDeleteBinLine size={'20px'} />
                                                </Button>
                                            </Col>
                                        </Row>))
                                }
                            </> : <>
                                <div className="text-white py-5 text-center">
                                    DAO doesn't have Permitted Addresses
                                </div>
                            </>
                        }
                    </div>
                    {
                        (adapterList && adapterList.length > 0) ? <div className='tabborder px-3 py-3 my-3'>
                            <Row className='mb-3'>
                                <Col className='text-white'>
                                    <span>Adapter List</span>
                                </Col>
                            </Row>
                            {
                                adapterList.map((item, index) => (
                                    <Row key={index}>
                                        <Col className='d-flex align-items-center text-white mb-3'>
                                            <div className='profile' style={{ marginRight: '10px', width: '30px', height: '30px',backgroundColor:randomColor() }}>
                                            </div>
                                            <span className='text-muted me-2'>{truncateAddress(item)}</span>
                                            <ClipBoard address={item} />
                                        </Col>
                                        <Col className='text-right mb-3'>
                                            <Button variant='outline-danger' size="sm" onClick={() => deleteAdapter(item)}>
                                                <RiDeleteBinLine size={'20px'} />
                                            </Button>
                                        </Col>
                                    </Row>
                                ))
                            }
                        </div> : ""
                    }

                </> : <Placeholder as="p" animation="glow" >
                    <Placeholder xs={12} className="connect-placeholder" />
                </Placeholder>
            }
        </>
    )
}
export default Index;