import { useWeb3React } from "@web3-react/core";
import React, { useState, useEffect } from "react";
import { Row, Col, Modal, ModalBody, FormControl } from "react-bootstrap";
import { MdOutlineClose } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { WALLETCONTEXT } from "../../contexts/walletContext";
import { exlcude_Address, truncateAddress } from "../../utils";
import { networks } from "../../utils/networks";
const imageErrorSrc = "/images/NoImageCoinLogo.svg";
const GetImage = ({ url, alttext }) => {
  return (
    <LazyLoadImage
      className="img-fluid"
      effect="blur"
      src={url}
      alt={alttext}
      style={{ maxWidth: "40px", width: "100%" }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = imageErrorSrc;
      }}
    />
  );
};

const SellBridge = ({
  tokens,
  senderAddress,
  tokenAddress,
  setTokenAddress,
  values,
  touched,
  errors,
  handleChange,
  handleBlur,
  setFieldValue,
  getConversionRate,
  setMaxBalance,
  maxBalance,
  errMsg,
}) => {
  const { chainId } = useWeb3React();
  const [sellSelected, setSellSelected] = useState(null);
  const [show, setShow] = useState(false);
  const { getCustomContract } = WALLETCONTEXT();
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [timeout, settimeout] = useState(null);
  const [sellTokens, setSellTokens] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (tokenAddress && tokens && tokens.length) {
      setSellTokens(tokens);
      updateSetSellected();
    }
  }, [senderAddress, tokenAddress, tokens]);
  const updateSetSellected = () => {
    let token = tokens.filter(
      (item) => item.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    getCoinBalance(token[0] || tokens[0]);
  };
  const setCoinSelected = (item) => {
    setSellSelected(item);
    setTokenAddress(item.address);
    setFieldValue("fromName", item.symbol);
    setFieldValue("fromdecimals", item.decimals);
    getConversionRate(values.fromBalance, item);
  };
  const setCoinSelectedByModal = (item) => {
    handleClose();
    setSellSelected(item);
    setTokenAddress(item.address);
    setFieldValue("fromName", item.symbol);
    setFieldValue("fromdecimals", item.decimals);
    setSellTokens(tokens);
    setSearch("");
  };
  const getCoinBalance = async (item) => {
    try {
      setCoinSelected(item);
      let address =
        item.address === networks[chainId].inchCoin
          ? exlcude_Address[chainId]
          : item.address;
      const contract = await getCustomContract(address);
      if (senderAddress) {
        const balance = await contract.balanceOf(senderAddress);
        setMaxBalance(String(balance) / Math.pow(10, item.decimals));
        setFieldValue("decimals", item.decimals);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getMaxBalance = () => {
    setFieldValue("fromBalance", maxBalance);
    getConversionRate(maxBalance, sellSelected);
  };
  const getBalance = (e) => {
    handleChange(e);
    debounce(() => {
      getConversionRate(e.target.value, sellSelected);
    }, 1000);
  };

  function debounce(func, wait) {
    let time = timeout;
    clearTimeout(timeout);
    time = setTimeout(() => {
      func();
    }, wait);
    settimeout(time);
  }
  const searchSellTokens = (value) => {
    if (value === "") {
      setSellTokens(tokens);
      return;
    }
    let items = sellTokens;
    items = items.filter((item) => {
      if (
        String(item.symbol).toLowerCase().includes(value.toLowerCase()) ||
        String(item.address).toLowerCase().includes(value.toLowerCase())
      ) {
        console.log(value);
        return true;
      } else {
        return false;
      }
    });
    if (items.length > 0) {
      setSellTokens(items);
    } else {
      setSellTokens(tokens);
    }
  };
  const getSellTokens = (value) => {
    setSearch(value);
    searchSellTokens(value);
  };
  return (
    <>
      <div className="tabborder p-3">
        <Row>
          <Col>
            <p>You Sell</p>
          </Col>
          <Col className="text-right">
            <p>
              Balance: {Number(maxBalance).toFixed(4)}{" "}
              <span className="text-primary pointer" onClick={getMaxBalance}>
                MAX
              </span>
            </p>
          </Col>
        </Row>
        <Row>
          <Col>
            <button
              type="button"
              className="dao-btn d-flex align-items-center justify-content-center"
              onClick={handleShow}
            >
              {sellSelected ? (
                <>
                  <img
                    src={sellSelected.icon}
                    style={{ maxWidth: "30px", marginRight: "10px" }}
                    alt={sellSelected.icon}
                  />
                  <span>{sellSelected.symbol}</span>
                  <MdKeyboardArrowDown />
                </>
              ) : (
                tokens &&
                tokens.length && (
                  <>
                    <img
                      src={tokens[0].icon}
                      style={{ maxWidth: "30px", marginRight: "10px" }}
                      alt={tokens[0].icon}
                    />
                    <span>{tokens[0].symbol}</span>
                    <MdKeyboardArrowDown />
                  </>
                )
              )}
            </button>
            <p className="p-0 m-0 py-1">
              {sellSelected && (
                <>
                  {sellSelected.address === networks[chainId].inchCoin ? (
                    <span>{sellSelected.name}</span>
                  ) : (
                    <a
                      className="text-white"
                      rel="noopener noreferrer"
                      target="_blank"
                      href={`${networks[chainId].blockExplorerUrls}/token/${sellSelected.address}`}
                    >
                      {sellSelected && sellSelected.name}
                    </a>
                  )}
                </>
              )}
            </p>
          </Col>
          <FormControl
            type="hidden"
            id="fromName"
            name="fromName"
            className="text-right"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.fromName || ""}
          />
          <Col>
            <FormControl
              type="text"
              id="fromBalance"
              name="fromBalance"
              className="text-right"
              onChange={(e) => getBalance(e)}
              onBlur={handleBlur}
              value={values.fromBalance || ""}
            />

            {errMsg ? (
              <small className="text-danger">{errMsg}</small>
            ) : (
              <small className="text-danger">
                {touched.fromBalance && errors.fromBalance}
              </small>
            )}
          </Col>
        </Row>
      </div>
      <Modal
        show={show}
        onHide={() => {
          handleClose();
          setSellTokens(tokens);
          setSearch("");
        }}
      >
        <ModalBody>
          <Row>
            <Col>
              <h5>Select Token</h5>
            </Col>
            <Col className="text-right">
              <button
                type="button"
                className="dao-btn p-0 px-2"
                onClick={handleClose}
              >
                <MdOutlineClose />
              </button>
            </Col>
          </Row>
          <Row>
            <Col>
              <FormControl
                id="search"
                name="search"
                placeholder="Search Token"
                value={search}
                onChange={(e) => getSellTokens(e.target.value)}
              />
            </Col>
          </Row>
          {tokens && tokens.length > 0 && (
            <Row xs={1} className="scroll mt-2">
              {sellTokens.map((item, index) => (
                <Col
                  key={index}
                  className="token-item py-1"
                  onClick={() => setCoinSelectedByModal(item)}
                >
                  <Row>
                    <Col>
                      <div className="d-inline-flex align-items-center">
                        <div className="me-3">
                          <GetImage url={item.icon} alttext={item.symbol} />
                        </div>
                        <div>
                          <h6>{item.symbol}</h6>
                          <p className="m-0 p-0">
                            {truncateAddress(item.address)}
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col className="text-right">
                      <h6>
                        {0.0} {item.symbol}
                      </h6>
                      <p className="m-0 p-0">${0.0}</p>
                    </Col>
                  </Row>
                </Col>
              ))}
            </Row>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};
export default SellBridge;
