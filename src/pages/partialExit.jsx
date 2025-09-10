import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Spinner } from 'react-bootstrap';
import randomColor from 'randomcolor';
import dayjs from 'dayjs';
import { useWeb3React } from '@web3-react/core';
import axois from '../utils/api';
import { WALLETCONTEXT } from '../contexts/walletContext';
import { PartialExitModule_contract_address, truncateAddress } from '../utils';
import Toastify from '../components/toast';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import ConnectWallet from '../components/sidebar/connectWallet';
import { HiLockOpen } from 'react-icons/hi';
import { ImCross } from 'react-icons/im';


const CheckPermitted = ({ address }) => {
    const { dao } = WALLETCONTEXT();
    const [permitted, setPermitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const { library, account, chainId } = useWeb3React();
    const navigate = useNavigate();
    useEffect(() => {
        getPermitted();
    }, []);
    const getPermitted = async () => {
        try {
            const contract = await dao(address);
            const permitted = await contract.containsPermitted(PartialExitModule_contract_address[chainId]);
            setPermitted(permitted);
        } catch (error) {
        }
    }
    const InstallPermittedDao = async () => {
        try {
            setLoading(true)
            const contract = await dao(address);
            let timestamp = dayjs().unix();
            let iface = createForIface(PartialExitModule_contract_address[chainId])
            const txHash = await contract.getTxHash(
                address,
                iface,
                0,
                0,
                timestamp
            )
            const signature = await library.provider.request({
                method: "personal_sign",
                params: [txHash, account]
            })
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: address,
                target: address,
                title: `Add Permitted: ${PartialExitModule_contract_address[chainId]}`,
                description: "",
                chainId,
                value: 0,
                nonce: 0,
                createdAt: timestamp,
                timestamp: 0,
                txHash,
                creator: account
            }
            await axois.post('/create/voting', body);
            setLoading(false)
            navigate(`/dao/${address}/votingPage/${txHash}`);

        } catch (error) {
            Toastify('error', error.message);
            setLoading(false)
        }
    }
    const createForIface = (p) => {
        let ABI = ["function addPermitted(address p)"];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("addPermitted", [p]);
        return iface
    }
    const navigatePrivateExit = () => {
        navigate(`/dao/${address}/modules/partialExit`);
    }
    return (
        <>
            {
                permitted ?
                    <button className='dao-btn px-1 py-1' onClick={navigatePrivateExit}>Open</button> :
                    <button className='dao-btn px-1 py-1' onClick={InstallPermittedDao}>
                        {
                            loading ? <Spinner size="sm" animation="border" variant="primary" className='mx-2' /> : 'Install'
                        }
                    </button>
            }
        </>
    )
}
const PartialExit = () => {
    const [show, setShow] = useState(false);
    const [daos, setDaos] = useState([]);
    const { active, account } = useWeb3React();
    const { daoList } = WALLETCONTEXT();
    useEffect(() => {
        if (active) {
            getDaoList();
        }
    }, [active]);
    const getDaoList = async () => {
        try {
            const list = await daoList(account);
            setDaos(list)
        } catch (error) {
            Toastify('error', error.message);
        }
    }
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <div className='tabborder text-center px-3 py-3'>
                <img src="/images/privateExit.webp" alt="avatar1" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <h5>Partial Exit</h5>
                <p>Get a partial offer burning LP for exit from DAO</p>
                <button
                    onClick={handleShow}
                    type="button"
                    className='dao-btn px-2 py-1'>
                    Go To Module
                </button>
            </div>
            <Modal show={show} onHide={handleClose}>
                <Modal.Body>
                    <Row>
                        <Col>
                            <div className='d-flex align-items-center text-white mb-3'>
                                <div className='profile' style={{ marginRight: '10px', width: '30px', height: '30px' }}>
                                </div>
                                <p className='p-0 m-0' style={{ fontSize: '20px' }}>Partial Exit</p>
                            </div>
                        </Col>
                        <Col className="text-right">
                            <span className='pointer' onClick={handleClose}>
                                <ImCross />
                            </span>
                        </Col>
                    </Row>
                    <p>Get a partial offer burning LP for exit from DAO</p>
                    <hr />
                    {
                        active ? <div>
                            <h5 className='text-center'>Choose Your DAO</h5>
                            {
                                daos.map((dao, index) => (
                                    ethers.constants.AddressZero !== dao.dao && <Row key={index}>
                                        <Col className='d-flex align-items-center text-white'>
                                            <div className='profile' style={{ marginRight: '10px', width: '30px', height: '30px', background: randomColor() }}>
                                            </div>
                                            <div>
                                                <p className='p-o m-0'>{dao.daoName}</p>
                                                <span className='text-muted me-2'>{truncateAddress(dao.dao)}</span>
                                            </div>
                                        </Col>
                                        <Col className='text-right'>
                                            <CheckPermitted address={dao.dao} />
                                        </Col>
                                    </Row>
                                ))
                            }
                        </div> : <div className='text-center my-3 mx-auto' style={{ maxWidth: '300px' }}>
                            <ConnectWallet icon={<HiLockOpen className='ndaod-button-icon' />} text={'Connect Wallet'} />
                        </div>
                    }

                </Modal.Body>
            </Modal>
        </>
    )
}

export default PartialExit;