import React, { useEffect, useState } from 'react';
import { WALLETCONTEXT } from '../../contexts/walletContext';
import { truncateAddress } from '../../utils';
import { NavLink } from 'react-router-dom';
import { ethers } from 'ethers';
import Clipboard from '../clipboard';
const Index = ({ address, bgColor, name, account }) => {
    const { dao, getCustomContract } = WALLETCONTEXT();
    const [totalSupply, setTotalSupply] = useState(0);
    const [balanceOf, setBalanceOf] = useState(0);
    const [lpAddress, setLpAddress] = useState(null)
    const [lpBalance, setLpBalance] = useState(0)
    useEffect(() => {
        if (address) {
            getDao(address);
        }
    }, [address]);

    const getDao = async () => {
        try {
            if (!(ethers.constants.AddressZero === address)) {
                const contract = await dao(address);
                const totalSupply = await contract.totalSupply();
                setTotalSupply(String(totalSupply));
                const balanceOf = await contract.balanceOf(account);
                setBalanceOf(String(balanceOf));
                const lpAddress = await contract.lp();
                if (!(ethers.constants.AddressZero === lpAddress)) {
                    let lpContract = await getCustomContract(lpAddress);
                    let decimals = await lpContract.decimals();
                    let lpBalance = await lpContract.balanceOf(account);
                    setLpAddress(String(lpAddress))
                    setLpBalance(String(lpBalance) / Math.pow(10, decimals));
                }

            }
        } catch (error) {
        }
    }
    return (
        <>
            {
                (Number(lpBalance) === 0 && Number(balanceOf) === 0) ? '' : <>
                    <td className='text-white bg-transparent'>
                        <div className='d-flex justify-content-start align-items-center'>
                            <div className='circle m-0 me-3 ' style={{ width: '30px', height: '30px', background: bgColor }}>
                            </div>
                            <div>
                                <NavLink className='m-0 p-0 dao-address' to={`/dao/${address}`}>{name}</NavLink>
                                <p className='m-0 p-0'>{truncateAddress(address)} <Clipboard address={address} /></p>

                            </div>
                        </div>
                    </td>
                    <td className='text-center text-white bg-transparent'>
                        <span>
                            {
                                new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, notation: "compact", compactDisplay: "short" }).format(balanceOf)
                            }
                        </span>{' '}
                        <span>{balanceOf === 0 ? 0 : Math.round((balanceOf / totalSupply) * 100)}%</span>
                    </td>
                    <td className='text-center text-white bg-transparent'>
                        {!lpAddress ?
                            <span>-</span> :
                            <span>{new Intl.NumberFormat('en-US', { maximumFractionDigits: 4, notation: "compact", compactDisplay: "short" }).format(lpBalance)}</span>}
                    </td>
                </>
            }
        </>
    )
}

export default Index;