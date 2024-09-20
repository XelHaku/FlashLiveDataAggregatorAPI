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
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
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

    const totalSupply = await contract.totalSupply();

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




[
  {
    inputs: [
      { internalType: "address[]", name: "_addresses", type: "address[]" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "allowance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "uint256", name: "balance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "approver", type: "address" }],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "receiver", type: "address" }],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "sender", type: "address" }],
    name: "ERC20InvalidSender",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "spender", type: "address" }],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "donor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "ATONDonated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newCommissionATON",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "accumulatedCommissionPerToken",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalCommissionInATON",
        type: "uint256",
      },
    ],
    name: "Accumulate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "eventIdIndexed",
        type: "string",
      },
      {
        indexed: false,
        internalType: "int8",
        name: "sportOrWinner",
        type: "int8",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "eventType",
        type: "uint8",
      },
    ],
    name: "EventStateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "eventIdIndexed",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "playerIndexed",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "actionType",
        type: "uint8",
      },
    ],
    name: "PlayerAction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "playerIndexed",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Swap",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "_eventId", type: "string" },
      { internalType: "uint256", name: "_startDate", type: "uint256" },
      { internalType: "uint8", name: "_sport", type: "uint8" },
    ],
    name: "addEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "donateATON",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_player", type: "address" },
      { internalType: "string", name: "_eventId", type: "string" },
    ],
    name: "getEventDTO",
    outputs: [
      {
        components: [
          { internalType: "string", name: "eventId", type: "string" },
          { internalType: "uint256", name: "startDate", type: "uint256" },
          { internalType: "uint8", name: "sport", type: "uint8" },
          { internalType: "uint256", name: "total_A", type: "uint256" },
          { internalType: "uint256", name: "total_B", type: "uint256" },
          { internalType: "uint256", name: "total", type: "uint256" },
          { internalType: "int8", name: "winner", type: "int8" },
          {
            components: [
              { internalType: "uint256", name: "amount", type: "uint256" },
              { internalType: "uint8", name: "team", type: "uint8" },
            ],
            internalType: "struct AStructs.Stake",
            name: "playerStake",
            type: "tuple",
          },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "bool", name: "paid", type: "bool" },
        ],
        internalType: "struct AStructs.EventDTO",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint8", name: "_sport", type: "uint8" },
      { internalType: "enum AStructs.Step", name: "_step", type: "uint8" },
      { internalType: "address", name: "_player", type: "address" },
    ],
    name: "getEvents",
    outputs: [
      {
        components: [
          { internalType: "string", name: "eventId", type: "string" },
          { internalType: "uint256", name: "startDate", type: "uint256" },
          { internalType: "uint8", name: "sport", type: "uint8" },
          { internalType: "uint256", name: "total_A", type: "uint256" },
          { internalType: "uint256", name: "total_B", type: "uint256" },
          { internalType: "uint256", name: "total", type: "uint256" },
          { internalType: "int8", name: "winner", type: "int8" },
          {
            components: [
              { internalType: "uint256", name: "amount", type: "uint256" },
              { internalType: "uint8", name: "team", type: "uint8" },
            ],
            internalType: "struct AStructs.Stake",
            name: "playerStake",
            type: "tuple",
          },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "bool", name: "paid", type: "bool" },
        ],
        internalType: "struct AStructs.EventDTO[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "playerAddress", type: "address" },
      { internalType: "uint8", name: "sport", type: "uint8" },
      { internalType: "bool", name: "active", type: "bool" },
      { internalType: "uint256", name: "size", type: "uint256" },
      { internalType: "uint256", name: "pageNo", type: "uint256" },
    ],
    name: "getPlayerEvents",
    outputs: [
      {
        components: [
          { internalType: "string", name: "eventId", type: "string" },
          { internalType: "uint256", name: "startDate", type: "uint256" },
          { internalType: "uint8", name: "sport", type: "uint8" },
          { internalType: "uint256", name: "total_A", type: "uint256" },
          { internalType: "uint256", name: "total_B", type: "uint256" },
          { internalType: "uint256", name: "total", type: "uint256" },
          { internalType: "int8", name: "winner", type: "int8" },
          {
            components: [
              { internalType: "uint256", name: "amount", type: "uint256" },
              { internalType: "uint8", name: "team", type: "uint8" },
            ],
            internalType: "struct AStructs.Stake",
            name: "playerStake",
            type: "tuple",
          },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "bool", name: "closed", type: "bool" },
          { internalType: "bool", name: "paid", type: "bool" },
        ],
        internalType: "struct AStructs.EventDTO[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "authorizedAddress", type: "address" },
    ],
    name: "isAuthorized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "playerAddress", type: "address" },
    ],
    name: "playerSummary",
    outputs: [
      {
        components: [
          { internalType: "uint32", name: "level", type: "uint32" },
          { internalType: "uint256", name: "ethBalance", type: "uint256" },
          { internalType: "uint256", name: "atonBalance", type: "uint256" },
          {
            internalType: "uint256",
            name: "unclaimedCommission",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "claimedCommission",
            type: "uint256",
          },
        ],
        internalType: "struct AStructs.PlayerSummary",
        name: "summary",
        type: "tuple",
      },
      { internalType: "uint256", name: "totalCommission", type: "uint256" },
      {
        internalType: "uint256",
        name: "accumulatedCommission",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "authorizedAddress", type: "address" },
    ],
    name: "setAuthorizedAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_eventId", type: "string" },
      { internalType: "uint256", name: "_amountATON", type: "uint256" },
      { internalType: "uint8", name: "_team", type: "uint8" },
      { internalType: "bool", name: "isGasless", type: "bool" },
      { internalType: "address", name: "_player", type: "address" },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amountAton", type: "uint256" }],
    name: "swap",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "eventId", type: "string" },
      { internalType: "int8", name: "_winner", type: "int8" },
      { internalType: "uint8", name: "_batchSize", type: "uint8" },
    ],
    name: "terminateEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];
