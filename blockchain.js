const { ethers } = require('ethers');
require('dotenv').config();

// ZetaChain Athens Testnet connection
const provider = new ethers.JsonRpcProvider(
  "https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
);

// DotVests deployment wallet
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Minimal ABI for DotVestToken contract
const tokenABI = [
  "function mint(address to, uint256 amount) external",
  "function burn(address from, uint256 amount) external",
  "function updatePrice(uint256 newPrice) external",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function getTokenInfo() view returns (string, string, string, uint256, bool, uint256)"
];

// Contract instances
const contracts = {
  DTV: new ethers.Contract(process.env.DTV_CONTRACT, tokenABI, wallet),
  TEL: new ethers.Contract(process.env.TEL_CONTRACT, tokenABI, wallet),
  ORB: new ethers.Contract(process.env.ORB_CONTRACT, tokenABI, wallet),
  CEM: new ethers.Contract(process.env.CEM_CONTRACT, tokenABI, wallet)
};

const getContract = (ticker) => {
  const contract = contracts[ticker.toUpperCase()];
  if (!contract) throw new Error(`No contract found for ticker: ${ticker}`);
  return contract;
};

const mintTokens = async (ticker, toAddress, amount) => {
  try {
    const contract = getContract(ticker);
    const tx = await contract.mint(toAddress, ethers.toBigInt(amount));
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const burnTokens = async (ticker, fromAddress, amount) => {
  try {
    const contract = getContract(ticker);
    const tx = await contract.burn(fromAddress, ethers.toBigInt(amount));
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getTokenBalance = async (ticker, address) => {
  try {
    const contract = getContract(ticker);
    const balance = await contract.balanceOf(address);
    return { success: true, balance: balance.toString() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { provider, wallet, contracts, getContract, mintTokens, burnTokens, getTokenBalance };