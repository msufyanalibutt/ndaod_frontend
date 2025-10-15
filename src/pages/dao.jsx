import React, { useEffect, useState } from "react";
import { Row, Col, Container, Tabs, Tab, Table } from "react-bootstrap";
import { IoIosPeople } from "react-icons/io";
import { HiLockOpen, HiSpeakerphone } from "react-icons/hi";
import { BsFillPersonPlusFill } from "react-icons/bs";
import { FaWallet } from "react-icons/fa";
import { NavLink, useParams } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
// import axois from '../utils/api';
import { WALLETCONTEXT } from "../contexts/walletContext";
import { truncateAddress } from "../utils";
import { index_contract_address } from "../utils";
import VotingList from "../components/voting/VotingList";
import Members from "../components/dao/members";
import { ethers, constants } from "ethers";
import Transactions from "../components/transactions";
import LPToken from "../components/lp";
import LpMember from "../components/dao/lpMember";
import TradingAccount from "../components/dao/tradingAccount";
import MyAssets from "../components/Balance/myAssets";
import DaoConfiguration from "../components/lp/daoConfiguration";
import ConnectWallet from "../components/sidebar/connectWallet";
import Toastify from "../components/toast";
import ClipBoard from "../components/clipboard";
import api from "../utils/api";
const DAO = () => {
  const { address } = useParams();
  const {
    dao,
    getDaoViewerContract,
    getLpContract,
    getShopTaContract,
    getShopTAccountContract,
  } = WALLETCONTEXT();
  const [daoConfig, setDaoConfig] = useState({
    gtMintable: false,
    gtBurnable: false,
    lpAddress: null,
    lpMintable: false,
    lpBurnable: false,
    lpMintableStatusFrozen: false,
    lpBurnableStatusFrozen: false,
    permittedLength: 0,
    adaptersLength: 0,
    monthlyCost: 0,
    numberOfPrivateOffers: 0,
  });
  const [assets, setAssets] = useState([]);
  const [daoBalance, setDaoBalance] = useState(0);
  const [quarom, setQuarom] = useState(0);
  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [lpMembers, setLpMembers] = useState([]);
  const [taAccounts, setTaAccounts] = useState([]);
  const { account, chainId, active, library } = useWeb3React();
  const [owner, setOwner] = useState(false);
  const [hyperLiquidBalances, setHyperLiquidBalances] = useState([]);
  useEffect(() => {
    if (account && active && chainId) {
      getDaoOwners(address);
      getDao(address);
      getDaoMembers(address);
      getTradingAccounts();
    }
  }, [account, active, chainId, address]);
  useEffect(() => {
    if (active && chainId) {
      getDaoAssets(address);
    }
  }, [chainId, address]);

  useEffect(() => {
    if (!Array.isArray(taAccounts) || !taAccounts.length) return;

    const timeout = setTimeout(() => {
      getBatchHPL();
    }, 500); // wait 0.5 sec before calling

    return () => clearTimeout(timeout);
  }, [taAccounts]);

  const getBatchHPL = async () => {
    try {
      if (!taAccounts || taAccounts.length === 0) return;
      const results = await Promise.allSettled(
        taAccounts.map(async (address) => {
          try {
            const contract = await getShopTAccountContract(address);
            const members = await contract.getAllMembers(account);
            return { account, members };
          } catch (err) {
            return { account, error: err.message };
          }
        })
      );
      const success = results
        .filter((r) => r.status === "fulfilled" && !r.value.error)
        .map((r) => {
          return r.value;
        });
      const addresses = success.flatMap((item) =>
        item.members.flatMap((member) =>
          (member.subMembers || []).map((sub) => sub.subAddress)
        )
      );
      if (address.length === 0) return;
      const result = await api.post("/hplCall/api/batch", { addresses });
      setHyperLiquidBalances(result.data.data);
      setDaoBalance(daoBalance + result.data.total);
    } catch (error) {}
  };
  const getDao = async (address) => {
    try {
      let contract = await dao(address);
      const name = await contract.name();
      setName(name);
      const quarom = await contract.quorum();
      setQuarom(String(quarom));
      contract = await getDaoViewerContract();
      const daoconf = await contract.getDaoConfiguration(
        index_contract_address[chainId],
        address
      );
      setDaoConfig({
        adaptersLength: ethers.utils.formatEther(daoconf.adaptersLength),
        gtBurnable: daoconf.gtBurnable,
        gtMintable: daoconf.gtMintable,
        lpBurnable: daoconf.lpBurnable,
        lpMintable: daoconf.lpMintable,
        lpAddress:
          constants.AddressZero === daoconf.lpAddress
            ? null
            : daoconf.lpAddress,
      });
      getLpMembers(
        constants.AddressZero === daoconf.lpAddress ? null : daoconf.lpAddress
      );
    } catch (error) {}
  };
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
  const getDaoMembers = async (address) => {
    const url = `/${chainId}/tokens/${address}/token_holders`;
    try {
      const result = await api.post("/covalent/api", { url });
      let items = result.data.data.items;
      setMembers(items);
    } catch (error) {}
  };
  const getLpMembers = async (lpMembers) => {
    const url = `/${chainId}/tokens/${lpMembers}/token_holders`;
    try {
      const result = await api.post("/covalent/api", { url });
      let items = result.data.data.items;
      setLpMembers(items);
    } catch (error) {}
  };
  const getDaoAssets = async (address) => {
    const url = `/${chainId}/address/${address}/balances_v2`;
    try {
      const result = await api.post("/covalent/api", { url });
      let items = result.data.data.items;
      setAssets(items);
      let aum = 0;
      items.map((item) => {
        // console.log(item);
        aum += item.quote;
        return item;
      });
      setDaoBalance(aum);
    } catch (error) {}
  };
  const addLpTokenToWallet = async () => {
    if (!library) return;
    try {
      const contract = await getLpContract(daoConfig.lpAddress);
      const tokenAddress = daoConfig.lpAddress;
      const tokenDecimals = await contract.decimals();
      const tokenSymbol = await contract.symbol();
      const wasAdded = await library.provider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
          },
        },
      });
      if (wasAdded) {
        Toastify("success", "Thanks for your interest!");
      } else {
        Toastify("error", "Your loss!");
      }
    } catch (error) {
      Toastify("error", error.message);
    }
  };
  const getTradingAccounts = async () => {
    try {
      const contract = await getShopTaContract();
      const result = await contract.getTAs(address);
      setTaAccounts(result);
    } catch (error) {}
  };
  return (
    <>
      {active ? (
        <div className="dao">
          <Container className="mt-3">
            <Row>
              <Col xs={12} lg={9} className="mx-auto">
                <Row>
                  <Col className="d-flex align-items-center  text-white">
                    <div
                      className="profile"
                      style={{ marginRight: "20px" }}
                    ></div>
                    <div>
                      <h4>{name}</h4>
                      <h4>
                        {truncateAddress(address)}{" "}
                        <ClipBoard address={address} />
                      </h4>
                    </div>
                  </Col>
                  <Col>
                    <div
                      className="d-flex flex-column justify-content-end text-white align-items-center"
                      style={{ maxWidth: "150px", marginLeft: "auto" }}
                    >
                      <button className="dao-primary-btn py-2 px-3 w-100 mb-2">
                        Change Avatar
                      </button>
                      {/* <button className='dao-primary-btn py-2 px-3 w-100'>Edit Profile</button> */}
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
          <Container className="mt-3">
            <Row>
              <Col xs={12} lg={9} className="mx-auto">
                <div className="text-white p-3 mb-3 tabborder">
                  <Row>
                    <Col className="text-center">
                      <h6>Quorum</h6>
                      <h2>{quarom}%</h2>
                    </Col>
                    <Col className="text-center">
                      <h6>Members</h6>
                      <h2>{members.length}</h2>
                    </Col>
                    <Col className="text-center">
                      <h6>AUM</h6>
                      <h2>${Number(daoBalance).toFixed(2)}</h2>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
          <Container className="mt-3">
            <Row>
              <Col xs={12} lg={9} className="mx-auto">
                <Tabs defaultActiveKey="balance" className="mb-3">
                  <Tab
                    eventKey="balance"
                    title={
                      <>
                        <FaWallet className="icon" /> <span>Balance</span>
                      </>
                    }
                  >
                    <div className="myassets text-white tabborder mb-3 p-3">
                      {account && (
                        <MyAssets
                          owner={owner}
                          daoBalance={daoBalance}
                          assets={assets}
                          chainId={chainId}
                          address={address}
                          account={address}
                          hyperLiquidBalances={hyperLiquidBalances}
                        />
                      )}
                    </div>
                    <div className="text-muted p-3 mb-3 tabborder">
                      {account && (
                        <Transactions
                          chainId={chainId}
                          address={address}
                          account={address}
                        />
                      )}
                    </div>
                  </Tab>
                  <Tab
                    eventKey="lp"
                    title={
                      <>
                        <IoIosPeople className="icon" /> <span>LP Token</span>
                      </>
                    }
                  >
                    <Row xs={1} sm={1} md={1}>
                      <Col className="mb-5">
                        {daoConfig.lpAddress && (
                          <Row>
                            <Col className="mb-3">
                              <span className="text-white">
                                LP Token: {truncateAddress(daoConfig.lpAddress)}{" "}
                                <ClipBoard address={daoConfig.lpAddress} />
                              </span>
                            </Col>
                            <Col className="text-right">
                              <button
                                className="dao-btn p-0 px-3"
                                onClick={addLpTokenToWallet}
                              >
                                Add
                              </button>
                            </Col>
                          </Row>
                        )}
                        <div className="text-white p-3 mb-3 tabborder h-100 ">
                          <h5>Offers</h5>
                          {!daoConfig.lpAddress && owner && (
                            <>
                              <div className="text-center py-5">
                                <span>
                                  Create Liquidity Provider token to deposit
                                  funds in this DAO
                                </span>
                              </div>
                              <Row>
                                <Col>
                                  <span>Learn More</span>
                                </Col>
                                <Col className="text-right">
                                  <NavLink
                                    to={`/createLp/${address}`}
                                    className="dao-btn"
                                  >
                                    Create LP
                                  </NavLink>
                                </Col>
                              </Row>
                            </>
                          )}
                          {daoConfig.lpAddress && (
                            <LPToken
                              {...daoConfig}
                              name={name}
                              address={address}
                              assets={assets}
                              daoBalance={
                                daoBalance
                              }
                            />
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Tab>
                  <Tab
                    eventKey="TA"
                    title={
                      <>
                        <IoIosPeople className="icon" />{" "}
                        <span>Trading Account</span>
                      </>
                    }
                  >
                    <Row xs={1} sm={1} md={1}>
                      <Col className="mb-5">
                        <div className="text-white p-3 mb-3 tabborder h-100 ">
                          <Row>
                            <Col>
                              <h5>Accounts</h5>
                            </Col>
                            {owner && (
                              <Col className="text-right">
                                <NavLink
                                  to={`/createTa/${address}`}
                                  className="dao-btn d-inline-block"
                                >
                                  Create Account
                                </NavLink>
                              </Col>
                            )}
                          </Row>
                          {taAccounts.length === 0 && owner && (
                            <>
                              <div className="text-center py-5">
                                <span>Create trading account for traders</span>
                              </div>
                            </>
                          )}
                          {taAccounts.length > 0 && (
                            <Container>
                              <Row>
                                <Col xs={12} className="py-3">
                                  <Row>
                                    <Col className="mb-3 text-white">
                                      <span>Account</span>
                                    </Col>
                                    <Col className="mb-3 text-white text-center">
                                      <span>Name</span>
                                    </Col>
                                    <Col className="mb-3 text-white text-center">
                                      <span>Members</span>
                                    </Col>
                                    {/* <Col className="mb-3 text-white text-center">
                                                                            <span>Balance</span>
                                                                        </Col> */}
                                    <Col className="mb-3 text-white"></Col>
                                  </Row>
                                </Col>
                                {taAccounts.map((item, index) => (
                                  <Col xs={12} className="py-1" key={index}>
                                    <TradingAccount
                                      daoAddress={address}
                                      address={item}
                                      chainId={chainId}
                                      owner={owner}
                                      account={account}
                                    />
                                  </Col>
                                ))}
                              </Row>
                            </Container>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Tab>
                  <Tab
                    eventKey="voting"
                    title={
                      <>
                        <HiSpeakerphone className="icon" />
                        <span>VOTING</span>
                      </>
                    }
                  >
                    <div className="text-muted p-3 mb-3 tabborder">
                      <Row className="mb-2">
                        <Col>
                          <h4 className="text-white mb-3">Voting List</h4>
                        </Col>
                        {owner && (
                          <Col className="text-right pt-2 mb-3">
                            <NavLink
                              to={`/votingList/${address}`}
                              className={"dao-btn"}
                            >
                              Create Voting
                            </NavLink>
                          </Col>
                        )}
                      </Row>
                      {name && (
                        <>
                          <VotingList
                            address={address}
                            name={name}
                            activated={true}
                            active={true}
                            sign={true}
                            over={true}
                            create={false}
                          />
                        </>
                      )}
                    </div>
                  </Tab>
                  <Tab
                    eventKey="tokenholders"
                    title={<span>TOKEN HOLDERS</span>}
                  >
                    <div className="text-white p-3 py-4 mb-3 tabborder">
                      <Row>
                        <Col>
                          <span>DAO Members</span>
                        </Col>
                        <Col className="text-right">
                          {owner && (
                            <NavLink
                              to={`/mintGt/${address}`}
                              className="dao-btn"
                            >
                              <BsFillPersonPlusFill className="icon" />
                              Add Member
                            </NavLink>
                          )}
                        </Col>
                      </Row>
                      <Container className="py-3">
                        <Table>
                          <thead>
                            <tr className="border-0">
                              <th className="text-white bg-transparent">
                                address
                              </th>
                              <th className="text-white bg-transparent text-right">
                                GT Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {members && members.length > 0 && (
                              <>
                                {members.map((member, index) => (
                                  <tr className="border-0" key={index}>
                                    <Members
                                      member={member}
                                      address={address}
                                      owner={owner}
                                    />
                                  </tr>
                                ))}
                              </>
                            )}
                          </tbody>
                        </Table>
                      </Container>
                    </div>
                    {daoConfig.lpAddress && (
                      <div className="text-white p-3 py-4 mb-3 tabborder">
                        <Row>
                          <Col>
                            <span>LP Holders</span>
                          </Col>
                        </Row>
                        <Container className="py-3">
                          <Table>
                            <thead>
                              <tr className="border-0">
                                <th className="text-white bg-transparent">
                                  address
                                </th>
                                <th className="text-white bg-transparent text-right">
                                  LP Balance
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {lpMembers && lpMembers.length > 0 && (
                                <>
                                  {lpMembers.map((member, index) => (
                                    <tr className="border-0" key={index}>
                                      <LpMember
                                        member={member}
                                        address={member.address}
                                        owner={false}
                                      />
                                    </tr>
                                  ))}
                                </>
                              )}
                            </tbody>
                          </Table>
                        </Container>
                      </div>
                    )}
                  </Tab>
                  <Tab eventKey="features" title={<span>Features</span>}>
                    {active && (
                      <DaoConfiguration
                        {...daoConfig}
                        name={name}
                        daoAddress={address}
                      />
                    )}
                  </Tab>
                  <Tab eventKey="nansen" title={<span>Nansen </span>}>
                    <a
                      target="_blank"
                      className="dao-btn mb-5 d-block"
                      href={`https://portfolio.nansen.ai/dashboard/${address}`}
                      rel="noopener noreferrer"
                    >
                      Nansen
                    </a>
                    <iframe
                      className="scroll"
                      src={`https://portfolio.nansen.ai/dashboard/${address}`}
                      name="iframe_a"
                      title="Iframe Example"
                      style={{ width: "100%", height: "500px" }}
                    ></iframe>
                  </Tab>
                </Tabs>
              </Col>
            </Row>
          </Container>
        </div>
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

export default DAO;
