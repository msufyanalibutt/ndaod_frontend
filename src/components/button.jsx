import React from 'react';

const Button = ({ icon, text,handleClick }) => {
    return (
        <>
            <button className='ndaod-button' onClick={handleClick}>{icon}{text}</button>
        </>
    )
}

export default Button;