import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  Container,
  Row,
  Col,
  FormControl,
  Form,
  FormGroup,
  FormLabel,
  InputGroup,
  Spinner,
  Modal,
  ToastContainer,
  Button,
} from "react-bootstrap";
import { HiLockOpen, HiSpeakerphone } from "react-icons/hi";
import { ImCross } from "react-icons/im";
import { useNavigate, useParams } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import dayjs from "dayjs";
import { truncateAddress } from "../utils";
import ConnectWallet from "../components/sidebar/connectWallet";
import axois from "../utils/api";
import Toastify from "../components/toast";
import { WALLETCONTEXT } from "../contexts/walletContext";
import { BsLightningFill } from "react-icons/bs";
import { FaCircleMinus } from "react-icons/fa6";
import { networks } from "../utils/networks";
const imageErrorSrc = "/images/NoImageCoinLogo.svg";

const AddMemberToTA = () => {
  const [loading, setLoading] = useState(false);
  const [iloading, setiLoading] = useState(false);
  const [owner, setOwner] = useState(false);
  const [permitted, setPermitted] = useState(false);
  const [assets, setAssets] = useState([]);
  const { chainId, account, active, library } = useWeb3React();
  const { dao, getShopTaContract, getShopTAccountContract } = WALLETCONTEXT();
  const { address } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [showExchangeTrading, setShowExchangeTrading] = useState(false);
  const handleCloseShowExchangeTrading = () => {
    excahngeTradingForm.resetForm();
    setShowExchangeTrading(false);
  };
  const handleShowShowExchangeTrading = () => setShowExchangeTrading(true);
  const [exchangeTradingList, setExchangeTradingList] = useState([]);
  useEffect(() => {
    if (account && active && chainId) {
      getDaoAssets(address);
      getDaoMembers(address);
    }
  }, [account, active, chainId]);
  const handleFormSubmit = async ({
    title,
    recipientAddress,
    tokenAddress,
    description,
  }) => {
    if (!library) return;
    try {
      setLoading(true);
      const contract = await dao(address);
      let timestamp = dayjs().unix();
      const addresses = exchangeTradingList.map((m) => m.tradingAccount);
      const names = exchangeTradingList.map((m) => m.exchangeName);
      let iface = createForIface(recipientAddress, addresses, names);
      const txHash = await contract.getTxHash(
        tokenAddress,
        iface,
        0,
        0,
        timestamp
      );
      const signature = await library.provider.request({
        method: "personal_sign",
        params: [txHash, account],
      });
      if (!owner) {
        Toastify("error", "Request failed with status code 400");
        return;
      }
      let body = {
        signature,
        data: iface,
        hex_signature: String(iface).slice(0, 10),
        daoAddress: address,
        target: tokenAddress,
        title,
        description,
        chainId,
        value: 0,
        nonce: 0,
        createdAt: timestamp,
        timestamp: 0,
        txHash,
        creator: account,
      };
      await axois.post("/create/voting", body);
      setLoading(false);
      navigate(`/dao/${address}/votingPage/${txHash}`);
    } catch (error) {
      Toastify("error", error.message);
      setLoading(false);
    }
  };
  const instanceHandleSubmit = async () => {
    const { title, recipientAddress, tokenAddress, description } = values;
    if (!library) return;
    try {
      setiLoading(true);
      const contract = await dao(address);
      let timestamp = dayjs().unix();
      const addresses = exchangeTradingList.map((m) => m.tradingAccount);
      const names = exchangeTradingList.map((m) => m.exchangeName);
      let iface = createForIface(recipientAddress, addresses, names);
      const txHash = await contract.getTxHash(
        tokenAddress,
        iface,
        0,
        0,
        timestamp
      );
      const signature = await library.provider.request({
        method: "personal_sign",
        params: [txHash, account],
      });
      if (!owner) {
        Toastify("error", "Request failed with status code 400");
        return;
      }
      if (!permitted) {
        Toastify("error", "Request failed with status code 400");
        return;
      }
      const result = await contract.executePermitted(tokenAddress, iface, 0);
      Toastify("info", "Instant Execution Started");
      await result.wait();
      Toastify("success", "Instant Execution Success");
      let body = {
        signature,
        data: iface,
        hex_signature: String(iface).slice(0, 10),
        daoAddress: address,
        target: tokenAddress,
        title,
        description,
        chainId,
        value: 0,
        nonce: 0,
        createdAt: timestamp,
        timestamp: dayjs().unix(),
        txHash,
        creator: account,
      };
      await axois.post("/create/voting", body);
      setiLoading(false);
      resetForm();
    } catch (error) {
      Toastify("error", error.message);
      setiLoading(false);
    }
  };
  const createForIface = (main, subs, subNames) => {
    const ABI = [
      "function mint(address _main, address[] _subs, string[] _subNames)",
    ];
    const iface = new ethers.utils.Interface(ABI);
    const data = iface.encodeFunctionData("mint", [main, subs, subNames]);
    return data;
  };
  const getDaoAssets = async () => {
    try {
      const contract = await getShopTaContract();
      const result = await contract.getTAs(address);
      let items = [];
      for (let item of result) {
        const tacontract = await getShopTAccountContract(item);
        const name = await tacontract.name();
        items.push({
          tAddress: item,
          name,
        });
      }
      setAssets(items);
    } catch (error) {}
  };
  const formSchema = yup.object().shape({
    title: yup.string().required("Title is required"),
    description: yup.string(),
    tokenAddress: yup
      .string()
      .test("isAddres", "Invalid address", function (value) {
        if (value) {
          return ethers.utils.isAddress(value);
        } else {
          return true;
        }
      })
      .required("This is required"),
    recipientAddress: yup
      .string()
      .test("isAddres", "Invalid address", function (value) {
        if (value) {
          return ethers.utils.isAddress(value);
        } else {
          return true;
        }
      })
      .required("This is required"),
  });
  const {
    values,
    errors,
    touched,
    handleBlur,
    handleChange,
    handleSubmit,
    setFieldValue,
    isValid,
    dirty,
    resetForm,
  } = useFormik({
    onSubmit: handleFormSubmit,
    initialValues: {
      title: "",
      description: "",
      recipientAddress: "",
      tokenAddress: "",
      item: null,
    },
    validationSchema: formSchema,
  });
  const handleFormSubmitForExcahngeTrading = async ({
    exchangeName,
    tradingAccount,
  }) => {
    const body = { exchangeName, tradingAccount };
    setExchangeTradingList((prev) => [...prev, body]);
    handleCloseShowExchangeTrading();
  };
  const formSchemaExchangeTrading = yup.object().shape({
    exchangeName: yup.string().required("Exchange Name is required"),
    tradingAccount: yup
      .string()
      .test("isAddres", "Invalid address", function (value) {
        if (value) {
          return ethers.utils.isAddress(value);
        } else {
          return true;
        }
      })
      .required("This is required"),
  });
  const excahngeTradingForm = useFormik({
    onSubmit: handleFormSubmitForExcahngeTrading,
    initialValues: {
      exchangeName: "",
      tradingAccount: "",
    },
    validationSchema: formSchemaExchangeTrading,
  });
  const removeExchange = (indexToRemove) => {
    setExchangeTradingList((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };
  const getDaoMembers = async (address) => {
    try {
      const contract = await dao(address);
      const balanceOf = await contract.balanceOf(account);
      if (String(balanceOf) > 0) {
        setOwner(true);
      } else {
        setOwner(false);
      }
      const permitted = await contract.containsPermitted(account);
      setPermitted(permitted);
    } catch (error) {}
  };
  const handleManualInputAddress = (item) => {
    setFieldValue("item", item);
    setFieldValue("tokenAddress", item.tAddress);
    handleClose();
  };
  return (
    <>
      {active ? (
        <Container className="my-3">
          <Row>
            <Col xs={12} md={8} className="mx-auto text-white">
              <h2>Add Trader To Trading Account</h2>
              <Form onSubmit={handleSubmit}>
                <FormGroup className="mt-3">
                  {/* <p>Transfer Any Token from DAO's balance.</p> */}
                  <hr />
                </FormGroup>
                <FormGroup className="mb-3">
                  <FormLabel>Trading Accounts</FormLabel>
                  <br />
                  <button
                    type="button"
                    className="dao-btn w-100"
                    onClick={handleShow}
                  >
                    {values.tokenAddress === "" ? (
                      "Choose Token"
                    ) : (
                      <Row>
                        <Col className="d-flex align-items-center">
                          {truncateAddress(values.item.tAddress)}
                        </Col>
                        <Col className="text-right">{values.item.name}</Col>
                      </Row>
                    )}
                  </button>
                  <br />
                  <small className="text-danger">
                    {touched.tokenAddress && errors.tokenAddress}
                  </small>
                </FormGroup>
                <FormGroup className="mb-3">
                  <FormLabel htmlFor="recipientAddress">
                    Trader Account Address
                  </FormLabel>
                  <FormControl
                    type="text"
                    id="recipientAddress"
                    name="recipientAddress"
                    placeholder="Trader Address"
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value) {
                        setFieldValue("title", `Add member ${e.target.value}`);
                      }
                    }}
                    onBlur={handleBlur}
                    value={values.recipientAddress || ""}
                  />
                  <small className="text-danger">
                    {touched.recipientAddress && errors.recipientAddress}
                  </small>
                </FormGroup>
                <FormGroup>
                  <Row className="mb-3">
                    <Col>
                      <FormLabel>Exchange Trading Accounts</FormLabel>
                    </Col>
                    <Col className="text-right">
                      <button
                        type="button"
                        className="dao-btn"
                        onClick={handleShowShowExchangeTrading}
                      >
                        Add
                      </button>
                    </Col>
                  </Row>
                  {exchangeTradingList.map((item, id) => (
                    <Row
                      key={id}
                      className="m-0 mb-3 py-2 rounded bg-secondary"
                    >
                      <Col>{item.exchangeName}</Col>
                      <Col className="text-center">
                        {truncateAddress(item.tradingAccount)}
                      </Col>
                      <Col className="text-right">
                        <FaCircleMinus
                          className="pointer"
                          onClick={() => removeExchange(id)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Row></Row>
                </FormGroup>
                <FormGroup className="mb-3">
                  <FormLabel htmlFor="title">Title</FormLabel>
                  <FormControl
                    id="title"
                    type="text"
                    name="title"
                    placeholder="Title"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.title || ""}
                  />
                  <small className="text-danger">
                    {touched.title && errors.title}
                  </small>
                </FormGroup>
                <FormGroup className="mb-3">
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <FormControl
                    id="description"
                    as="textarea"
                    rows={5}
                    name="description"
                    placeholder="Description"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.description || ""}
                  />
                  <small className="text-danger">
                    {touched.description && errors.description}
                  </small>
                </FormGroup>
                <FormGroup className="my-3">
                  <Row>
                    <Col>
                      <button
                        type="submit"
                        className="dao-btn w-100"
                        style={{
                          backgroundColor: "#8AB5FF",
                          color: "#0D0D15",
                          fontSize: "20px",
                        }}
                        disabled={!(isValid && dirty) || loading || iloading}
                      >
                        {loading ? (
                          <Spinner animation="border" variant="primary" />
                        ) : (
                          <>
                            <HiSpeakerphone className="icon" />
                            Create Voting
                          </>
                        )}
                      </button>
                    </Col>
                    {permitted && (
                      <Col>
                        <button
                          type="button"
                          className="dao-btn w-100"
                          style={{
                            backgroundColor: "#A2E6C2",
                            color: "#0D0D15",
                            fontSize: "20px",
                          }}
                          onClick={instanceHandleSubmit}
                          disabled={!(isValid && dirty) || iloading}
                        >
                          {iloading ? (
                            <Spinner animation="border" variant="dark" />
                          ) : (
                            <>
                              <BsLightningFill className="icon" />
                              Instance Exucute
                            </>
                          )}
                        </button>
                      </Col>
                    )}
                  </Row>
                </FormGroup>
              </Form>
            </Col>
          </Row>
          <Modal show={show} onHide={handleClose} centered>
            <Modal.Body className="py-3">
              <Row>
                <Col xs={9}>
                  <h5 className="px-3">Choose Target Address</h5>
                </Col>
                <Col className="text-right">
                  <span className="pointer" onClick={handleClose}>
                    <ImCross />
                  </span>
                </Col>
              </Row>
              {assets.map((item, index) => (
                <div
                  style={{ fontSize: "14px" }}
                  className="py-2 px-3 pointer permitted-remove"
                  key={index}
                  onClick={() => handleManualInputAddress(item)}
                >
                  <Row>
                    <Col className="d-flex align-items-center justify-content-between">
                      <div className="me-3">
                        {/* <img
                                                        src={item.logo_url}
                                                        alt={item.contract_name}
                                                        style={{ width: '30px', height: '30px' }}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = imageErrorSrc }}
                                                    /> */}
                        {truncateAddress(item.tAddress)}
                      </div>
                      <div>
                        <p className="m-0 p-0">{item.name}</p>
                      </div>
                    </Col>
                    {/* <Col className='text-right'>
                                                <p className='m-0 p-0'>{Number(item.balance / Math.pow(10, item.contract_decimals)).toFixed(6)}{' '}{item.contract_ticker_symbol}</p>
                                                <p className='m-0 p-0'>${Number(item.balance / Math.pow(10, item.contract_decimals)).toFixed(2)}</p>
                                            </Col> */}
                  </Row>
                </div>
              ))}
            </Modal.Body>
          </Modal>
          <Modal
            show={showExchangeTrading}
            onHide={handleCloseShowExchangeTrading}
            centered
          >
            <Modal.Body className="py-3">
              <div className="text-right">
                <ImCross onClick={handleCloseShowExchangeTrading} />
              </div>
              <Form onSubmit={excahngeTradingForm.handleSubmit}>
                <FormGroup className="mb-3">
                  <FormLabel>Exchange Name</FormLabel>
                  <FormControl
                    name="exchangeName"
                    value={excahngeTradingForm.values.exchangeName}
                    onBlur={excahngeTradingForm.handleBlur}
                    onChange={excahngeTradingForm.handleChange}
                  />
                  <small className="text-danger">
                    {excahngeTradingForm.touched.exchangeName &&
                      excahngeTradingForm.errors.exchangeName}
                  </small>
                </FormGroup>
                <FormGroup className="mb-3">
                  <FormLabel>Address</FormLabel>
                  <FormControl
                    name="tradingAccount"
                    value={excahngeTradingForm.values.tradingAccount}
                    onBlur={excahngeTradingForm.handleBlur}
                    onChange={excahngeTradingForm.handleChange}
                  />
                  <small className="text-danger">
                    {excahngeTradingForm.touched.tradingAccount &&
                      excahngeTradingForm.errors.tradingAccount}
                  </small>
                </FormGroup>
                <FormGroup className="text-right">
                  <button type="submit" variant="primary" className="dao-btn">
                    Save
                  </button>
                </FormGroup>
              </Form>
            </Modal.Body>
          </Modal>
        </Container>
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

export default AddMemberToTA;
