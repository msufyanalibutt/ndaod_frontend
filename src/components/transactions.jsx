import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import api from "../utils/api";
import moment from "moment";
import { ethers } from "ethers";
import { truncateAddress } from "../utils";
import { networks } from "../utils/networks";
import { ImNewTab } from "react-icons/im";
const Transactions = ({ chainId, address, account }) => {
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    getTransactions();
  }, [chainId, address]);
  const getTransactions = async () => {
    try {
      const url = `/${address}?chain=matic&order=DESC&limit=100`
      const result = await api.post("/moralis/api", { url });
      setTransactions(result.data.result);
    } catch (error) {}
  };
  return (
    <>
      <Row>
        <Col>
          <h4 className="text-white">Transaction History</h4>
        </Col>
        <Col className="text-right mb-3">
          <a
            href={`${networks[chainId].blockExplorerUrls}/address/${account}`}
            target={"_blank"}
            className="dao-btn p-2 d-flex justify-content-center ms-auto"
            style={{ maxWidth: "150px" }}
          >
            <img
              style={{ maxWidth: "25px" }}
              className="img-fluid rounded-circle"
              src={networks[chainId].iconUrls[0]}
              alt={networks[chainId].nativeCurrency.name}
            />
            &nbsp;
            {networks[chainId].nativeCurrency.name}
          </a>
        </Col>
      </Row>
      <Row>
        <Col>TXHASH</Col>
        <Col>DATE</Col>
        <Col>TIME</Col>
        <Col>GAS FEE</Col>
      </Row>
      {transactions && transactions.length > 0 ? (
        <>
          {transactions.map((transaction, index) => (
            <Row key={index}>
              <Col className="py-3">
                <a
                  rel="noopener noreferrer"
                  href={`${networks[chainId].blockExplorerUrls}/tx/${transaction.hash}`}
                  target="_blank"
                  className="text-white"
                >
                  {truncateAddress(transaction.hash)}
                </a>
                &nbsp;
                <ImNewTab />
              </Col>
              <Col className="py-3">
                {moment(transaction.block_timestamp).format("ddd,DD MMM YYYY")}
              </Col>
              <Col className="py-3">
                {moment(transaction.block_timestamp).format("hh:mm")}
              </Col>
              <Col className="py-3">
                ${Number(
                  transaction.transaction_fee
                ).toFixed(2)}
              </Col>
            </Row>
          ))}
        </>
      ) : (
        <div className="text-white py-4 text-center">
          You don't have any transaction
        </div>
      )}
    </>
  );
};

export default Transactions;
