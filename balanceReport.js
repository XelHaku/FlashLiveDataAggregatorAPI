const ethers = require("ethers");

// Replace with your provider URL (e.g., Infura or Alchemy)
const provider = new ethers.JsonRpcProvider(
  "https://arb-mainnet.g.alchemy.com/v2/pLzUv4Hhioqbs8Le8u7aZZzAxA05wpaU"
);

// ERC-20 contract ABI (BalanceOf function)
const erc20ABI = ["function balanceOf(address owner) view returns (uint256)"];

// ERC-20 contract address (Replace with the specific ERC-20 token contract)
const ARENATON_CONTRACT = "0xa92A6B698a5374CF3B1D89285D7634A7d8F0Fc87";

const users = [
  { name: "Burnes", address: "0xde96682df511e194049af6894effe5ccae2ef6fc" },
  { name: "Aldevaran", address: "0x07e396721a4604ddc2bc6b20c96baa3200b738b2" },
  { name: "Cantu", address: "0xd20ba42fb64e7beafe60c171324c6481198a80df" },
  { name: "Stiban", address: "0xbc8ec38d988e775b21c2c484d205f6bc9731ea7e" },
  { name: "Juan", address: "0xf89a71711500ce2d111daa98285920f6bd6dd538" },
  { name: "Haziel", address: "0xaf7f1f446c8aba2e3b5d00da35e71817305024e9" },
  {
    name: "Scammer",
    address: "0xca03d56f811695854aacb3b83a3aa90aa0f429b2",
  },
  {
    name: "Scammer",
    address: "0xca03d56f811695854aacb3b83a3aa90aa0f429b2",
  },
];

async function getBalances() {
  const erc20Contract = new ethers.Contract(
    ARENATON_CONTRACT,
    erc20ABI,
    provider
  );

  for (const user of users) {
    try {
      // Get ETH balance
      const ethBalance = await provider.getBalance(user.address);
      // Get ERC-20 balance
      const erc20Balance = await erc20Contract.balanceOf(user.address);

      console.log(`${user.name}:`);
      console.log(`${user.address}:`);
      console.log(`  ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
      console.log(
        `  ATON Balance: ${ethers.formatUnits(erc20Balance, 18)} Tokens\n`
      );
    } catch (error) {
      console.error(`Error fetching balance for ${user.name}:`, error);
    }
  }
}

getBalances();
