import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { Modal, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toHex } from '../../utils';
import { networks } from '../../utils/networks';

const Networks = () => {
    const [show, setShow] = useState(false);
    const [selected, setSelected] = useState(null);
    const { active, account, chainId } = useWeb3React();
    const [items, setItems] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        const res = Object.entries(networks).map(item => Number(item[0]));
        setItems(res);
    }, [])
    useEffect(() => {
        const cId = window.localStorage.getItem("chainId");
        if (cId) setSelected(cId);
    }, []);
    useEffect(() => {
        if (active && chainId) {
            setSelected(chainId);
        }
    }, [active, chainId])
    const handleClose = () => {
        setShow(false);
    };
    const {
        library
    } = useWeb3React();
    const handleShow = () => setShow(true);
    const handleSwitch = async (network) => {
        let response = await switchNetwork(network);
        if (response) {
            setSelected(network);
            window.localStorage.setItem("chainId", network);
        }
        setShow(false);
    }
    const switchNetwork = async (item) => {
        const network = networks[item];
        try {
            await library.provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: toHex(network.chainId) }]
            });
            navigate('/');
            return true;
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await library.provider.request({
                        method: "wallet_addEthereumChain",
                        params: [toHex(network.chainId)]
                    });
                    navigate('/');
                    return true;
                } catch (error) {
                    return false;
                }
            }
        }
    }
    return (
        <>
            {
                (active && account) && <>
                    {
                        selected && <button className='custom-btn px-3 py-2 justify-content-start' onClick={handleShow}>
                            <div className={`custom-btn-img me-2 `}>
                                <img className='img-fluid rounded-circle' src={networks[selected].iconUrls[0]} alt={networks[selected].nativeCurrency.name} />
                            </div>
                            {
                                networks[selected].nativeCurrency.name
                            }
                        </button>
                    }
                    <Modal size="lg" show={show} onHide={handleClose}>
                        <Modal.Body>
                            <Row xs={1} md={3}>
                                {
                                    items.map((network, index) => (
                                        <Col key={index}>
                                            <button
                                                onClick={() => handleSwitch(network)}
                                                className={`custom-btn py-2 px-3 justify-content-start ${selected === network && 'selected'}`}>
                                                <div className={`custom-btn-img me-2 `}>
                                                    <img className='img-fluid rounded-circle' src={networks[network].iconUrls[0]} alt={networks[network].nativeCurrency.name} />
                                                </div>
                                                {networks[network].nativeCurrency.name}
                                            </button>
                                        </Col>
                                    ))
                                }
                            </Row>
                        </Modal.Body>
                    </Modal>
                </>
            }
        </>
    )
}
export default Networks;