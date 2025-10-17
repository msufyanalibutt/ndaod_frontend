import React from "react";
import { Row, Col, Dropdown } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { BsGraphUp } from "react-icons/bs";
import { TbReplace, TbArrowsShuffle } from "react-icons/tb";
import { networks } from "../../utils/networks";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ethers } from "ethers";
import { exlcude_Address, truncateAddress } from "../../utils";
const imageErrorSrc = "/images/NoImageCoinLogo.svg";
const GetImage = ({ url, alttext, newStyle }) => {
  return (
    <LazyLoadImage
      className="img-fluid"
      effect="blur"
      src={url}
      alt={alttext}
      style={newStyle}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = imageErrorSrc;
      }}
    />
  );
};
const TradingAccountAsset = ({ assets, chainId, address, owner, tAddress }) => {
  return (
    <>
      <Row>
        <Col>
          <p className="text-muted">
            <span>ASSETS</span>
          </p>
        </Col>
        <Col>
          <p className="text-muted text-right ">
            <span>BALANCE</span>
          </p>
        </Col>
      </Row>

      {assets && assets.length > 0 && (
        <>
          {assets.map((asset, index) => (
            <Row key={index}>
              <Col className="mb-3">
                <div className="d-flex align-items-center">
                  <div className="me-3" style={{ maxWidth: "50px" }}>
                    <GetImage
                      className="img-fluid"
                      url={asset.logo}
                      altext={asset.symbol}
                      newStyle={{ width: "40px" }}
                    />
                  </div>
                  <div>
                    {asset.type === "dust" ? (
                      asset.name ? (
                        asset.name
                      ) : (
                        truncateAddress(asset.token_address)
                      )
                    ) : (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${networks[chainId].blockExplorerUrls[0]}/token/${asset.token_address}`}
                        className="text-white"
                      >
                        {asset.name
                          ? asset.name
                          : truncateAddress(asset.token_address)}
                      </a>
                    )}
                  </div>
                </div>
              </Col>
              <Col className="mb-3">
                <div className="d-flex align-items-center justify-content-end">
                  <div className="mx-3">
                    <p className="mb-0 p-0 text-right">
                      {new Intl.NumberFormat("en-US", {
                        maximumFractionDigits: 6,
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(
                        asset.balance / Math.pow(10, asset.decimals)
                      )}
                    </p>
                    <p className="mb-0 p-0 text-right">
                      $
                     {new Intl.NumberFormat("en-US", {
                        maximumFractionDigits: 2,
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(asset.usd_price * asset.balance_formatted)}
                    </p>
                  </div>
                  {owner && (
                    <div>
                      <NavLink
                        to={
                          asset.contract_address === exlcude_Address[chainId]
                            ? `/sendCoinFromTA/${tAddress}/${address}`
                            : `/sendTokenFromTA/${tAddress}/${address}`
                        }
                        className="dao-btn w-100 d-block p-2 text-center"
                      >
                        <TbReplace className="icon" /> Withdraw
                      </NavLink>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          ))}
        </>
      )}
    </>
  );
};
export default TradingAccountAsset;
