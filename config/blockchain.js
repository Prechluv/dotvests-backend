const { ethers } = require('ethers');
require('dotenv').config();

// ZetaChain Athens Testnet connection
const provider = new ethers.JsonRpcProvider(
  "https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
);

// DotVests deployment wallet - Check if valid private key exists
let wallet = null;
if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith('0x') && process.env.PRIVATE_KEY.length > 10) {
  try {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log('✅ Blockchain wallet initialized');
  } catch (error) {
    console.warn('⚠️  Invalid PRIVATE_KEY in .env - blockchain features disabled');
    console.warn('   Set a valid private key to enable blockchain operations');
    wallet = null;
  }
} else {
  console.warn('⚠️  PRIVATE_KEY not configured - blockchain features disabled');
  console.warn('   Get a private key from MetaMask and add to .env');
}

// Minimal ABI for DotVestToken contract
const tokenABI = [
  "function mint(address to, uint256 amount) external",
  "function burn(address from, uint256 amount) external",
  "function updatePrice(uint256 newPrice) external",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function getTokenInfo() view returns (string, string, string, uint256, bool, uint256)"
];

// Contract instances - only initialize if wallet exists
const contracts = {};
if (wallet) {
  contracts.DTV = new ethers.Contract(process.env.DTV_CONTRACT, tokenABI, wallet);
  contracts.TEL = new ethers.Contract(process.env.TEL_CONTRACT, tokenABI, wallet);
  contracts.ORB = new ethers.Contract(process.env.ORB_CONTRACT, tokenABI, wallet);
  contracts.CEM = new ethers.Contract(process.env.CEM_CONTRACT, tokenABI, wallet);
}

const getContract = (ticker) => {
  if (!wallet) {
    throw new Error('Blockchain wallet not initialized. Configure PRIVATE_KEY in .env');
  }
  const contract = contracts[ticker.toUpperCase()];
  if (!contract) throw new Error(`No contract found for ticker: ${ticker}`);
  return contract;
};

const mintTokens = async (ticker, toAddress, amount) => {
  try {
    if (!wallet) {
      return { success: false, error: 'Blockchain wallet not configured' };
    }
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
    if (!wallet) {
      return { success: false, error: 'Blockchain wallet not configured' };
    }
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
    if (!wallet) {
      return { success: false, error: 'Blockchain wallet not configured' };
    }
    const contract = getContract(ticker);
    const balance = await contract.balanceOf(address);
    return { success: true, balance: balance.toString() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { provider, wallet, contracts, getContract, mintTokens, burnTokens, getTokenBalance };