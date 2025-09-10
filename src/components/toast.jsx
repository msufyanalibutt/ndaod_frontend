import React from 'react';
import { toast } from 'react-hot-toast';
const Toastify = (type, message) => {
    switch (type) {
        case 'success':
            return (
                <>
                    {
                        toast((t) => (
                            <div className='notification-box'>
                                {message}
                            </div>
                        ), { style: { background: 'palegreen', color: '#0D0D15', icon: '✖' } })
                    }
                </>
            )
        case 'info':
            return (
                <>
                    {
                        toast((t) => (
                            <div className='notification-box'>
                                {message}
                            </div>
                        ), { style: { background: '#8AB5FF', color: '#0D0D15' }, icon: '✖' })
                    }
                </>
            )
        case 'error':
            return (
                <>
                    {
                        toast((t) => (
                            <div className='notification-box'>
                                {message}
                            </div>
                        ), { style: { background: '#F59693', color: '#0D0D15' }, icon: '✖' })
                    }
                </>
            )
        case 'warning':
            return (
                <>
                    {
                        toast((t) => (
                            <div className='notification-box'>
                                {message}
                            </div>
                        ), { style: { background: '#b99117', color: '#0D0D15' }, icon: '✖' })
                    }
                </>
            )
        default: return (
            <>
                {
                    toast((t) => (
                        <div className='notification-box'>
                            {message}
                        </div>
                    ), { style: { background: 'palegreen', color: '#0D0D15', icon: '✖' } })
                }
            </>
        )

    }
}
export default Toastify;