import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { useState, useEffect } from "react";
import { Row, Col, Modal, ModalBody, FormControl } from "react-bootstrap";
import { MdOutlineClose } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { truncateAddress } from "../../utils";
import { networks } from "../../utils/networks";
import Toastify from "../toast";
import api from "../../utils/api";

const imageErrorSrc = "/images/NoImageCoinLogo.svg";
const GetImage = ({ url, alttext, newStyle }) => {
  return (
    <LazyLoadImage
      className="img-fluid"
      effect="blur"
      src={url}
      alt={alttext}
       style={{ maxWidth: '40px', width: '100%' }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = imageErrorSrc;
      }}
    />
  );
};
const BuyBridge = ({
  setTokenAddress,
  tokenAddress,
  handleChange,
  handleBlur,
  values,
  setFieldValue,
  getConversionRate,
  recipientAddress,
}) => {
  const { chainId } = useWeb3React();
  const [buySelected, setBuySelected] = useState(null);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [tokens, setTokens] = useState([]);
  // const [maxBalance, setMaxBalance] = useState(0);
  const [eths, setEths] = useState([]);
  const [bnbs, setBnbs] = useState([]);
  const [avves, setAvves] = useState([]);
  const [chain, setChain] = useState(56);
  const [search, setSearch] = useState("");
  useEffect(() => {
    getEthsTokens();
    getBnbTokens();
    getAaveTokens();
  }, []);
  useEffect(() => {
    if (tokenAddress && tokens.length > 0) {
      updateSetSellected();
    }
  }, [tokenAddress, tokens, recipientAddress]);
  const getEthsTokens = async () => {
    try {
      const url = `/1/tokenList`;
      const result = await api.post("/openOcean/api", { url });
      setEths(result.data.data);
    } catch (error) {}
  };
  const getBnbTokens = async () => {
    try {
      const url = `/56/tokenList`;
      const result = await api.post("/openOcean/api", { url });
      setTokens(result.data.data);
      setBnbs(result.data.data);
    } catch (error) {}
  };
  const getAaveTokens = async () => {
    try {
      const url = `/43114/tokenList`;
      const result = await api.post("/openOcean/api", { url });
      setAvves(result.data.data);
    } catch (error) {}
  };
  const getSelectedChainTokens = (id) => {
    setChain(id);
    setFieldValue("toChainId", id);
    if (id === 1) {
      setTokens(eths);
    } else if (id === 56) {
      setTokens(bnbs);
    } else {
      setTokens(avves);
    }
  };
  const updateSetSellected = () => {
    let token = tokens.filter(
      (item) => item.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    getCoinBalance(token[0]);
  };
  const getCoinBalance = async (item) => {
    if (!item) return;
    try {
      setCoinSelected(item);
    } catch (error) {}
  };
  const setCoinSelected = (item) => {
    setBuySelected(item);
    setTokenAddress(item.address);
    setFieldValue("toName", item.symbol);
    setFieldValue("todecimals", item.decimals);
    getConversionRate(values.fromBalance, item);
  };
  const setCoinSelectedByModal = (item) => {
    setBuySelected(item);
    setTokenAddress(item.address);
    setFieldValue("toName", item.symbol);
    setFieldValue("todecimals", item.decimals);
    setSearch("");
    setBuySelected(tokens);
    handleClose();
  };
  const HandleBuyBalance = () => {
    Toastify(
      "info",
      "This field cannot be changed. Change only the amount of the sale"
    );
  };
  const searchBuyTokens = (value) => {
    if (value === "") {
      setTokens(tokens);
      return;
    }
    let items = [];
    if (chain === 1) {
      items = eths;
    } else if (chain === 56) {
      items = bnbs;
    } else {
      items = avves;
    }
    items = items.filter((item) => {
      if (
        String(item.symbol).toLowerCase().includes(value.toLowerCase()) ||
        String(item.address).toLowerCase().includes(value.toLowerCase())
      ) {
        return true;
      } else {
        return false;
      }
    });
    if (items.length > 0) {
      setTokens(items);
    } else {
      setTokens(tokens);
    }
  };
  const getBuyTokens = (value) => {
    setSearch(value);
    searchBuyTokens(value);
  };
  return (
    <>
      <div>
        <Row>
          <Col>
            <p>You Buy</p>
          </Col>
          <Col className="text-right">
            <p>Balance: {Number(0).toFixed(4)}</p>
          </Col>
        </Row>
        <Row>
          <Col>
            <button
              type="button"
              className="dao-btn d-flex align-items-center justify-content-center"
              onClick={handleShow}
            >
              {buySelected ? (
                <>
                  <img
                    src={buySelected.icon}
                    style={{ maxWidth: "30px", marginRight: "10px" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = imageErrorSrc;
                    }}
                    alt={buySelected.icon}
                  />
                  <span>{buySelected.symbol}</span>
                  <MdKeyboardArrowDown />
                </>
              ) : (
                tokens &&
                tokens.length && (
                  <>
                    <img
                      src={tokens[0].icon}
                      style={{ maxWidth: "30px", marginRight: "10px" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = imageErrorSrc;
                      }}
                      alt={tokens[0].icon}
                    />
                    <span>{tokens[0].symbol}</span>
                    <MdKeyboardArrowDown />
                  </>
                )
              )}
            </button>
            <p className="p-0 m-0 py-1">
              {buySelected && (
                <>
                  {buySelected.address === networks[chainId].inchCoin ? (
                    <span>{buySelected.name}</span>
                  ) : (
                    <a
                      className="text-white"
                      rel="noopener noreferrer"
                      target="_blank"
                      href={`${networks[chainId].blockExplorerUrls}/token/${buySelected.address}`}
                    >
                      {buySelected && buySelected.name}
                    </a>
                  )}
                </>
              )}
            </p>
          </Col>
          <FormControl
            type="hidden"
            id="toName"
            name="toName"
            className="text-right"
            onChange={handleChange}
            onBlur={handleBlur}
            value={values.toName || ""}
          />
          <Col>
            <FormControl
              type="text"
              id="toBalance"
              name="toBalance"
              className="text-right"
              onChange={handleChange}
              onBlur={handleBlur}
              onClick={HandleBuyBalance}
              value={values.toBalance || ""}
              readOnly
            />
          </Col>
        </Row>
      </div>
      <Modal
        show={show}
        onHide={() => {
          setSearch("");
          handleClose();
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
                onChange={(e) => getBuyTokens(e.target.value)}
              />
            </Col>
          </Row>
          <Row>
            <Col className="my-3">
              <div
                className={`dao-btn ecosystem ${
                  chain === 1 && "selectedecosystem"
                }`}
                onClick={() => getSelectedChainTokens(1)}
              >
                Ethereum
              </div>
            </Col>
            <Col className="my-3">
              <div
                className={`dao-btn ecosystem ${
                  chain === 56 && "selectedecosystem"
                }`}
                onClick={() => getSelectedChainTokens(56)}
              >
                BNB Chain
              </div>
            </Col>
            <Col className="my-3">
              <div
                className={`dao-btn ecosystem ${
                  chain === 43114 && "selectedecosystem"
                }`}
                onClick={() => getSelectedChainTokens(43114)}
              >
                Avalanche
              </div>
            </Col>
          </Row>
          {tokens && tokens.length > 0 && (
            <Row xs={1} className="scroll mt-2">
              {tokens.map((item, index) => (
                <Col
                  key={index}
                  className="token-item py-1"
                  onClick={() => setCoinSelectedByModal(item)}
                >
                  <Row>
                    <Col>
                      <div className="d-inline-flex align-items-center">
                        <div className="me-3">
                          <GetImage
                            url={item.icon}
                            alttext={item.symbol}
                            newStyle={{ maxWidth: "40px", width: "100%" }}
                          />
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
export default BuyBridge;
