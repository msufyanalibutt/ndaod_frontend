import { useWeb3React } from "@web3-react/core";
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { WALLETCONTEXT } from "../contexts/walletContext";
import ConnectWallet from "../components/sidebar/connectWallet";
import { HiLockOpen } from "react-icons/hi";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { truncateAddress } from "../utils";
import Toastify from "../components/toast";
import { ethers } from "ethers";
import dayjs from "dayjs";
import api from "../utils/api";
import ClipBoard from "../components/clipboard";
import TradingAccountAsset from "../components/dao/tradingAccountAssets";
import { GiJoint } from "react-icons/gi";

const DeleteTradingAccount = ({ address, tAddress, owner, member }) => {
  const { library, chainId, account } = useWeb3React();
  const { dao } = WALLETCONTEXT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async () => {
    if (!library) return;
    try {
      setLoading(true);
      const contract = await dao(address);
      let timestamp = dayjs().unix();
      let iface = createForIface(member);
      const txHash = await contract.getTxHash(tAddress, iface, 0, 0, timestamp);
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
        target: tAddress,
        title: `Remove Trader ${member}`,
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
      setLoading(false);
      navigate(`/dao/${address}/votingPage/${txHash}`);
    } catch (error) {
      Toastify("error", error);
      setLoading(false);
    }
  };
  const createForIface = (to) => {
    let ABI = ["function burn(address _to)"];
    let iface = new ethers.utils.Interface(ABI);
    iface = iface.encodeFunctionData("burn", [to]);
    return iface;
  };
  const UserPermission = () => {
    let result = window.confirm("Are you sure?");
    if (result) {
      handleFormSubmit();
    }
  };
  return (
    <button
      type="button"
      className="dao-btn-danger"
      disabled={loading}
      onClick={UserPermission}
    >
      {loading ? <Spinner animation="border" variant="danger" /> : "Remove"}
    </button>
  );
};
const TradingAccount = () => {
  const { account, active, chainId, library } = useWeb3React();
  const { dao } = WALLETCONTEXT();
  const { address, tAddress, name } = useParams();
  const [owner, setOwner] = useState(false);
  const [members, setMembers] = useState([]);
  const [taBalance, setTaBalance] = useState(0);
  const [assets, setAssets] = useState([]);
  useEffect(() => {
    if (active && account) {
      getMembers();
      getDaoOwners(address);
      getTotalFunds();
    }
  }, [account, active, chainId]);
  const getDaoOwners = async (address) => {
    try {
      const contract = await dao(address);
      const balanceOf = await contract.balanceOf(account);
      if (String(balanceOf) > 0) {
        setOwner(true);
      } else {
        setOwner(false);
      }
    } catch (error) {}
  };
  const getMembers = async () => {
    const url = `/erc20/${tAddress}/owners?chain=matic`;
    try {
      const result = await api.post("/moralis/api", { url });
      let items = result.data.result;
      setMembers(items);
    } catch (error) {}
  };
  const getTotalFunds = async () => {
    const url = `/wallets/${tAddress}/tokens?chain=matic`;
    try {
      const result = await api.post("/moralis/api", { url });
      let items = result.data.result;
      setAssets(items);
      let aum = 0;
      items.map((item) => {
        // console.log(item);
        aum += item.usd_price * item.balance_formatted;
        return item;
      });
      setTaBalance(aum);
    } catch (error) {}
  };
  return (
    <>
      {active ? (
        <Container>
          <Container>
            <Row>
              <Col xs={12} xl={7} className="mx-auto py-3">
                <NavLink
                  className="dao-btn btn d-block"
                  to={`/createTa/${address}`}
                >
                  Create Trading Account
                </NavLink>
              </Col>
            </Row>
          </Container>
          <Container>
            <Row>
              <Col xs={12} xl={7} className="mx-auto py-3">
                <Row>
                  <Col>
                    <span className="text-white">
                      {name}: {truncateAddress(tAddress)}{" "}
                      <ClipBoard address={tAddress} />
                    </span>
                  </Col>
                  <Col className="text-right text-white">
                    <h6>
                      AUM : $
                      {new Intl.NumberFormat("en-US", {
                        maximumFractionDigits: 2,
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(taBalance)}
                    </h6>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>

          <Container>
            <Row>
              <Col xs={12} xl={7} className="mx-auto py-3">
                <div className="myassets text-white tabborder mb-3 p-3">
                  {account && (
                    <TradingAccountAsset
                      owner={owner}
                      assets={assets}
                      chainId={chainId}
                      address={address}
                      tAddress={tAddress}
                    />
                  )}
                </div>
              </Col>
            </Row>
          </Container>
          <Container>
            <Row>
              <Col xs={12} xl={7} className="mx-auto mb-3">
                <NavLink
                  className="dao-btn d-block text-center"
                  to={`/connectTA/${address}/${name}`}
                >
                  <GiJoint /> Connect
                </NavLink>
              </Col>
            </Row>
          </Container>
          <Container>
            <Row>
              <Col xs={12} xl={7} className="mx-auto py-1">
                <Row>
                  <Col className="mb-3 text-white">
                    <span>Traders</span>
                  </Col>
                  <Col className="mb-3 text-white"></Col>
                </Row>
              </Col>
              <Col xs={12} xl={7} className="mx-auto">
                {members &&
                  members.length > 0 &&
                  members.map((item, index) => (
                    <Row
                      xs={2}
                      key={index}
                      className="d-flex align-items-center"
                    >
                      <Col className="mb-3 text-white">
                        <NavLink
                          className={"text-white"}
                          to={`/profile/${item.owner_address}`}
                        >
                          {truncateAddress(item.owner_address)}{" "}
                          <ClipBoard address={item.owner_address} />
                        </NavLink>
                      </Col>
                      <Col className="mb-3 text-white  text-right">
                        {owner && (
                          <DeleteTradingAccount
                            address={address}
                            tAddress={tAddress}
                            owner={owner}
                            member={item.owner_address}
                          />
                        )}
                      </Col>
                    </Row>
                  ))}
              </Col>
            </Row>
          </Container>
        </Container>
      ) : (
        <div className="text-center my-5 mx-auto" style={{ maxWidth: "300px" }}>
          <ConnectWallet
            icon={<HiLockOpen className="ndaod-button-icon" />}
            text={"Connect Wallet"}
          />
        </div>
      )}
    </>
  );
};
export default TradingAccount;
