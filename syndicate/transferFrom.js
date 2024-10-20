const { ethers } = require("ethers");

/**
 * Calls the transferFrom function of a smart contract via the Syndicate API
 * @param {string} to The address to transfer to
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating success or failure
 */
async function transferFrom(to) {
  try {
    const from = "0x7efd92475ff0d69f99e70dfce307fcc22aeadf68"; // AIRDROPER
    const value = ethers.parseUnits("0.00001", 18).toString(); // Convert to wei and then to string

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
          args: { from, to, value: value.toString() },
        }),
      }
    );

    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", responseText);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage += `, message: ${
          errorJson.message ||
          errorJson.errors?.join(", ") ||
          "No error message provided"
        }`;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage += `, response: ${responseText}`;
      }
      throw new Error(errorMessage);
    }

    const syndicateData = JSON.parse(responseText);
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
