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

const AddSubMemberToTA = () => {
  const [loading, setLoading] = useState(false);
  const [iloading, setiLoading] = useState(false);
  const [owner, setOwner] = useState(false);
  const [permitted, setPermitted] = useState(false);
  const [assets, setAssets] = useState([]);
  const { chainId, account, active, library } = useWeb3React();
  const { dao, getShopTaContract, getShopTAccountContract } = WALLETCONTEXT();
  const { daoAddress, taAddress, mainAddress } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (account && active && chainId) {
      getDaoMembers(daoAddress);
    }
  }, [account, active, chainId]);
  const handleFormSubmit = async ({
    title,
    description,
    exchangeName,
    tradingAccount,
  }) => {
    if (!library) return;
    try {
      setLoading(true);
      const contract = await dao(daoAddress);
      let timestamp = dayjs().unix();
      let iface = createForIface(mainAddress, tradingAccount, exchangeName);
      const txHash = await contract.getTxHash(
        taAddress,
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
        daoAddress: daoAddress,
        target: taAddress,
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
      navigate(`/dao/${daoAddress}/votingPage/${txHash}`);
    } catch (error) {
      Toastify("error", error.message);
      setLoading(false);
    }
  };
  const instanceHandleSubmit = async () => {
    const { title, description, exchangeName, tradingAccount } = values;
    if (!library) return;
    try {
      setiLoading(true);
      const contract = await dao(daoAddress);
      let timestamp = dayjs().unix();
      let iface = createForIface(mainAddress, tradingAccount, exchangeName);
      const txHash = await contract.getTxHash(
        taAddress,
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
      const result = await contract.executePermitted(taAddress, iface, 0);
      Toastify("info", "Instant Execution Started");
      await result.wait();
      Toastify("success", "Instant Execution Success");
      let body = {
        signature,
        data: iface,
        hex_signature: String(iface).slice(0, 10),
        daoAddress: daoAddress,
        target: taAddress,
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
  const createForIface = (main, sub, subName) => {
    const ABI = [
      "function addSubMember(address _main, address _sub, string _subName)",
    ];
    const iface = new ethers.utils.Interface(ABI);
    const data = iface.encodeFunctionData("addSubMember", [main, sub, subName]);
    return data;
  };
  const formSchema = yup.object().shape({
    title: yup.string().required("Title is required"),
    description: yup.string(),
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
      exchangeName: "",
      tradingAccount: "",
    },
    validationSchema: formSchema,
  });

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
                  <FormLabel as={"p"}>{taAddress}</FormLabel>
                </FormGroup>
                <FormGroup className="mb-3">
                  <FormLabel htmlFor="recipientAddress">
                    Trader Account Address
                  </FormLabel>
                  <FormLabel>{mainAddress}</FormLabel>
                </FormGroup>
                <FormGroup className="mb-3">
                  <FormLabel>Exchange Name</FormLabel>
                  <FormControl
                    name="exchangeName"
                    value={values.exchangeName}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  <small className="text-danger">
                    {touched.exchangeName && errors.exchangeName}
                  </small>
                </FormGroup>
                <FormGroup className="mb-3">
                  <FormLabel>Address</FormLabel>
                  <FormControl
                    name="tradingAccount"
                    value={values.tradingAccount}
                    onBlur={handleBlur}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value) {
                        setFieldValue("title", `Add member ${e.target.value}`);
                      }
                    }}
                  />
                  <small className="text-danger">
                    {touched.tradingAccount && errors.tradingAccount}
                  </small>
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

export default AddSubMemberToTA;
