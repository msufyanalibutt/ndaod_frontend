import React, { useEffect, useState } from "react";
import {
  Form,
  FormGroup,
  FormLabel,
  Modal,
  ModalBody,
  FormControl,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import { useFormik } from "formik";
import * as yup from "yup";
import { truncateAddress } from "../../utils";
import { constants } from "ethers";
import Toastify from "../toast";
import ConnectWallet from "../sidebar/connectWallet";
import { HiLockOpen } from "react-icons/hi";
import { ImCross } from "react-icons/im";

const PublicModalOffer = ({
  openModal,
  setOpenModal,
  getCustomContract,
  account,
  active,
  currency,
  symbol,
  rate,
  ShopLp_contract_address,
  name,
  daoAddress,
  getShopLPContract,
}) => {
  const [approved, setApproved] = useState(false);
  const [balanceOf, SetbalanceOf] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (account) {
      getInfo();
    }
  }, [account]);
  const getInfo = async () => {
    try {
      setLoading(true);
      const contract = await getCustomContract(currency);
      let allowance = await contract.allowance(
        account,
        ShopLp_contract_address
      );
      let balanceOf = await contract.balanceOf(account);
      let decimals = await contract.decimals();
      SetbalanceOf(String(balanceOf) / Math.pow(10, decimals)); // GLD Balance
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
  const handleFormSubmit = async ({ lpAmount }) => {
    let value = lpAmount * 1e18;
    value = `0x${value.toString(16)}`;
    try {
      setLoading(true);
      let contract = await getShopLPContract();
      let result = await contract.buyPublicOffer(daoAddress, value);
      await result.wait();
      setLoading(false);
      setOpenModal(false);
    } catch (error) {
      Toastify("error", error);
      setLoading(false);
    }
  };
  const formSchema = yup.object().shape({
    lpAmount: yup
      .number()
      .required("This is required"),
    targetAmount: yup
      .number()
      .test(
        "maxLenght",
        `Low balance. Current balance is ${new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 2,
          notation: "compact",
          compactDisplay: "short",
        }).format(balanceOf)} ${symbol}`,
        function (value) {
          if (balanceOf < value) {
            return false;
          } else {
            return true;
          }
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
    setFieldValue,
    isValid,
    dirty,
  } = useFormik({
    validateOnChange: true,
    onSubmit: handleFormSubmit,
    initialValues: {
      lpAmount: "",
      targetAmount: "",
    },
    validationSchema: formSchema,
  });
  const changelPAmount = (e) => {
    handleChange(e);
    let value = e.target.value;
    setFieldValue("targetAmount", value * rate);
  };
  const changeTargetAmount = (e) => {
    handleChange(e);
    let value = e.target.value;
    setFieldValue("lpAmount", value / rate);
  };
  const addToken = async () => {
    try {
      let value = String(constants.MaxUint256);
      setLoading(true);
      let contract = await getCustomContract(currency);
      let result = await contract.approve(ShopLp_contract_address, value);
      await result.wait();
      setLoading(false);
      getInfo();
    } catch (error) {
      Toastify("error", error.message);
      setLoading(false);
    }
  };
  return (
    <Modal show={openModal} onHide={setOpenModal}>
      {active ? (
        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Row>
                <Col>
                  <h4>{name}</h4>
                  <p>{truncateAddress(daoAddress)}</p>
                </Col>
                <Col className="text-right">
                  <span className="pointer" onClick={() => setOpenModal(false)}>
                    <ImCross />
                  </span>
                </Col>
              </Row>
              <hr />
            </FormGroup>
            <FormGroup className="mb-3">
              <FormLabel htmlFor="lpAmount"> Lp amount</FormLabel>
              <FormControl
                type="text"
                id="lpAmount"
                name="lpAmount"
                placeholder="LP Amount"
                onChange={(e) => {
                  changelPAmount(e);
                }}
                onBlur={handleBlur}
                value={values.lpAmount || ""}
                disabled={!approved}
              />
              {touched.lpAmount && errors.lpAmount ? (
                <small className="text-danger">{errors.lpAmount}</small>
              ) : (
                <small className="text-muted">
                  Enter LP amount you want to buy
                </small>
              )}
            </FormGroup>
            <FormGroup className="mb-3">
              <FormLabel htmlFor="targetAmount">{symbol} amount</FormLabel>
              <FormControl
                type="text"
                id="targetAmount"
                name="targetAmount"
                placeholder="0"
                onChange={(e) => {
                  changeTargetAmount(e);
                }}
                onBlur={handleBlur}
                value={values.targetAmount || ""}
                disabled={!approved}
              />
              <small className="text-danger">
                {touched.targetAmount && errors.targetAmount}
              </small>
            </FormGroup>
            <FormGroup>
              {approved ? (
                <button
                  type="submit"
                  className="dao-btn w-100"
                  disabled={!(isValid && dirty) || loading}
                >
                  {loading ? (
                    <Spinner animation="border" variant="primary" />
                  ) : (
                    "Buy LP"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={addToken}
                  className="dao-btn w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation="border" variant="primary" />
                  ) : (
                    "Approve"
                  )}
                </button>
              )}
            </FormGroup>
          </Form>
        </ModalBody>
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
    </Modal>
  );
};

export default PublicModalOffer;
