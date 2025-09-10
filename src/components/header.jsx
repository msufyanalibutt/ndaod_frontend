import React from 'react';
import { Row, Col, Form, FormControl, InputGroup } from 'react-bootstrap';
import { RiSearchLine } from 'react-icons/ri';
const Header = () => {
    return (
        <>
            <div className='header'>
                <Row className='py-3 m-0'>
                    <Col xl={4} className="ms-xl-auto">
                        <Form>
                            <InputGroup >
                                <InputGroup.Text id="basic-addon1">
                                    <RiSearchLine size={20} />
                                </InputGroup.Text>
                                <FormControl
                                    placeholder="Search account address/DAO name"
                                />
                            </InputGroup>
                        </Form>
                    </Col>
                </Row>
                <hr className='p-0 m-0' />
            </div>
        </>
    )
}

export default Header;