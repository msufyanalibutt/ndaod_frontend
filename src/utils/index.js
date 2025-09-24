import indexAbi from './abis/index.json';
import daoAbi from './abis/Dao.json';
import daoViewerAbi from './abis/Dao_Viewer.json';
import customAbi from './abis/customAbi.json';
import shopLPAbi from './abis/shopLP.json';
import lpAbi from './abis/LP.json';
import swapAbi from './abis/swapAbi.json';
import bridgeAbi from './abis/bridgeAbi.json';
import privateExistAbi from './abis/privateExit.json';
import partialExistAbi from './abis/partialExit.json';
import shopTAAbi from './abis/shop_Ta.json';
import TradingAccountAbi from './abis/tradingAccount.json';

import moment from 'moment';
export const truncateAddress = (address) => {
  if (!address) return "No Account";
  const match = address.match(
    /^(0x[a-zA-Z0-9]{2})[a-zA-Z0-9]+([a-zA-Z0-9]{2})$/
  );
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};

export const toHex = (num) => {
  const val = Number(num);
  return "0x" + val.toString(16);
};

// TestNetwork
// export const ndaod_Erc20 = "0xda2FCFeB5c8Fb68CCeFc2E626636f24B610d8c9F";
// export const index_contract_address = "0x8DA6c28d81d78de5E7B10087CD0c2AC896C32B80";
// export const daoViewer_contract_address = "0x8043A0907a7d602ed538161090A10Ee728e3E846";
// export const ShopLp_contract_address = "0x4Aff2C32aF6D055C5D7019819e9C90C1f06Cc934";
// export const PrivateExitModule_contract_address = "0x4c7ba507dee6c65c33ceb9ce4a04ff1364b21ea7";
// export const PartialExitModule_contract_address = "0x13db69DC6FD8669E9Bb52E6e31ecFD551Bcac6EB";
// export const ShopTrading_contract_address = "0x5e597DcfA0E6382dfbEAF825C5acB3FD306222E3";

// export const infuraId = "630dd75eb8214709b7409d7a578289bb";
// export const ndaod_Erc20 = "0x6CBc3da4F83ea9C85a6e6B0Aa74D73e2011A3efC";
// export const index_contract_address = "0x4F5e86Ab916bD70b18C47835E1568791382EA134";
// export const daoViewer_contract_address = "0x583d7C53584F34B84277df9c4AeFb82258d99dCB";
// export const ShopLp_contract_address = "0xE46C4196820EDE021A3caE1B5F68E65b64971c00";
// export const ShopLp_contract_abi = shopLPAbi;
// export const daoViewer_contract_abi = daoViewerAbi;
// export const index_contract_abi = indexAbi;
// export const dao_contract_abi = daoAbi;
// export const custom_contract_abi = customAbi;
// export const lp_contract_abi = lpAbi;

// export const ndaod_Erc20 = "0x8AE0A6946b9d01f8Df3e6cC92877b8706802e733";
// export const index_contract_address = "0x93201e26D3a96315E54115d99cBed84E21b7f501";
// export const daoViewer_contract_address = "0xfb142DF440E46359c44693Bd81E987ed71299803";
// export const ShopLp_contract_address = "0xCBaddd5Ab29F01ed6dC613b1B5f0831e79Fd7Ff9";
// export const PrivateExitModule_contract_address = "0x4c7ba507dee6c65c33ceb9ce4a04ff1364b21ea7";
// export const PartialExitModule_contract_address = "0xD90a38cfCD2C2cf2F43949cB41425900e1155Fd5";

// NDAOD Contracts
// export const ndaod_Erc20 = "0x167fE700F9a64F14A8Ce324908a0Ce734e4349d8";
// export const index_contract_address = "0xBCacF4c0b0Ef49E20344898BA1cC18f094BF9fa0";
// export const daoViewer_contract_address = "0x9632efa96929dbe5e04fe6e87de3678e9945895c";
// export const ShopLp_contract_address = "0xbCb74E113365F49c218Db50ED5a5F5455A11b298";
// export const PrivateExitModule_contract_address = "0xf7c9415e0a8910a0087eddaabd923de627f35166";
// export const PartialExitModule_contract_address = "0x29943884B926e2D00154CAc5DaD1A5Da0E7eD876";
// export const ShopTrading_contract_address = "0xd5431d929500DD3D61731228909621E9fb44dcb7";

// export const ndaod_Erc20 = "0x167fE700F9a64F14A8Ce324908a0Ce734e4349d8";
// export const index_contract_address = "0xBCacF4c0b0Ef49E20344898BA1cC18f094BF9fa0";
// export const daoViewer_contract_address = "0x9c23AFCB321cc5d797C6fd5a3694c1FfcE878C91";
// export const ShopLp_contract_address = "0xbCb74E113365F49c218Db50ED5a5F5455A11b298";
// export const PrivateExitModule_contract_address = "0xf7c9415e0a8910a0087eddaabd923de627f35166";
// export const PartialExitModule_contract_address = "0x29943884B926e2D00154CAc5DaD1A5Da0E7eD876";
// export const ShopTrading_contract_address = "0x7264895cb3CfB0b75809808450901FF5A33eBCA6";

//Working on Optimism and Matic Network 
export const ndaod_Erc20 = {
  // 10: "0x762c6Dc57b8B8588D3820aEa34f3d0972FCb175A",
  // 137: "0xF0D4876C85B1E7A6C9d4058417Fce2Eb39945FA6",
  137: "0x167fE700F9a64F14A8Ce324908a0Ce734e4349d8"
};

