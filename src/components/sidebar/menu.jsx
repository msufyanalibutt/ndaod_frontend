import React from 'react';
import { NavLink } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai';
import { TbArrowsShuffle, TbReplace, TbPlugConnected } from 'react-icons/tb';
import { useWeb3React } from '@web3-react/core';
const Sidebar = () => {
    const { active, chainId } = useWeb3React()
    return (
        <>
            <NavLink to="/" className={({ isActive }) =>
                `navlink-text ${isActive ? 'navlink mb1 active' : 'text-decoration-none'}`
            }  >
                <span className='navlink-filter'>
                </span>
                <span >
                    <AiFillHome className='navlink-icon' />Home</span>
            </NavLink>
            <NavLink to="/ecosystem" className={({ isActive }) =>
                `navlink-text ${isActive ? 'navlink mb1 active' : 'text-decoration-none'}`
            }  >
                <span className='navlink-filter '>
                </span>
                <span>Ecosystem</span>
            </NavLink>
            <NavLink to="/modules" className={({ isActive }) =>
                `navlink-text ${isActive ? 'navlink mb1 active' : 'text-decoration-none'}`
            }  >
                <span className='navlink-filter '>
                </span>
                <span>Modules</span>
            </NavLink>
            <NavLink to="/dao/create" className={({ isActive }) =>
                `navlink-text ${isActive ? 'navlink mb1 active' : 'text-decoration-none'}`
            }  >
                <span className='navlink-filter '>
                </span>
                <span>Create a DAO</span>
            </NavLink>
            <NavLink to="/swap" className={({ isActive }) =>
                `navlink-text ${isActive ? 'navlink mb1 active' : 'text-decoration-none'}`
            }  >
                <span className='navlink-filter '>
                </span>
                <span>
                    <TbReplace className='navlink-icon' />Swap</span>
            </NavLink>
            {
                (active && chainId !== 10) && <NavLink to="/bridge" className={({ isActive }) =>
                    `navlink-text ${isActive ? 'navlink mb1 active' : 'text-decoration-none'}`
                }  >
                    <span className='navlink-filter '>
                    </span>
                    <span>
                        <TbArrowsShuffle className='navlink-icon' /> Bridge</span>
                </NavLink>
            }
            <NavLink to="/sideshift" className={({ isActive }) =>
                `navlink-text ${isActive ? 'navlink mb1 active' : 'text-decoration-none'}`
            }  >
                <span className='navlink-filter '>
                </span>
                <span>
                    <TbArrowsShuffle className='navlink-icon' />SideShift</span>
            </NavLink>
            <NavLink to="/connect" className={({ isActive }) =>
                `navlink-text ${isActive ? 'navlink mb1 active' : 'text-decoration-none'}`
            }  >
                <span className='navlink-filter '>
                </span>
                <span>
                    <TbPlugConnected className='navlink-icon' />Connect</span>
            </NavLink>
        </>
    )
}

export default Sidebar;