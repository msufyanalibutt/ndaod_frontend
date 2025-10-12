import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Container,
  Form,
  FormGroup,
  Spinner,
  Placeholder,
  FormLabel,
  FormControl,
} from "react-bootstrap";
import SellSwap from "./sell";
import BuySwap from "./buy";
import axios from "axios";
import { networks } from "../../utils/networks";
import { useFormik } from "formik";
import * as yup from "yup";
import { useWeb3React } from "@web3-react/core";
import { WALLETCONTEXT } from "../../contexts/walletContext";
import { constants, ethers } from "ethers";
import Toastify from "../toast";
import { useNavigate } from "react-router-dom";
import { FiArrowDown } from "react-icons/fi";
import moment from "moment";
import api from "../../utils/api";
const Index = ({ senderAddress, searchParams }) => {
  const navigate = useNavigate();
  const { chainId, account } = useWeb3React();
  const { getCustomContract, getBridgeContract } = WALLETCONTEXT();
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [toAddress, setToAddress] = useState(null);
  const [fromAddress, setFromAddress] = useState(null);
  const [approved, setApproved] = useState(false);
  const [maxBalance, setMaxBalance] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const [txn, setTxn] = useState(null);
  useEffect(() => {
    if (chainId) {
      getTokens();
    }
  }, [chainId]);
  useEffect(() => {
    const tokenAddress = searchParams.get("tokenAddress");
    if (tokenAddress) {
      setFromAddress(tokenAddress);
    } else {
      setFromAddress(networks[chainId].inchCoin);
    }
  }, []);
  useEffect(() => {
    if (fromAddress && account) {
      getInfo();
    }
  }, [fromAddress, senderAddress]);
  useEffect(() => {
    if (chainId) {
      setToAddress(networks[chainId].bridge.bnbusdt);
    }
  }, [chainId]);
  useEffect(() => {
    if (fromAddress && chainId) {
      ApproveFromAddress();
    }
  }, [fromAddress, chainId]);
  const ApproveFromAddress = async () => {
    try {
      let url = `https://api.symbiosis.finance/crosschain/v1/stucked/${fromAddress}?partnerId=ndaod`;
      await axios.get(url);
    } catch (error) {}
  };
  const getInfo = async () => {
    try {
      if (fromAddress === networks[chainId].inchCoin) {
        setApproved(true);
        return;
      }
      if (!senderAddress) {
        return;
      }
      setLoading(true);
      const contract = await getCustomContract(fromAddress);
      let allowance = await contract.allowance(
        senderAddress,
        networks[chainId].symbosis
      );
      allowance = String(allowance);
      if (allowance > 0) {
        setApproved(true);
      } else {
        setApproved(false);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  const getTokens = async () => {
    try {
      const url = `/${networks[chainId].chainName}/tokenList`;
      const result = await api.post("/openOcean/api", { url });
      setTokens(result.data.data);
    } catch (error) {}
  };
  const getConversionRate = async (value, item) => {
    setErrMsg("");
    if (!value || value < 0) {
      return;
    } else {
      try {
        setLoading(true);
        let f = value * 0.005;
        let amount = (value - f) * Math.pow(10, values.fromdecimals);
        amount = amount.toLocaleString("fullwide", { useGrouping: false });
        let obj = {
          deadline:
            Number(moment.duration(Date.now()).asSeconds().toFixed(0)) +
            20 * 60,
          from: senderAddress || "0x333330cd9c430fae7536ed9684f511f229527e09",
          revertableAddress:
            senderAddress || "0x333330cd9c430fae7536ed9684f511f229527e09",
          slippage: 300,
          to: values.recipientAddress
            ? values.recipientAddress
            : senderAddress || "0x333330cd9c430fae7536ed9684f511f229527e09",
          tokenAmountIn: {
            decimals: values.fromdecimals,
            chainId: chainId,
            address:
              fromAddress === networks[chainId].inchCoin ? "" : fromAddress,
            amount: amount,
          },
          tokenOut: {
            address: toAddress === networks[chainId].inchCoin ? "" : toAddress,
            decimals: values.todecimals,
            chainId: values.toChainId,
          },
        };
        let url = `https://api.symbiosis.finance/crosschain/v1/swap?partnerId=ndaod`;
        let result = await axios.post(url, obj);
        result = result.data;
        let fee = result.fee;
        fee = fee.amount / Math.pow(10, fee.decimals);
        let tokenOut = result.tokenAmountOut;
        tokenOut = tokenOut.amount / Math.pow(10, tokenOut.decimals);
        setFieldValue("toBalance", tokenOut);
        setFieldValue("networkFee", fee);
        setTxn(result.tx);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        let msg = error.response.data.message;
        setErrMsg(msg);
        setFieldValue("toBalance", 0);
        setTxn(null);
      }
    }
  };
  const handleFormSubmit = async (body) => {
    if (!txn) return;
    if (senderAddress !== account) {
      if (networks[chainId].inchCoin === fromAddress) {
        const iface = createForIface(txn.data);
        moveToSwapToken(
          iface,
          txn.value ? ethers.utils.parseEther(values.fromBalance)._hex : 0
        );
      } else {
        const iface = createTokenForInterface(
          fromAddress,
          ethers.utils.parseEther(String(values.fromBalance)),
          txn.data
        );
        moveToSwapToken(iface, 0);
      }
      return;
    }
    try {
      setLoading(true);
      const contract = await getBridgeContract(networks[chainId].symbosis);
      const result = await contract.swapEth(txn.data, {
        value: ethers.utils.parseEther(values.fromBalance),
      });
      await result.wait();
      resetFields();
    } catch (error) {
      Toastify("error", error.message);
      setLoading(false);
    }
  };
  const formSchema = yup.object().shape({
    fromBalance: yup
      .number()
      .moreThan(0, "Must be more then 0")
      .test(
        "maxLength",
        `You must have enough ${networks[chainId].nativeCurrency.symbol} in addition to the amount to pay for gas`,
        function (value) {
          if (
            value === maxBalance &&
            fromAddress === networks[chainId].inchCoin
          ) {
            return false;
          } else {
            return true;
          }
        }
      )
      .test("maxLength", "Amount exceeds balance", function (value) {
        if (senderAddress) {
          if (maxBalance === 0 || value > maxBalance) {
            return false;
          } else {
            return true;
          }
        } else {
          return true;
        }
      })
      .required("This is required"),
    toBalance: yup
      .number()
      .moreThan(0, "Must be more then 0")
      .required("This is required"),
    networkFee: yup
      .number()
      .moreThan(-1, "Must be more then 0")
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
      .test("required", "This is required", function (value) {
        if (senderAddress === account) {
          return true;
        }
        if (value) {
          return ethers.utils.isAddress(value);
        } else {
          return false;
        }
      }),
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
    setFieldValue,
    resetForm,
  } = useFormik({
    onSubmit: handleFormSubmit,
    initialValues: {
      fromBalance: 0,
      toBalance: 0,
      fromName: "",
      toName: "",
      todecimals: 0,
      fromdecimals: 0,
      toChainId: 56,
      networkFee: -1,
      recipientAddress: "",
    },
    validationSchema: formSchema,
  });
  const addToken = async () => {
    try {
      setLoading(true);
      let value = constants.MaxUint256;
      if (senderAddress !== account) {
        moveToApprovedToken();
        return;
      }
      let contract = await getCustomContract(fromAddress);
      let result = await contract.approve(networks[chainId].symbosis, value);
      await result.wait();
      setLoading(false);
      getInfo();
    } catch (error) {
      Toastify("error", error.message);
      setLoading(false);
    }
  };
  const moveToApprovedToken = () => {
    let value = constants.MaxInt256;
    value = String(value);
    value = value.toLocaleString("fullwide", { useGrouping: false });
    navigate(
      `/approvedToken/${senderAddress}?targetAddress=${networks[chainId].symbosis}&tokenAddress=${fromAddress}&tokenAmount=${value}`,
      { replace: true }
    );
  };
  const resetFields = () => {
    setErrMsg("");
    setTxn(null);
    resetForm();
  };
  const moveToSwapToken = async (data, value) => {
    const { fromName, toName, fromBalance, toBalance } = values;
    navigate(
      `/customTransaction/${senderAddress}?targetAddress=${networks[chainId].symbosis}&data=${data}&value=${value}&title=Symbiosis: Cross-chain Swap ${fromName} to ${toName}&desc=Cross-chain Swap ${fromBalance} ${fromName} to ${toBalance} ${toName}`
    );
  };
  const createForIface = (data) => {
    let ABI = ["function swapEth(bytes data) "];
    let iface = new ethers.utils.Interface(ABI);
    iface = iface.encodeFunctionData("swapEth", [data]);
    return iface;
  };
  const createTokenForInterface = (fromToken, amount, data) => {
    let ABI = ["function swapToken(address,uint256,bytes) "];
    let iface = new ethers.utils.Interface(ABI);
    iface = iface.encodeFunctionData("swapToken", [fromToken, amount, data]);
    return iface;
  };
  return (
    <>
      <Container>
        <Form onSubmit={handleSubmit}>
          <FormGroup className="mb-3">
            <Row>
              <Col xs={12} xl={9} className="mx-auto text-white">
                <h4>Swap</h4>
                <SellSwap
                  tokens={tokens}
                  senderAddress={senderAddress}
                  tokenAddress={fromAddress}
                  setTokenAddress={setFromAddress}
                  searchParams={searchParams}
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleBlur={handleBlur}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  setFieldValue={setFieldValue}
                  getConversionRate={getConversionRate}
                  maxBalance={maxBalance}
                  setMaxBalance={setMaxBalance}
                  errMsg={errMsg}
                />
                <div className="my-3 d-flex justify-content-center align-items-center">
                  <div className="pointer no-replace-circle">
                    <FiArrowDown className="replaceicon" fontSize={"24px"} />
                  </div>
                </div>
                <div className="tabborder p-3">
                  <BuySwap
                    senderAddress={senderAddress}
                    tokenAddress={toAddress}
                    setTokenAddress={setToAddress}
                    recipientAddress={values.recipientAddress}
                    searchParams={searchParams}
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleBlur={handleBlur}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    setFieldValue={setFieldValue}
                    getConversionRate={getConversionRate}
                  />
                  <Row>
                    <Col xs={6} className="ms-auto text-right mb-2">
                      <FormLabel htmlFor="recipientAddress">
                        Recipient Address
                      </FormLabel>
                      <FormControl
                        type="text"
                        id="recipientAddress"
                        name="recipientAddress"
                        className="text-right"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.recipientAddress || ""}
                      />
                      <small className="text-danger">
                        {touched.recipientAddress && errors.recipientAddress}
                      </small>
                    </Col>
                    <Col xs={12} className="text-right text-muted">
                      {senderAddress !== account && (
                        <p>
                          DAO has a different address on a different blockchain{" "}
                          <br />
                          Recipient Address required when swapping on behalf of
                          a DAO
                        </p>
                      )}
                      {senderAddress === account && (
                        <p>
                          Optional. If not filled, will be sent to the sender's
                          address
                        </p>
                      )}
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </FormGroup>
          <Row>
            <Col xs={12} xl={9} className="mx-auto text-white">
              <FormGroup className="text-white">
                <Row>
                  <Col>
                    <p className="p-0 m-0">Rate:</p>
                  </Col>
                  <Col className="text-right">
                    {loading ? (
                      <Placeholder as="p" animation="glow">
                        <Placeholder xs={12} />
                      </Placeholder>
                    ) : (
                      <p className="p-0 m-0">
                        {values.toBalance > 0 && values.fromBalance > 0
                          ? `1 ${values.toName} = ${Number(
                              values.fromBalance / values.toBalance
                            ).toFixed(4)} ${values.fromName}`
                          : "Insert token amount to see rate"}
                      </p>
                    )}
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup className="text-white">
                <Row>
                  <Col>
                    <p className="p-0 m-0">Network Fee:</p>
                  </Col>
                  <Col className="text-right">
                    {loading ? (
                      <Placeholder as="p" animation="glow">
                        <Placeholder xs={4} />
                      </Placeholder>
                    ) : (
                      <p className="p-0 m-0 text-danger">
                        {values.networkFee > -1 ? values.networkFee : 0}$
                      </p>
                    )}
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup className="text-white">
                <Row>
                  <Col>
                    <p className="p-0 m-0">Slippage:</p>
                  </Col>
                  <Col className="text-right">
                    <p className="p-0 m-0">3%</p>
                  </Col>
                </Row>
              </FormGroup>
              <FormGroup className="mb-3 text-white">
                <Row>
                  <Col>
                    <p className="p-0 m-0">Swap Fee:</p>
                  </Col>
                  <Col className="text-right">
                    <p className="p-0 m-0">0.5%</p>
                  </Col>
                </Row>
              </FormGroup>
              {approved ? (
                <FormGroup className="mb-5">
                  <button
                    type="submit"
                    className="dao-btn w-100"
                    style={{
                      backgroundColor: "palegreen",
                      color: "#0D0D15",
                      fontSize: "20px",
                      fontWeight: "bold",
                    }}
                    disabled={!(isValid && dirty && senderAddress) || loading}
                  >
                    {loading ? (
                      <Spinner animation="border" variant="success" />
                    ) : (
                      "Cross-chain Swap"
                    )}
                  </button>
                </FormGroup>
              ) : (
                <FormGroup className="my-3">
                  <button
                    type="button"
                    className="dao-btn w-100"
                    style={{
                      backgroundColor: "#8AB5FF",
                      color: "#0D0D15",
                      fontSize: "20px",
                      fontWeight: "bold",
                    }}
                    disabled={loading}
                    onClick={addToken}
                  >
                    {loading ? (
                      <Spinner animation="border" variant="primary" />
                    ) : (
                      "Approved"
                    )}
                  </button>
                </FormGroup>
              )}
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
};

export default Index;
