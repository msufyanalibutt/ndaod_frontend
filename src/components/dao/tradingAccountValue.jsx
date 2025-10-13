import { useWeb3React } from "@web3-react/core";
import api from "../../utils/api";
import { ethers } from "ethers";
import { useState } from "react";
import { useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import Toastify from "../toast";
import { truncateAddress } from "../../utils";
import ClipBoard from "../clipboard";

const TradingAccountValue = ({ sItem }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    apiCall();
  }, []);
  const apiCall = async () => {
    const result = await api.post("/hplCall/api", {
      address: sItem.subAddress,
    });
    const accountValue = result.data?.marginSummary?.accountValue || 0;
    setValue(accountValue);
    try {
    } catch (error) {
      Toastify("error", error.message);
    }
  };
  return (
    <>
      <Row className="m-0 p-0">
        <Col className="">
          {truncateAddress(sItem.subAddress)}{" "}
          <ClipBoard address={sItem.subAddress} />
        </Col>
        <Col className="text-right">{sItem.name}</Col>
        <Col className="text-right">{Number(value).toFixed(2)}</Col>
      </Row>
    </>
  );
};

export default TradingAccountValue;
