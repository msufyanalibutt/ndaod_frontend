import React from "react";
import { TbCopy } from 'react-icons/tb';
import { truncateAddress } from "../utils";
import Toastify from "./toast";
const ClipBoard = ({ address }) => {
    const handleCopy=(e)=>{
        navigator.clipboard.writeText(address);
        Toastify('info',`Copied ${truncateAddress(address)} to clipboard`);
    }
    return (
        <>
            <span className="copy" onClick={handleCopy}><TbCopy /></span>
        </>
    )
}
export default ClipBoard;