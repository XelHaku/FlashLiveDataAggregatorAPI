const { ethers } = require("ethers");

const contractABI = [
  {
    type: "function",
    name: "playerSummary",
    inputs: [
      { name: "playerAddress", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "summary",
        type: "tuple",
        internalType: "struct AStructs.PlayerSummary",
        components: [
          { name: "level", type: "uint32", internalType: "uint32" },
          { name: "ethBalance", type: "uint256", internalType: "uint256" },
          { name: "atonBalance", type: "uint256", internalType: "uint256" },
          {
            name: "unclaimedCommission",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "claimedCommission",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      { name: "totalCommission", type: "uint256", internalType: "uint256" },
      {
        name: "accumulatedCommission",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  totalSupply,
];

async function playerSummary(playerAddress) {
  try {
    const contractAddress = "0xa92A6B698a5374CF3B1D89285D7634A7d8F0Fc87"; // replace with your contract address
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    // Call the playerSummary function from the contract
    const [account, totalCommission, accumulatedCommission] =
      await contract.playerSummary(playerAddress);


       const [totalSupply] = await contract.totalSupply();

    console.log(
      "Fetching player summary for address:",
      playerAddress,
      totalCommission.toString(),
      accumulatedCommission.toString()
    );

    // Format and return the data
    const formattedAccount = renameAccountProperties(account, playerAddress);
    return {
      ...formattedAccount,
      totalCommission: formatBalance(totalCommission), // Format with 18 decimals
      accumulatedCommission: formatBalance(accumulatedCommission), // Format with 18 decimals
      totalSupply: formatBalance(totalSupply), // Format with 18 decimals
    };
  } catch (error) {
    console.error("Failed to fetch player summary:", error.message);
    throw error;
  }
}

function formatBalance(balance) {
  return parseFloat(ethers.formatEther(balance)).toFixed(18);
}

function formatBalance8Zeros(balance) {
  return parseFloat(ethers.formatEther(balance)).toFixed(6);
}

function shortenAddress(address) {
  return address.slice(0, 4) + "..." + address.slice(-4);
}

function renameAccountProperties(account, address) {
  return {
    level: account.level.toString(), // Format the level as string
    ethBalance: formatBalance(account.ethBalance),
    atonBalance: formatBalance(account.atonBalance),
    unclaimedCommission: formatBalance(account.unclaimedCommission),
    claimedCommission: formatBalance(account.claimedCommission),
    address: address,
    shortAddress: shortenAddress(address),
    ethShortBalance: formatBalance8Zeros(account.ethBalance),
    atonShortBalance: formatBalance8Zeros(account.atonBalance),
  };
}

module.exports = {
  playerSummary,
};
