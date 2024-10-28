const { ethers } = require("ethers");

/**
 * Calls the transferFrom function of a smart contract via the Syndicate API
 * @param {string} _from The address to transfer from
 * @param {string} _to The address to transfer to
 * @param {string} _value The amount to transfer (as a string)
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating success or failure
 */
async function transferFrom(to) {
  try {
    const from = "0x7efd92475ff0d69f99e70dfce307fcc22aeadf68"; // AIRDROPER
    const value = ethers.parseUnits("0.000010", 18).toString(); // Convert BigInt to string
    const response = await fetch(
      "https://api.syndicate.io/transact/sendTransaction",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: process.env.SYNDICATE_PROJECT_ID,
          contractAddress: process.env.ARENATON_CONTRACT,
          chainId: 42161,
          functionSignature:
            "transferFrom(address from,address to,uint256 value)",
          args: { from, to, value }, // Use the string value here
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const syndicateData = await response.json();
    console.log("\n\nSyndicate API Response:", syndicateData);

    // Check if the transaction was successful
    if (syndicateData.status === "success") {
      return true;
    } else {
      console.error("Transaction failed:", syndicateData.message);
      return false;
    }
  } catch (error) {
    console.error("Error calling transferFrom:", error);
    return false;
  }
}

module.exports = { transferFrom };

