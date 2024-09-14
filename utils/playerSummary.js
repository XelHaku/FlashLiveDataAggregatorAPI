const { ethers } = require("ethers");

const contractABI = [
  {
    type: "function",
    name: "playerSummary",
    inputs: [
      {
        name: "playerAddresses",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    outputs: [
      {
        name: "accounts",
        type: "tuple[]",
        internalType: "struct AStructs.playerSummary[]",
        components: [
          { name: "level", type: "uint32", internalType: "uint32" },
          {
            name: "ethBalance",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "atonBalance",
            type: "uint256",
            internalType: "uint256",
          },
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
      {
        name: "totalCommission",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "accumulatedCommission",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
];

async function playerSummary(addresses) {
  try {
    const contractAddress = "0x3f589F0F74fFdE1A474DD5261921AcFB76Aa0eE5";
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    const totalSupply = await contract.totalSupply();
    const { accounts, totalCommission, accumulatedCommission } =
      await contract.playerSummary(addresses);

    console.log(
      "Fetching player summary for addresses",
      accounts,
      totalCommission,
      accumulatedCommission
    );

    // Append each address and shortened address to its corresponding account
    const accountsWithAddresses = accounts.map((account, index) =>
      renameAccountProperties(account, addresses[index])
    );

    // Format values as strings with up to 4 decimal places
    return {
      accounts: accountsWithAddresses,
      totalCommission: parseFloat(ethers.formatEther(totalCommission)).toFixed(
        18
      ), // max 4 decimals
      accumulatedCommission: parseFloat(
        ethers.formatEther(accumulatedCommission)
      ).toFixed(18), // max 4 decimals
      totalSupply: parseFloat(ethers.formatEther(totalSupply)).toFixed(18), // max 4 decimals
    };
  } catch (error) {
    console.error("Failed to fetch player summary:", error.message);
    throw error;
  }
}

function formatDate(date) {
  let timestamp;
  if (true) {
    timestamp = parseInt(date.toString()); // or Number(date)
  }
  return new Date(timestamp * 1000).toLocaleString();
}

function shortenAddress(address) {
  return address.slice(0, 4) + "..." + address.slice(-4);
}

function formatBalance(balance) {
  return parseFloat(ethers.formatEther(balance)).toFixed(18);
}

function formatBalance8Zeros(balance) {
  return parseFloat(ethers.formatEther(balance)).toFixed(6);
}

function renameAccountProperties(account, address) {
  return {
    level: BigInt(account.level).toString(),
    ethBalance: formatBalance(BigInt(account.ethBalance)),
    atonBalance: formatBalance(BigInt(account.atonBalance)),
    unclaimedCommission: formatBalance(BigInt(account.unclaimedCommission)),
    claimedCommission: formatBalance(BigInt(account.claimedCommission)),
    address: address,
    shortAddress: shortenAddress(address),
    ethShortBalance: formatBalance8Zeros(BigInt(account.ethBalance)),
    atonShortBalance: formatBalance8Zeros(BigInt(account.atonBalance)),
  };
}

module.exports = {
  playerSummary,
};
