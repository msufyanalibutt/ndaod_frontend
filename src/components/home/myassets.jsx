import { Row, Col } from "react-bootstrap";
import { BsGraphUp } from "react-icons/bs";
import { LazyLoadImage } from "react-lazy-load-image-component";
// import { TbReplace, TbArrowsShuffle } from 'react-icons/tb';
// import { AiOutlineClose } from 'react-icons/ai';
import { networks } from "../../utils/networks";
import { useEffect, useState } from "react";
import api from "../../utils/api";
const imageErrorSrc = "/images/NoImageCoinLogo.svg";
const GetImage = ({ url, alttext }) => {

  return (
    url?<LazyLoadImage
      className="img-fluid"
      effect="blur"
      src={url}
      alt={alttext}
      style={{ maxWidth: "40px", width: "100%" }}
       onError={(e) => {
        e.target.onerror = null;
        e.target.src = imageErrorSrc;
      }}
    />:<LazyLoadImage
      className="img-fluid"
      effect="blur"
      src={imageErrorSrc}
      alt={alttext}
      style={{ maxWidth: "40px", width: "100%" }}
       onError={(e) => {
        e.target.onerror = null;
        e.target.src = imageErrorSrc;
      }}
    />
  )
};
const MyAssets = ({ assets, chainId }) => {
  return (
    <>
      <Row className="mb-3">
        <Col>
          <h4>My Assets</h4>
        </Col>
        <Col>
          <div style={{ maxWidth: "150px", marginLeft: "auto" }}>
            <p className="dao-btn text-center" rel="noopener noreferrer">
              <BsGraphUp className="icon" />
              Analytics
            </p>
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <p className="text-muted">
            <span>ASSET</span>
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
                    <GetImage url={asset.logo} alttext={asset.name} />
                  </div>
                  <div>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`${networks[chainId].blockExplorerUrls[0]}/token/${asset.token_address}`}
                      className="text-white"
                    >
                      {asset.name}
                    </a>
                  </div>
                </div>
              </Col>
              <Col className="mb-3">
                <div className="d-flex align-items-center justify-content-end">
                  <div className="mx-3">
                    <p className="mb-0 p-0 text-right">
                      {new Intl.NumberFormat("en-US", {
                        maximumFractionDigits: 2,
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(asset.balance_formatted)}
                    </p>
                    <p className='mb-0 p-0 text-right'>${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, notation: "compact", compactDisplay: "short" }).format(asset.usd_price * asset.balance_formatted)}</p>
                  </div>
                  <div>
                    {/* <Dropdown>
                                            <Dropdown.Toggle className="dao-btn" >Exchange</Dropdown.Toggle>
                                            <Dropdown.Menu className='text-white px-3' style={{ width: '300px' }} >
                                                <Row>
                                                    <Col>
                                                        <h6>Exchange</h6>
                                                    </Col>
                                                    <Col className='text-right' >
                                                        <a href="/#" className='text-white'><AiOutlineClose /></a>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col>
                                                        <div>
                                                            <div>
                                                            </div>
                                                            <div>
                                                                <p className='m-0 p-0'>ETHER</p>
                                                                <p className='m-0 p-0'>ETH</p>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col className='text-right'>
                                                        <p className='m-0 p-0'>0.0</p>
                                                        <p className='m-0 p-0'>$0.0</p>
                                                    </Col>
                                                </Row>
                                                <hr />
                                                <div>
                                                    <a className='dao-btn text-center'>
                                                        <TbReplace className='icon' /> Swap
                                                    </a>
                                                    <p className='text-center'>Exchange token to another currency within one network</p>
                                                </div>
                                                <div>
                                                    <a className='dao-btn text-center'>
                                                        <TbArrowsShuffle className='icon' /> Bridge
                                                    </a>
                                                    <p className='text-center'>Exchange token to another currency throughout different networks</p>
                                                </div>
                                            </Dropdown.Menu>
                                        </Dropdown> */}
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
