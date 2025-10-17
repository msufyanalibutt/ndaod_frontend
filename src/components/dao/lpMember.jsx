import { ethers } from "ethers";
import React from "react";
import { NavLink } from "react-router-dom";
import { truncateAddress } from "../../utils";
import ClipBoard from "../clipboard";
import OverlayTriger from "../overlayTrigger";
const LPMembers = ({ member, address, owner }) => {
  return (
    <>
      <td className="bg-transparent">
        <NavLink
          className={"text-white"}
          to={`/profile/${member.owner_address}`}
        >
          {truncateAddress(member.owner_address)}
        </NavLink>
        <ClipBoard address={member.owner_address} />
      </td>
      <td className="text-right bg-transparent">
        <span className="me-2">
          {new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 4,
            notation: "compact",
            compactDisplay: "short",
          }).format(ethers.utils.formatEther(member.balance))}
        </span>
        <span className="me-2">
          {Math.round(member.percentage_relative_to_total_supply)}%
        </span>
        {owner && (
          <>
            <OverlayTriger
              daoAddress={address}
              targetAddress={member.owner_address}
            />
          </>
        )}
      </td>
    </>
  );
};

export default LPMembers;
