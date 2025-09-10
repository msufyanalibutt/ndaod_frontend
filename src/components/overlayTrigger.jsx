import React, { useState } from 'react';
import { Row, Col, OverlayTrigger, Popover } from 'react-bootstrap';
import { MdEdit } from 'react-icons/md';
import { ImCross } from 'react-icons/im';
import { BsFillPersonPlusFill, BsFillPersonDashFill } from 'react-icons/bs';
import { NavLink } from 'react-router-dom';
import { truncateAddress } from '../utils';
const CustomOverlayTrigger = ({daoAddress,targetAddress}) => {
    const [show, setShow] = useState(false);
    const toggleHandler = () => {
        setShow(!show);
    }
    return (
        <OverlayTrigger
            trigger={"click"}
            key={'left'}
            placement={'left'}
            show={show}
            onToggle={toggleHandler}
            overlay={
                <Popover id={`popover-positioned-left`}>
                    <Popover.Body className='py-2'>
                        <div onClick={toggleHandler} className='text-right text-white' style={{ cursor: 'pointer' }}>
                            <ImCross />
                        </div>
                        <Row className='text-white font-weight-bold'>
                            <Col>
                                <h6 className='m-0 p-0'>
                                    <span>Change GT balance of</span>
                                </h6>
                                <p>{truncateAddress(targetAddress)}</p>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <NavLink
                                    to={`/mintGt/${daoAddress}?targetAddress=${targetAddress}`}
                                    style={{
                                        padding: '10px 30px', borderRadius: '5px', backgroundColor: 'palegreen', fontWeight: '600'
                                    }}
                                    className='outline-success outline-success-hover px-2 w-100 text-dark d-block'
                                >
                                    <BsFillPersonPlusFill className='icon' />Mint
                                </NavLink>
                            </Col>
                            <Col>
                                <NavLink
                                    to={`/burnGt/${daoAddress}?targetAddress=${targetAddress}`}
                                    className='dao-btn-danger px-2 w-100 d-block'
                                    style={{ fontSize: '12px', fontWeight: '600' }}>
                                    <BsFillPersonDashFill className="icon" />Burn
                                </NavLink>
                            </Col>
                        </Row>
                    </Popover.Body>
                </Popover>
            }
        >
            <button className='dao-btn px-2 py-1'>
                <MdEdit />
            </button>
        </OverlayTrigger>
    )
}

export default CustomOverlayTrigger;