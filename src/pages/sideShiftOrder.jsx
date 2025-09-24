import axios from "axios";
import moment from "moment";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Modal,
  Form,
  FormGroup,
  FormLabel,
  FormControl,
  Spinner,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { IoMdClose } from "react-icons/io";
import { useFormik } from "formik";
import * as yup from "yup";
import ClipBoard from "../components/clipboard";
import { truncateAddress } from "../utils";
import { useWeb3React } from "@web3-react/core";
import dayjs from "dayjs";
import { WALLETCONTEXT } from "../contexts/walletContext";
import { ethers } from "ethers";
import depositCoins from "../utils/tokensList.json";
import Toastify from "../components/toast";
import axois from "../utils/api";
const SideShiftOrder = () => {
  const { id, sender } = useParams();
  const { library, account, chainId } = useWeb3React();
  const { getSigner, getCustomContract, dao } = WALLETCONTEXT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState();
  const [order, setOrder] = useState(null);
  const [depositCoin, setDepositCoin] = useState(null);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    getOrderDetail();
  }, []);
  const getOrderDetail = async () => {
    try {
      setLoading(true);
      const result = await axios.get(
        `https://sideshift.ai/api/v2/shifts/${id}`
      );
      let order = result.data;
      if (order) {
        let i = depositCoins.filter((item) => {
          if (
            item["Network"] === String(order.depositNetwork).toUpperCase() &&
            item["Coin"] === String(order.depositCoin).toUpperCase()
          ) {
            return true;
          } else {
            return false;
          }
        });
        console.log(i);
        setDepositCoin(i[0]);
      }
      setOrder(result.data);
      setLoading(false);
    } catch (error) {}
  };
  const handleFormSubmit = async ({ amount }) => {
    if (!library) return;
    try {
      setLoading(true);
      const signer = getSigner();
      if (sender === account) {
        console.log("here");
        console.log(depositCoin);
        if (depositCoin.Address === ethers.constants.AddressZero) {
          console.log("here");

          const transactionParameters = {
            from: sender,
            to: order.depositAddress,
            value: ethers.utils.parseEther(String(amount)),
          };
          const result = await signer.sendTransaction(transactionParameters);
          await result.wait();
        } else {
          console.log("here");

          const contract = await getCustomContract(depositCoin.Address);
          const balance = await contract.balanceOf(account)
          console.log(balance);
          const decimals = await contract.decimals();
          let value = amount * Math.pow(10, decimals);
          value = `0x${value.toString(16)}`;
          const result = await contract.transfer(order.depositAddress, value);
          await result.wait();
        }
        Toastify("success", "Successfully Transfer!");
        navigate("/sideshift");
      } else {
        if (depositCoin.Address === ethers.constants.AddressZero) {
          console.log("here");

          const contract = await dao(sender);
          let timestamp = dayjs().unix();
          let { iface, value } = createForIfaceZeroAddress(amount);
          const txHash = await contract.getTxHash(
            order.depositAddress,
            iface,
            value,
            0,
            timestamp
          );
          const signature = await library.provider.request({
            method: "personal_sign",
            params: [txHash, account],
          });
          let body = {
            signature,
            data: iface,
            hex_signature: String(iface).slice(0, 10),
            daoAddress: sender,
            target: order.depositAddress,
            title: `Send ${amount} ${depositCoin.Coin} to ${order.depositAddress}`,
            description: `Sending ${depositCoin.Coin} From Dao Using SideShift`,
            chainId,
            value: ethers.utils.formatEther(value),
            nonce: 0,
            createdAt: timestamp,
            timestamp: 0,
            txHash,
            creator: account,
          };
          await axois.post("/create/voting", body);
          setLoading(false);
          navigate(`/dao/${sender}/votingPage/${txHash}`);
        } else {
          console.log("here");
          const contract = await dao(sender);
          const dContract = await getCustomContract(depositCoin.Address);
          const decimal = await dContract.decimals();
          let timestamp = dayjs().unix();
          let iface = createForIface(order.depositAddress, amount, decimal);
          const txHash = await contract.getTxHash(
            depositCoin.Address,
            iface,
            0,
            0,
            timestamp
          );
          const signature = await library.provider.request({
            method: "personal_sign",
            params: [txHash, account],
          });
          let body = {
            signature,
            data: iface,
            hex_signature: String(iface).slice(0, 10),
            daoAddress: sender,
            target: depositCoin.Address,
            title: `Send ${amount} ${depositCoin.Coin} to ${order.depositAddress}`,
            description: `Sending ${depositCoin.Coin} From Dao Using SideShift`,
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
          navigate(`/dao/${sender}/votingPage/${txHash}`);
        }
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
      if (error && error.data) {
        Toastify("error", error.data.message);
      } else {
        Toastify("error", error.message);
      }
    }
  };
  const createForIfaceZeroAddress = (amount) => {
    let iface = "0x";
    let value = ethers.utils.parseEther(String(amount));
    console.log(value)
    return { iface, value };
  };
  const createForIface = (recipientAddress, amount, decimal) => {
    let ABI = ["function transfer(address recipientAddress, uint256 amount)"];
    let iface = new ethers.utils.Interface(ABI);
    let value = amount * Math.pow(10, decimal);
    value = `0x${value.toString(16)}`;
    iface = iface.encodeFunctionData("transfer", [recipientAddress, value]);
    return iface
    // const ABI = ["function transfer(address to, uint256 value)"];
    // const iface = new ethers.utils.Interface(ABI);
    // console.log(decimal)
    // // Convert amount into correct wei-like format
    // const value = ethers.utils.parseUnits(amount.toString(), decimal);
    // console.log(value)
    // // Encode calldata
    // return iface.encodeFunctionData("transfer", [recipientAddress, value]);
  };
  const formSchema = yup.object().shape({
    amount: yup
      .number()
      .test(
        "minLength",
        `Minimum ${order && order.depositMin} ${order && order.depositCoin}`,
        function (value) {
          return value >= order.depositMin;
        }
      )
      .test(
        "maxLength",
        `Maximum ${order && order.depositMax} ${order && order.depositCoin}`,
        function (value) {
          return value <= order.depositMax;
        }
      )
      .required("This is required"),
  });
  const {
    values,
    errors,
    touched,
    handleBlur,
    handleChange,
    handleSubmit,
    isValid,
    dirty,
  } = useFormik({
    onSubmit: handleFormSubmit,
    initialValues: { amount: 0 },
    validationSchema: formSchema,
  });
  return (
    <>
      <Container className="py-3 text-white">
        <Row>
          <Col xs={12} lg={6} className="mx-auto">
            {order && (
              <div className="tabborder p-3">
                <Row>
                  <Col>
                    <span>From: {order.depositCoin}</span>{" "}
                    <span>To: {order.settleCoin}</span>
                  </Col>
                  <Col className="text-right">
                    <h6>ORDER</h6>
                    <p>{order.id}</p>
                  </Col>
                </Row>
                <h4 className="text-center">
                  Waiting for you to send {order.depositCoin}
                </h4>
                <h5 className="text-primary">To Address</h5>
                <p>
                  {truncateAddress(order.depositAddress)}{" "}
                  <ClipBoard address={order.depositAddress} />
                </p>
                <div>
                  <h6 className="text-center">Please send</h6>
                  <Row>
                    <Col xs={6} className="mx-auto">
                      <Row>
                        <Col xs={3}>Min:</Col>
                        <Col>
                          {order.depositMin} {order.depositCoin}
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={3}>Max:</Col>
                        <Col>
                          {order.depositMax} {order.depositCoin}
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
                <div className="text-center my-3">
                  <button
                    type="button"
                    className="dao-btn"
                    onClick={handleShow}
                    disabled={
                      depositCoin && chainId !== Number(depositCoin.ChainId)
                    }
                  >
                    Send
                  </button>
                </div>
                {depositCoin && chainId !== Number(depositCoin.ChainId) && (
                  <div className="text-center">
                    <div
                      className="dao-warning-btn text-white d-inline-block mx-auto px-3 py-2"
                      style={{ fontSize: "16px" }}
                    >
                      Wrong network. Switch to {depositCoin.Network}!
                    </div>
                  </div>
                )}
                <Row>
                  <Col>
                    <h5>Receiving Address</h5>
                    <p>{truncateAddress(order.settleAddress)}</p>
                  </Col>
                  <Col className="text-right">
                    <h5>Created At</h5>
                    <p>{moment(order.createdAt).format("YYYY-MM-DD hh:mm")}</p>
                  </Col>
                </Row>
                <Modal centered show={show} onHide={handleClose}>
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
                    <div className="text-center">
                      <h5>
                        Send {order.depositCoin} (
                        {String(order.depositNetwork).toUpperCase()})
                      </h5>
                      <Form onSubmit={handleSubmit}>
                        <FormGroup className="mb-3">
                          <FormLabel htmlFor="amount" as="h4">
                            Amount
                          </FormLabel>
                          <FormControl
                            id="amount"
                            type="number"
                            name="amount"
                            placeholder={order.depositCoin}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.amount}
                          />
                          <small className="text-danger">
                            {touched.amount && errors.amount}
                          </small>
                        </FormGroup>
                        <FormGroup>
                          <button
                            type="submit"
                            className="dao-btn"
                            disabled={!(isValid && dirty) || loading}
                          >
                            {loading ? (
                              <Spinner animation="border" variant="info" />
                            ) : (
                              "Confirm"
                            )}
                          </button>
                        </FormGroup>
                      </Form>
                    </div>
                  </Modal.Body>
                </Modal>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};
export default SideShiftOrder;
