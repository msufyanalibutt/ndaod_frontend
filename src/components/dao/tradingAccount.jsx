import { useWeb3React } from '@web3-react/core';
import api from '../../utils/api';
import { ethers } from 'ethers';
import  { useState } from 'react';
import { useEffect } from 'react';
import { Col, Row } from 'react-bootstrap';
import { HiUserAdd } from 'react-icons/hi';
import { BiTransferAlt } from 'react-icons/bi';
import { GiJoint } from 'react-icons/gi';
import { NavLink, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import {  truncateAddress } from '../../utils';
import ClipBoard from '../clipboard';
import Toastify from '../toast';
import axois from '../../utils/api';
import { networks } from '../../utils/networks';
const TradingAccount = ({ address, chainId, daoAddress, owner }) => {
    const { account, library } = useWeb3React();
    const navigate = useNavigate();
    const { getShopTAccountContract, dao } = WALLETCONTEXT();
    const [name, setName] = useState(null);
    const [members, setMembers] = useState(0);
    useEffect(() => {
        getInfo();
        getMembers()
    }, [chainId])
    const getInfo = async () => {
        try {
            const contract = await getShopTAccountContract(address);
            const name = await contract.name();
            setName(name)
        } catch (error) {
        }
    }
    const getMembers = async () => {
        const url = `/${chainId}/tokens/${address}/token_holders`;
        try {
            const result = await api.post('/covalent/api',{url});
            let items = result.data.data.items;
            setMembers(items.length)
        } catch (error) {
        }
    }
    const handleFormSubmit = async () => {
        if (!library) return;
        try {
            const contract = await dao(daoAddress);
            let timestamp = dayjs().unix();
            let iface = createForIface(address)
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
            if (!owner) {
                Toastify('error', 'Request failed with status code 400');
                return;
            }
            let body = {
                signature,
                data: iface,
                hex_signature: String(iface).slice(0, 10),
                daoAddress: daoAddress,
                target: address,
                title: `Remove Trader ${address}`,
                description: '',
                chainId,
                value: 0,
                nonce: 0,
                createdAt: timestamp,
                timestamp: 0,
                txHash,
                creator: account
            }
            await axois.post('/create/voting', body);
            navigate(`/dao/${address}/votingPage/${txHash}`);
        } catch (error) {
            Toastify('error', error.message);
        }
    }
    const createForIface = (to) => {
        let ABI = ["function burn(address _to)"];
        let iface = new ethers.utils.Interface(ABI);
        iface = iface.encodeFunctionData("burn", [to]);
        return iface
    }
    const UserPermission = () => {
        let result = window.confirm("Are you sure?");
        if (result) {
            handleFormSubmit()
        }
    }
    return (
        <>
            <Row className='d-flex align-items-center'>
                <Col className="mb-3 text-white ">
                    <NavLink className='text-white' to={`/tradingAccount/${daoAddress}/${address}/${name}`}>
                        <span>{truncateAddress(address)} </span>
                    </NavLink><ClipBoard address={address} />
                </Col>
                <Col className="mb-3 text-white text-center">
                    <span>{name}</span>
                </Col>
                <Col className="mb-3 text-white text-center">
                    <span>{members}</span>
                </Col>
                <Col className="mb-3 text-white">
                    {
                        owner && <NavLink to={`/addMembertoTa/${daoAddress}?TA=${address}`}
                            className="dao-btn d-inline-block text-center px-2 py-1 me-2"
                            style={{ fontSize: '100%' }}
                        >
                            <HiUserAdd />
                        </NavLink>
                    }
                    {
                        owner &&
                        <NavLink className="dao-btn px-1 py-1 me-2 d-inline-block" to={`/sendCoin/${daoAddress}/?TA=${address}`}>
                            <img
                                src={networks[chainId].iconUrls}
                                style={{ width: "25px" }}
                                alt="matic_icon"
                            />
                        </NavLink>
                    }
                    {
                        owner &&
                        <NavLink className={`dao-btn px-2 py-1 me-2`} to={`/sendToken/${daoAddress}/?TA=${address}`}>
                            <BiTransferAlt />
                        </NavLink>
                    }
                </Col>
            </Row>
        </>
    )
}

export default TradingAccount;