import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useState } from "react";
import { useEffect } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { MdDelete } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { WALLETCONTEXT } from "../../contexts/walletContext";
import Toastify from "../toast";
import { truncateAddress } from "../../utils";
import ClipBoard from "../clipboard";
import api from "../../utils/api";

const TradingAccountValue = ({ sItem, _main, daoAddress, tokenAddress }) => {
  const { account, library, chainId } = useWeb3React();
  const navigate = useNavigate();
  const { dao } = WALLETCONTEXT();
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
  const handleFormSubmit = async (_sub) => {
    if (!library) return;
    try {
      const contract = await dao(daoAddress);
      let timestamp = dayjs().unix();
      let iface = createForIface(_main, _sub);
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
      let body = {
        signature,
        data: iface,
        hex_signature: String(iface).slice(0, 10),
        daoAddress: daoAddress,
        target: tokenAddress,
        title: `Remove ${_sub} exchange account`,
        description: "",
        chainId,
        value: 0,
        nonce: 0,
        createdAt: timestamp,
        timestamp: 0,
        txHash,
        creator: account,
      };
      await api.post("/create/voting", body);
      navigate(`/dao/${daoAddress}/votingPage/${txHash}`);
    } catch (error) {
      Toastify("error", error);
    }
  };
  const createForIface = (main, sub) => {
    let ABI = ["function removeSubMember(address _main, address _sub)"];
    let iface = new ethers.utils.Interface(ABI);
    iface = iface.encodeFunctionData("removeSubMember", [_main, sub]);
    return iface;
  };
  return (
    <>
      <Row className="m-0 p-0">
        <Col className="">
         
          {truncateAddress(sItem.subAddress)}{" "}
          <ClipBoard address={sItem.subAddress} />
        </Col>
        <Col className="text-center">{sItem.name}</Col>
        <Col className="text-right">${Number(value).toFixed(2)}</Col>
        <Col className="text-right">
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleFormSubmit(sItem.subAddress)}
          >
            <MdDelete />
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default TradingAccountValue;
