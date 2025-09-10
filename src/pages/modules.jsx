import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import PrivateExit from './privateExit';
import PartialExit from './partialExit';
// import TradingModule from './TradingModule';
const Modules = () => {
    return (
        <>
            <Container className='py-3'>
                <Row>
                    <Col xs={12} xl={8} className="mx-auto text-white">
                        <h1>DAO Modules</h1>
                        <p>Upgrade your DAO using modules. Modules can execute any algorithm embedded in it</p>
                    </Col>
                </Row>
            </Container>
            <Container className='py-3'>
                <Row>
                    <Col xs={12} xl={8} className="mx-auto text-white">
                        <Row xs={1} md={3}>
                            <Col className='mb-3'>
                                <PrivateExit />
                            </Col>
                            <Col className='mb-3'>
                                <PartialExit />
                            </Col>
                            {/* <Col className='mb-3'>
                                <TradingModule />
                            </Col> */}
                            <Col className='mb-3'>
                                <div className='tabborder text-center px-3 py-3'>
                                    <img src="/images/dividend.webp" alt="avatar2" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <h5>Dividends</h5>
                                    <p>Pay dividends by distributing tokens from DAO account</p>
                                    <button className='dao-btn px-2 py-1'>Go To Module</button>
                                </div>
                            </Col>
                            <Col className='mb-3'>
                                <div className='tabborder text-center px-3 py-3'>
                                    <img src="/images/launchpad.webp" alt="avatar3" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <h5>Launchpad</h5>
                                    <p>Start Token Sale of LP tokens of your DAO</p>
                                    <button className='dao-btn px-2 py-1'>Go To Module</button>
                                </div>
                            </Col>
                            <Col className='mb-3'>
                                <div className='tabborder text-center px-3 py-3'>
                                    <img src="/images/payroll.webp" alt="avatar4" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <h5>Payroll</h5>
                                    <p>Pay salaries to employees or other regular payments</p>
                                    <button className='dao-btn px-2 py-1'>Go To Module</button>
                                </div>
                            </Col>
                            <Col className='mb-3'>
                                <div className='tabborder text-center px-3 py-3'>
                                    <img src="/images/documentSign.webp" alt="avatar5" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <h5>Document Sign</h5>
                                    <p>Create and sign your legal documents</p>
                                    <button className='dao-btn px-2 py-1'>Go To Module</button>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default Modules;