import React from 'react';
import ConnectWallet from './connectWallet';
import Menu from './menu';
import DaoList from './daolist';
import Networks  from './Networks';
const Index = () => {
    return (
        <>
            <div className='sidebar'>

                <div className='d-flex flex-column scroll h-100' style={{overflowY:'auto'}}>
                    <div>
                        <div className='mt-5 mb-1'>
                            <ConnectWallet icon={''} text={'Connect'} />
                        </div>
                        <Menu />
                    </div>
                    <div className='mydaos px-2 mt-3 text-white'>
                       <DaoList />
                    </div>
                    <div className='pb-3'>
                        <Networks />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Index;