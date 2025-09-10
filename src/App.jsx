import React from 'react';
import { useWeb3React } from '@web3-react/core';
import {
  Home, CreateDao, Dao, VotingList,
  MintGt, SignTransaction, MoveGt,
  BurnGt, FreezeGtBurning,
  FreezeGtMinting, InitPublicOffer,
  InitPrivateOffer, CreateLp, EcoSystem,
  PrivateOffers, DisablePrivateOffer,
  ChangeLPMinting, ChangeLPBurning,
  FreezeLPMinting, FreezeLPBurning, ChangeQuorom,
  CustomTransaction, SendToken, SendMatic,
  ApprovedToken, Swap, Bridge, Connect, AddPermitted,
  RemovePermitted, AddAdapter, RemoveAdapter, Modules,
  PrivateExit, PartialExit, CreatePartialOffer, Profile,
  CreateTa, AddMemberToTA, TradingAccount, SendCoinFromTA,
  SendTokenFromTA, ConnectTA, TACustomTransaction, SideShift,
  SideShiftOrder
} from './pages';
import Header from './components/header';
import Sidebar from './components/sidebar/index';
import { SideShiftProvider } from './contexts/sideShift';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";


function App() {
  const { active, chainId } = useWeb3React();
  return (
    <>
      <Router>
        <Sidebar />
        <main className='main'>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile/:account" element={<Profile />} />
            <Route path="/dao/create" element={<CreateDao />} />
            <Route path="/ecosystem" element={<EcoSystem />} />
            <Route path="/dao/:address" element={<Dao />} />
            <Route path="/votingList/:address" element={<VotingList />} />
            <Route path="/mintGt/:address" element={<MintGt />} />
            <Route path="/moveGt/:address" element={<MoveGt />} />
            <Route path="/burnGt/:address" element={<BurnGt />} />
            <Route path="/changeQuorom/:address" element={<ChangeQuorom />} />
            <Route path="/freezeGtMinting/:address" element={<FreezeGtMinting />} />
            <Route path="/freezeGtBurning/:address" element={<FreezeGtBurning />} />
            <Route path="/createLp/:address" element={<CreateLp />} />
            <Route path="/initPublicOffer/:address" element={<InitPublicOffer />} />
            <Route path="/initPrivateOffer/:address" element={<InitPrivateOffer />} />
            <Route path="/disablePrivateOffer/:address" element={<DisablePrivateOffer />} />
            <Route path="/changeLpMinting/:address" element={<ChangeLPMinting />} />
            <Route path="/changeLpBurning/:address" element={<ChangeLPBurning />} />
            <Route path="/freezeLpMinting/:address" element={<FreezeLPMinting />} />
            <Route path="/freezeLpBurning/:address" element={<FreezeLPBurning />} />
            <Route path="/dao/:address/privateOffers" element={<PrivateOffers />} />
            <Route path="/customTransaction/:address" element={<CustomTransaction />} />
            <Route path="/sendCoin/:address" element={<SendMatic />} />
            <Route path="/sendToken/:address" element={<SendToken />} />
            <Route path="/sendCoinFromTA/:address/:DAddress" element={<SendCoinFromTA />} />
            <Route path="/sendTokenFromTA/:address/:DAddress" element={<SendTokenFromTA />} />
            <Route path="/approvedToken/:address" element={<ApprovedToken />} />
            <Route path="/addPermitted/:address" element={<AddPermitted />} />
            <Route path="/removePermitted/:address" element={<RemovePermitted />} />
            <Route path="/addAdapter/:address" element={<AddAdapter />} />
            <Route path="/removeAdapter/:address" element={<RemoveAdapter />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/dao/:address/modules/privateExit" element={<PrivateExit />} />
            <Route path="/dao/:address/modules/partialExit" element={<PartialExit />} />
            <Route path="/dao/:address/modules/createPartial" element={<CreatePartialOffer />} />
            <Route path="/swap" element={<Swap />} />
            {
              (active && chainId !== 10) && <Route path="/bridge" element={<Bridge />} />
            }
            <Route path="/dao/:address/votingPage/:txhash" element={<SignTransaction />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/createTa/:address" element={<CreateTa />} />
            <Route path="/addMembertoTa/:address" element={<AddMemberToTA />} />
            <Route path="/tradingAccount/:address/:tAddress/:name" element={<TradingAccount />} />
            <Route path="/connectTA/:address/:name" element={<ConnectTA />} />
            <Route path="/taCustomTransaction/:address" element={<TACustomTransaction />} />
            <Route path="/sideshift" element={<SideShiftProvider><SideShift /></SideShiftProvider>} />
            <Route path="/order/:sender/:id" element={<SideShiftOrder />} />
            <Route path='*' element={<Home />} />
          </Routes>
        </main>
      </Router>
    </>
  );
}

export default App;