export const index_contract_address = {
  // 10: "0x2F0C76cdaAE57eb67AaeaF58EF33dd724dDb0447",
  // 137: "0xeD2235AB57719dc8D9B9f20F6b04512E9C300434",
  137: "0xBCacF4c0b0Ef49E20344898BA1cC18f094BF9fa0"
};
export const daoViewer_contract_address = {
  // 10: "0xD15e977FCCe24d6B6C3603f3a6bB403a2c3b2Ecf",
  // 137: "0x8cC951649e30d50bf2E4B98010656253954fAea6"
  137: "0x9632efa96929dbe5e04fe6e87de3678e9945895c"
};
export const ShopLp_contract_address = {
  // 10: "0xa79e3cd545aff110aB7e1c85599c16890808fB4C",
  // 137: "0x78f6D6C2d70E3192e6404Ca3831eed880D81E980"
  137: "0xbCb74E113365F49c218Db50ED5a5F5455A11b298"
};
export const PrivateExitModule_contract_address = {
  // 10: "0xAeb56bcC8339d92529b13AeF6071f23fb8790721",
  // 137: "0xA95E9bC1d050823F02F03F43E5FB64e40D7fFB2F"
  137: "0xf7c9415e0a8910a0087eddaabd923de627f35166"
};
export const PartialExitModule_contract_address = {
  // 10: "0xb14EecE0fEF357d270DE24db1e30493801ae65de",
  // 137: "0x82778bC10A9Bf7263B0F1Bc340EE4B080892521D"
  137: "0x29943884B926e2D00154CAc5DaD1A5Da0E7eD876"
};
export const ShopTrading_contract_address = {
  // 10: "0xEc49AF1e7FA9d1C26CEB66D48e327334316123A9",
  // 137: "0xDC1c422e05F2643bE183b6eFE488cB12cD224074"
  137: "0xd5431d929500DD3D61731228909621E9fb44dcb7"
};

// export const ndaod_Erc20 = "0xF0D4876C85B1E7A6C9d4058417Fce2Eb39945FA6";
// export const index_contract_address = "0xeD2235AB57719dc8D9B9f20F6b04512E9C300434";
// export const daoViewer_contract_address = "0x8cC951649e30d50bf2E4B98010656253954fAea6";
// export const ShopLp_contract_address = "0x78f6D6C2d70E3192e6404Ca3831eed880D81E980";
// export const PrivateExitModule_contract_address = "0xA95E9bC1d050823F02F03F43E5FB64e40D7fFB2F";
// export const PartialExitModule_contract_address = "0x82778bC10A9Bf7263B0F1Bc340EE4B080892521D";
// export const ShopTrading_contract_address = "0xDC1c422e05F2643bE183b6eFE488cB12cD224074";

export const ShopLp_contract_abi = shopLPAbi;
export const daoViewer_contract_abi = daoViewerAbi;
export const index_contract_abi = indexAbi;
export const dao_contract_abi = daoAbi;
export const custom_contract_abi = customAbi;
export const lp_contract_abi = lpAbi;
export const swap_contract_abi = swapAbi;
export const bridge_contract_abi = bridgeAbi;
export const privateExit_contract_abi = privateExistAbi;
export const partialExit_contract_abi = partialExistAbi;
export const ShopTa_contract_abi = shopTAAbi;
export const TradingAccount_contract_abi = TradingAccountAbi;
// export const covalent = 'cqt_rQXQfvRQDWK7C9rwBVpv68XdrR94';

// export const chainIds = [80001];
export const chainIds = [137, 10];

export const hex_signatures = {
  "0x40c10f19": "mint(address,uint256)",
  "0x9dc29fac": "burn(address,uint256)",
  "0xbb35783b": "move(address,address,uint256)",
  "0x7e5cd5c1": "disableMinting()",
  "0x98603cca": "disableBurning()",
  "0x4e5bfe06": "createLp(string,string)",
  "0x56819c80": "initPublicOffer(bool,address,uint256)",
  "0x1f20b102": "createPrivateOffer(address,address ,uint256 ,uint256 )",
  "0xbfd98dc1": "disablePrivateOffer(uint256)",
  "0x4779b82e": "changeMintable(bool)",
  "0xc91f2ef9": "changeBurnable(bool)",
  "0x22bec6b8": "freezeMintingStatus()",
  "0xf85ca187": "freezeBurningStatus()",
  "0x05cf79b9": "changeQuorum(uint8)",
  "0xa9059cbb": "transfer(address, uint256)",
  "0x095ea7b3": "approve(address,uint256)"
}
export const calculateDate = (date) => {
  let scheduledDate = moment(date * 1000).format();
  scheduledDate = moment(scheduledDate).add(3, 'days')
  let diff = moment.duration(scheduledDate.diff(moment()));
  let count = Math.ceil(diff.asDays());
  if (count === 3) {
    return '3 days left';
  } else if (count === 2) {
    return '2 days left';
  } else if (count === 1) {
    return 'a day left';
  }
}

export const exlcude_Address = {
  80001: '0x0000000000000000000000000000000000001010',
  137: '0x0000000000000000000000000000000000001010',
  10: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
}
export const ssAffiliateId = 'fntCPPu1p';
export const ssAffiliateSecret = 'b672de9b526088a1f685205f4222b6a3';