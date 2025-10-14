import { useWeb3React } from "@web3-react/core";
import api from "../../utils/api";
import { ethers } from "ethers";
import { useState } from "react";
import { useEffect } from "react";
import { Button, Col, Modal, Row } from "react-bootstrap";
import { HiUserAdd } from "react-icons/hi";
import { BiTransferAlt } from "react-icons/bi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { WALLETCONTEXT } from "../../contexts/walletContext";
import { truncateAddress } from "../../utils";
import ClipBoard from "../clipboard";
import Toastify from "../toast";
import axois from "../../utils/api";
import { networks } from "../../utils/networks";
import { ImCross } from "react-icons/im";
import { FaRegEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import TradingAccountValue from "./tradingAccountValue";
import { IoIosPersonAdd } from "react-icons/io";
const TradingAccount = ({ address, chainId, daoAddress, owner }) => {
  const { account, library } = useWeb3React();
  const navigate = useNavigate();
  const { getShopTAccountContract, dao } = WALLETCONTEXT();
  const [name, setName] = useState(null);
  const [members, setMembers] = useState(0);
  const [membersList, setMembersList] = useState([]);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  useEffect(() => {
    getInfo();
  }, [chainId, account]);
  const getInfo = async () => {
    try {
      const contract = await getShopTAccountContract(address);
      const name = await contract.name();
      setName(name);
      const members = await contract.getAllMembers(account);
      setMembersList(members);
      setMembers(members.length);
    } catch (error) {}
  };
  const handleFormSubmit = async (_main) => {
    if (!library) return;
    try {
      const contract = await dao(daoAddress);
      let timestamp = dayjs().unix();
      let iface = createForIface(_main);
      const txHash = await contract.getTxHash(address, iface, 0, 0, timestamp);
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
        target: address,
        title: `Remove Trader ${_main} with associated exchanges account`,
        description: "",
        chainId,
        value: 0,
        nonce: 0,
        createdAt: timestamp,
        timestamp: 0,
        txHash,
        creator: account,
      };
      await axois.post("/create/voting", body);
      navigate(`/dao/${daoAddress}/votingPage/${txHash}`);
    } catch (error) {
      Toastify("error", error);
    }
  };
  const createForIface = (to) => {
    let ABI = ["function burn(address _to)"];
    let iface = new ethers.utils.Interface(ABI);
    iface = iface.encodeFunctionData("burn", [to]);
    return iface;
  };
  //   const UserPermission = () => {
  //     let result = window.confirm("Are you sure?");
  //     if (result) {
  //       handleFormSubmit();
  //     }
  //   };
  return (
    <>
      <Row className="d-flex align-items-center">
        <Col className="mb-3 text-white ">
          <NavLink
            className="text-white"
            to={`/tradingAccount/${daoAddress}/${address}/${name}`}
          >
            <span>{truncateAddress(address)} </span>
          </NavLink>
          <ClipBoard address={address} />
        </Col>
        <Col className="mb-3 text-white text-center">
          <span>{name}</span>
        </Col>
        <Col className="mb-3 text-white text-center">
          <span>{members}</span>
        </Col>
        <Col className="mb-3 text-white">
          {owner && (
            <NavLink
              to={`/addMembertoTa/${daoAddress}?TA=${address}`}
              className="dao-btn d-inline-block text-center px-2 py-1 me-2"
              style={{ fontSize: "100%" }}
            >
              <HiUserAdd />
            </NavLink>
          )}
          {owner && (
            <NavLink
              className="dao-btn px-1 py-1 me-2 d-inline-block"
              to={`/sendCoin/${daoAddress}/?TA=${address}`}
            >
              <img
                src={networks[chainId].iconUrls}
                style={{ width: "25px" }}
                alt="matic_icon"
              />
            </NavLink>
          )}
          {owner && (
            <NavLink
              className={`dao-btn px-2 py-1 me-2`}
              to={`/sendToken/${daoAddress}/?TA=${address}`}
            >
              <BiTransferAlt />
            </NavLink>
          )}
          {owner && (
            <button className="dao-btn px-2 py-1 me-2" onClick={handleShow}>
              <FaRegEye />
            </button>
          )}
        </Col>
      </Row>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Body>
          <div className="text-right mb-3">
            <ImCross onClick={handleClose} />
          </div>
          {membersList.map((item, id) => (
            <Row key={id} className="m-0 mb-3 py-2">
              <Col>
                Trader: {truncateAddress(item.mainAddress)}{" "}
                <ClipBoard address={item.mainAddress} />
              </Col>
              <Col className="text-right">
                <Link
                  className="btn btn-info btn-sm me-3"
                  to={`/addSubMembertoTa/${daoAddress}/${address}/${item.mainAddress}`}
                >
                  <IoIosPersonAdd />
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleFormSubmit(item.mainAddress)}
                >
                  <MdDelete />
                </Button>
              </Col>
              <hr className="m-0 p-0 my-3" />
              <Row className="p-0 m-0">
                <Col className="">Account</Col>
                <Col className="text-right">Exchange</Col>
                <Col className="text-right">Balance</Col>
                <Col></Col>
              </Row>
              {item.subMembers.map((sItem, index) => (
                <div className="m-0 p-0" key={index}>
                  <TradingAccountValue
                    sItem={sItem}
                    _main={item.mainAddress}
                    daoAddress={daoAddress}
                    tokenAddress={address}
                  />
                </div>
              ))}
            </Row>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TradingAccount;
