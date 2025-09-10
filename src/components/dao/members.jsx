import React from 'react';
import { truncateAddress } from '../../utils';
import ClipBoard from '../clipboard';
import OverlayTriger from '../overlayTrigger';
import { NavLink } from 'react-router-dom';
const Members = ({ member, address, owner }) => {

    return (
        <>
            <td className='bg-transparent'>
                <NavLink className={'text-white'} to={`/profile/${member.address}`}>{truncateAddress(member.address)}</NavLink> 
                <ClipBoard address={member.address} />
            </td>
            <td className='text-right bg-transparent'>
                <span className='me-2'>
                    {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, notation: "compact", compactDisplay: "short" }).format(member.balance)}
                </span>
                <span className='me-2'>
                    {
                        Math.round((Number(member.balance) / member.total_supply) * 100)
                    }
                    %
                </span>
                {
                    owner && <>
                        <OverlayTriger daoAddress={address} targetAddress={member.address} />
                    </>
                }
            </td>
        </>
    )
}

export default Members;