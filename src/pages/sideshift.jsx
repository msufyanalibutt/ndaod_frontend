import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  FormControl,
  Form,
  Spinner,
  Modal,
} from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { WALLETCONTEXT } from "../contexts/walletContext";
import ConnectWallet from "../components/sidebar/connectWallet";
import { HiLockOpen } from "react-icons/hi";
import { IoMdClose, IoMdSwap } from "react-icons/io";
import { useWeb3React } from "@web3-react/core";
import { constants, ethers } from "ethers";
import {
  ssAffiliateId,
  ssAffiliateSecret,
  truncateAddress,
  chainIds,
} from "../utils";
import * as randomColor from "randomcolor";
import SellShift from "../components/sideshift/sell";
import BuyShift from "../components/sideshift/buy";
import ClipBoard from "../components/clipboard";
import { SIDESHIFTCONTEXT } from "../contexts/sideShift";
import { useFormik } from "formik";
import * as yup from "yup";
import axois from "../utils/api";
import axios from "axios";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { networks } from "../utils/networks";
import Toastify from "../components/toast";
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
const SideShift = () => {
  const { account, active, chainId } = useWeb3React();
  const location = useLocation();
  const { daoList } = WALLETCONTEXT();
  const { swapCoins, buyCoin } = SIDESHIFTCONTEXT();
  const navigate = useNavigate();
  const [daos, setDaos] = useState([]);
  const [mdaos, setMdaos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mselected, setMSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active && account) {
      getSearchParams();
      getDaosList();
      getMultiChainDaosList();
    }
  }, [active, account, chainId]);

  const getSearchParams = () => {
    const query = new URLSearchParams(location.search);
    let senderAddress = query.get("senderAddress");
    if (senderAddress) {
      setSelected(senderAddress);
    }
  };
  const getDaosList = async () => {
    try {
      const result = await daoList(account);
      setDaos(result);
    } catch (error) {
      console.log(error);
    }
  };
  const getMultiChainDaosList = async () => {
    try {
      let daos = [];
      for (let chain of chainIds) {
        let result = await axois.get(`/${chain}/${account}`);
        let d = result.data;
        d = d.filter((item) => {
          console.log(item[0]);
          if (item[0] !== constants.AddressZero) {
            daos.push({ chain, address: item[0], daoName: item[1] });
            return true;
          } else {
            return false;
          }
        });
      }
      setMdaos(daos);
    } catch (error) {}
  };
  const selectedDao = (dao) => {
    setFieldValue("senderAddress", dao);
    setSelected(dao);
  };
  const mselectedDao = (item) => {
    setFieldValue("recipientAddress", item.address);
    setMSelected(item);
    handleClose();
  };
  const getAddress = () => {
    setMSelected(null);
    setFieldValue("recipientAddress", account);
  };
  const handleFormSubmit = async ({
    senderAddress,
    recipientAddress,
    depositeCoin,
    settleCoin,
    depositeNetwork,
    settleNetwork,
  }) => {
    try {
      setLoading(true);
      const api = axios.create({
        baseURL: "https://sideshift.ai/api",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-sideshift-secret": ssAffiliateSecret,
        },
      });
      const body = {
        settleAddress: recipientAddress,
        refundAddress: senderAddress,
        affiliateId: ssAffiliateId,
        depositCoin: depositeCoin,
        settleCoin: settleCoin,
        depositNetwork: depositeNetwork,
        settleNetwork: settleNetwork,
        commissionRate: "0.005",
      };
      const result = await api.post("/v2/shifts/variable", body);
      const id = result.data.id;
      navigate(`/order/${senderAddress}/${id}`);
    } catch (error) {
      if (error.response) {
        // server responded with an error
        Toastify(
          "error",
          error.response.data.error?.message || "Something went wrong"
        );
      } else if (error.request) {
        // no response from server
        Toastify("error", "No response from server");
      } else {
        // something went wrong in request setup
        Toastify("error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const {
    values,
    handleBlur,
    handleChange,
    handleSubmit,
    isValid,
    dirty,
    setFieldValue,
  } = useFormik({
    onSubmit: handleFormSubmit,
    initialValues: {
      senderAddress: "",
      recipientAddress: "",
      depositCoin: "",
      depositNetwork: "",
      settleCoin: "",
      settleNetwork: "",
    },
    validationSchema: formSchema,
  });
  return (
    <>
      {active ? (
        <>
          <Container className="py-3">
            <Row>
              <Col xs={12} xl={9} className="mx-auto text-white">
                <h1>Side Shift</h1>
                <p>Cross-chain swap your or DAO's assets</p>
              </Col>
            </Row>
          </Container>
          <Container className="py-3">
            <Row>
              <Col xs={12} xl={9} className="mx-auto text-white">
                <h3>Choose Sender Address</h3>
                <Row xs={1} sm={2} md={3}>
                  <Col className="mb-3">
                    <div
                      className={`d-flex align-items-center py-2 px-3 ecosystem ${
                        selected === account && "selectedecosystem"
                      }`}
                      onClick={() => selectedDao(account)}
                    >
                      <div
                        className="profile me-3"
                        style={{
                          width: "40px",
                          height: "40px",
                          background: randomColor(),
                        }}
                      ></div>
                      <div>
                        <p className="p-0 m-0">Your Account</p>
                        {active && (
                          <p className="p-0 m-0 text-white">
                            {truncateAddress(account)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Col>
                  {daos &&
                    daos.length > 0 &&
                    daos.map(
                      (dao, index) =>
                        !(constants.AddressZero === dao.dao) && (
                          <Col key={index} className="mb-3">
                            <div
                              className={`d-flex align-items-center py-2 px-3 ecosystem ${
                                selected === dao.dao && "selectedecosystem"
                              }`}
                              onClick={() => selectedDao(dao.dao)}
                            >
                              <div
                                className="profile me-3"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  background: randomColor(),
                                }}
                              ></div>
                              <div>
                                <p className="p-0 m-0">
                                  <span className="text-white">
                                    {dao.daoName}
                                  </span>
                                </p>
                                <p className="p-0 m-0 text-white">
                                  {truncateAddress(dao.dao)}
                                </p>
                              </div>
                            </div>
                          </Col>
                        )
                    )}
                </Row>
              </Col>
            </Row>
          </Container>
          <Container className="mb-5">
            <Row>
              <Col xs={12} md={8} xl={5} className="mx-auto text-white">
                <Form onSubmit={handleSubmit}>
                  <div className="tabborder p-5">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <SellShift setFieldValue={setFieldValue} />
                      <div
                        className="w-25 text-center pointer"
                        // onClick={swapCoins}
                      >
                        <IoMdSwap size="30px" />
                      </div>
                      <BuyShift setFieldValue={setFieldValue} />
                    </div>
                    <FormControl
                      className="text-center mb-3"
                      name="recipientAddress"
                      placeholder={`Your ${buyCoin.coin} (${String(
                        buyCoin.network
                      ).toUpperCase()}) Address`}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.recipientAddress}
                    />
                    <div className="text-center mb-3">
                      <button
                        type="button"
                        className="dao-btn"
                        onClick={getAddress}
                      >
                        Get Address From Metamask
                      </button>
                    </div>
                    <div className="text-center">
                      <button
                        type="submit"
                        className="dao-btn"
                        style={{
                          backgroundColor: "#8AB5FF",
                          color: "#0D0D15",
                          fontSize: "20px",
                        }}
                        disabled={!(isValid && dirty) || loading}
                      >
                        {loading ? (
                          <Spinner animation="border" variant="primary" />
                        ) : (
                          "Shift"
                        )}
                      </button>{" "}
                      <button
                        type="button"
                        className="dao-btn"
                        style={{
                          backgroundColor: "#8AB5FF",
                          color: "#0D0D15",
                          fontSize: "20px",
                        }}
                        onClick={handleShow}
                      >
                        Daos
                      </button>
                    </div>
                    {values.recipientAddress &&
                      mselected &&
                      String(
                        networks[mselected.chain].chainName
                      ).toUpperCase() !==
                        String(buyCoin.network).toUpperCase() && (
                        <div className="text-center mt-3">
                          <div
                            className="dao-warning-btn text-white d-inline-block mx-auto px-3 py-2"
                            style={{ fontSize: "16px" }}
                          >
                            Wrong Network. Select Dao On{" "}
                            {String(buyCoin.network).toUpperCase()}! Chain.
                          </div>
                        </div>
                      )}
                  </div>
                </Form>
              </Col>
            </Row>
            <Modal size="lg" fullscreen={true} show={show} onHide={handleClose}>
              <Modal.Body>
                <Row>
                  <Col className="text-right">
                    <IoMdClose
                      className="pointer"
                      size="30px"
                      onClick={handleClose}
                    />
                  </Col>
                </Row>
                <Container>
                  <Row>
                    {mdaos &&
                      mdaos.length > 0 &&
                      mdaos.map((item, index) => (
                        <Col
                          xs={12}
                          md={4}
                          xl={3}
                          key={index}
                          className="my-3 "
                        >
                          <div
                            className={`text-center py-3 ecosystem ${
                              mselected &&
                              mselected.address === item.address &&
                              "selectedecosystem"
                            }`}
                            style={{ outline: "none" }}
                            onClick={() => mselectedDao(item)}
                          >
                            <div
                              className="text-center mb-3"
                              style={{ maxWidth: "100%" }}
                            >
                              <GetImage
                                className="img-fluid"
                                url={networks[item.chain].iconUrls[0]}
                                newStyle={{ width: "100px" }}
                              />
                            </div>
                            <div className="d-flex align-items-center justify-content-center">
                              {truncateAddress(item.address)}
                            </div>
                            <div>{item.daoName}</div>
                          </div>
                        </Col>
                      ))}
                  </Row>
                </Container>
              </Modal.Body>
            </Modal>
          </Container>
        </>
      ) : (
        <>
          <div
            className="text-center my-5 mx-auto"
            style={{ maxWidth: "300px" }}
          >
            <ConnectWallet
              icon={<HiLockOpen className="ndaod-button-icon" />}
              text={"Connect Wallet"}
            />
          </div>
        </>
      )}
    </>
  );
};
const formSchema = yup.object().shape({
  senderAddress: yup
    .string()
    .test("isAddres", "Invalid address", function (value) {
      if (value) {
        return ethers.utils.isAddress(value);
      } else {
        return true;
      }
    })
    .required("Sender adddress is required"),
  recipientAddress: yup
    .string()
    .test("isAddres", "Invalid address", function (value) {
      if (value) {
        return ethers.utils.isAddress(value);
      } else {
        return true;
      }
    })
    .required("Sender adddress is required"),
  depositeCoin: yup.string().required(),
  depositeNetwork: yup.string().required(),
  settleCoin: yup.string().required(),
  settleNetwork: yup.string().required(),
});
export default SideShift;
