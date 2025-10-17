import React from "react";
import { Row, Col, Dropdown } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { BsGraphUp } from "react-icons/bs";
import { TbReplace, TbArrowsShuffle } from "react-icons/tb";
import { networks } from "../../utils/networks";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ethers } from "ethers";
import { exlcude_Address, truncateAddress } from "../../utils";
import ClipBoard from "../clipboard";
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
const MyAssets = ({
  assets,
  daoBalance,
  chainId,
  address,
  owner,
  hyperLiquidBalances,
}) => {
  return (
    <>
      <Row className="mb-3">
        <Col>
          <h5>
            Balance: $
            {new Intl.NumberFormat("en-US", {
              maximumFractionDigits: 2,
              notation: "compact",
              compactDisplay: "short",
            }).format(daoBalance)}
          </h5>
        </Col>
        <Col>
          <div style={{ maxWidth: "150px", marginLeft: "auto" }}>
            <p className="dao-btn text-center">
              <BsGraphUp className="icon" />
              Analytics
            </p>
          </div>
        </Col>
      </Row>
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
      {hyperLiquidBalances && hyperLiquidBalances.length > 0 && (
        <>
          {hyperLiquidBalances.map((asset, index) => (
            <Row key={index}>
              <Col className="mb-3">
                <div className="d-flex align-items-center">
                  <div className="me-3" style={{ maxWidth: "50px" }}>
                    <GetImage
                      className="img-fluid"
                      url={"/images/hpl.png"}
                      altext={"hpl logo"}
                      newStyle={{ width: "40px" }}
                    />
                  </div>
                  <div className="me-1">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://app.hyperliquid.xyz/"
                      className="text-white"
                    >
                      Hyperliquid Exchange{" "}
                    </a>
                  </div>
                  <div>
                    {truncateAddress(asset.address)}{" "}
                    <ClipBoard address={asset.address} />
                  </div>
                </div>
              </Col>
              <Col className="mb-3">
                <div className="d-flex align-items-center justify-content-end">
                  <div className="mx-3">
                    <p>
                      $
                      {Number(asset.data.marginSummary.accountValue).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Col>
            </Row>
          ))}
        </>
      )}
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
                      altext={asset.name}
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
                      {Number(asset.balance_formatted).toFixed(2)}
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
                  <div>
                    <Dropdown hidden={!owner}>
                      <Dropdown.Toggle className="dao-btn p-1">
                        Transfer
                      </Dropdown.Toggle>
                      <Dropdown.Menu
                        className="text-white px-3"
                        style={{ width: "300px" }}
                      >
                        <Row>
                          <Col>
                            <h6>Exchange</h6>
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            <div>
                              <div></div>
                              <div>
                                <p className="m-0 p-0">{asset.name}</p>
                                <p className="m-0 p-0">{asset.symbol}</p>
                              </div>
                            </div>
                          </Col>
                          <Col className="text-right">
                            <p className="m-0 p-0">
                              {new Intl.NumberFormat("en-US", {
                                maximumFractionDigits: 2,
                                notation: "compact",
                                compactDisplay: "short",
                              }).format(
                                ethers.utils.formatUnits(
                                  asset.balance,
                                  asset.decimals
                                )
                              )}
                            </p>
                            <p className="m-0 p-0">$0.0</p>
                          </Col>
                        </Row>
                        <hr />
                        <div className="text-center">
                          <NavLink
                            to={
                              asset.contract_address ===
                              exlcude_Address[chainId]
                                ? `/sendCoin/${address}`
                                : `/sendToken/${address}`
                            }
                            className="dao-btn w-100 d-block p-2 text-center"
                          >
                            <TbReplace className="icon" /> Send
                          </NavLink>
                          <p className="text-center py-3 m-0">
                            Send token to another wallet
                          </p>
                        </div>
                        <div className="text-center">
                          <NavLink
                            to={`/swap?senderAddress=${address}&tokenAddress=${asset.contract_address}`}
                            className="dao-btn w-100 d-block p-2 text-center"
                          >
                            <TbReplace className="icon" /> Swap
                          </NavLink>
                          <p className="text-center py-3 m-0">
                            Exchange token to another currency within one
                            network
                          </p>
                        </div>
                        <div className="text-center">
                          <NavLink
                            to={`/bridge?senderAddress=${address}&tokenAddress=${asset.contract_address}`}
                            className="dao-btn w-100 d-block p-2 text-center"
                          >
                            <TbArrowsShuffle className="icon" /> Bridge
                          </NavLink>
                          <p className="text-center py-3">
                            Exchange token to another currency throughout
                            different networks
                          </p>
                        </div>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
              </Col>
            </Row>
          ))}
        </>
      )}
    </>
  );
};
export default MyAssets;
