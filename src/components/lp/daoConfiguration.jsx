import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { HiLockOpen, HiLockClosed } from 'react-icons/hi';
import { AiOutlineExclamationCircle } from 'react-icons/ai';
import PermittedList from '../dao/permittedList';

const DaoConfiguration = (daoConfig) => {
    return (
        <>
            <Row xs={1} sm={1} md={1}>

                <Col className="mb-3">
                    <div className='text-white p-3 mb-3 tabborder '>
                        <Row>
                            <Col>
                                <h5>Configuration</h5>
                            </Col>
                            <Col className='text-right'>
                                <AiOutlineExclamationCircle />
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <h6>GT Minting</h6>
                            </Col>
                            <Col className='text-right d-flex justify-content-end align-items-center'>
                                <span className={`px-2 me-2 ${daoConfig.gtMintable ? 'outline-success' : 'outline-danger'}`}>
                                    {
                                        daoConfig.gtMintable ? 'Enabled' : 'Closed'
                                    }
                                </span>
                                <span className={`${daoConfig.gtMintable ? 'text-primary' : 'text-danger'}`} style={{ fontSize: '12px' }}>
                                    {
                                        daoConfig.gtMintable ? <HiLockOpen /> : <HiLockClosed />
                                    }
                                </span>
                            </Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col>
                                <h6>GT Burning</h6>
                            </Col>
                            <Col className='text-right d-flex justify-content-end align-items-center'>
                                <span className={`px-2 me-2 ${daoConfig.gtBurnable ? 'outline-success' : 'outline-danger'}`} >
                                    {
                                        daoConfig.gtBurnable ? 'Enabled' : 'Closed'
                                    }
                                </span>
                                <span className={`${daoConfig.gtBurnable ? 'text-primary' : 'text-danger'}`} style={{ fontSize: '12px' }}>
                                    {
                                        daoConfig.gtBurnable ? <HiLockOpen /> : <HiLockClosed />
                                    }
                                </span>
                            </Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col>
                                <h6>LP Minting</h6>
                            </Col>
                            <Col className='text-right d-flex justify-content-end align-items-center'>
                                {
                                    daoConfig.lpAddress ? <>
                                        <span className={`px-2 me-2 ${daoConfig.lpMintable ? 'outline-success' : 'outline-danger'}`} >
                                            {
                                                daoConfig.lpMintable ? 'Enabled' : 'Closed'
                                            }
                                        </span>
                                        <span className={`${daoConfig.lpMintable ? 'text-primary' : 'text-danger'}`} style={{ fontSize: '12px' }}>
                                            {
                                                daoConfig.lpMintable ? <HiLockOpen /> : <HiLockClosed />
                                            }
                                        </span>
                                    </> : '-'
                                }
                            </Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col>
                                <h6>LP Burning</h6>
                            </Col>
                            <Col className='text-right d-flex justify-content-end align-items-center'>
                                {
                                    daoConfig.lpAddress ? <>
                                        <span className={`px-2 me-2 ${daoConfig.lpBurnable ? 'outline-success' : 'outline-danger'}`} >
                                            {
                                                daoConfig.lpBurnable ? 'Enabled' : 'Closed'
                                            }
                                        </span>

                                        <span className={`${daoConfig.lpBurnable ? 'text-primary' : 'text-danger'}`} style={{ fontSize: '12px' }}>
                                            {
                                                daoConfig.lpBurnable ? <HiLockOpen /> : <HiLockClosed />
                                            }
                                        </span>
                                    </> : '-'
                                }
                            </Col>
                        </Row>
                    </div>
                    <PermittedList {...daoConfig} />
                </Col>
            </Row>
        </>
    )
}

export default DaoConfiguration;