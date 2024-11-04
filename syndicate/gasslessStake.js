async function gasslessStake(_eventId, _amountATONI, _team, _player) {
  try {
    const isGasless = true;
    const _amountATON = _amountATONI.toString();

    const url = "https://api.syndicate.io/transact/sendTransaction";
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: process.env.SYNDICATE_PROJECT_ID,
        contractAddress: process.env.ARENATON_CONTRACT,
        chainId: 42161, // Arbitrum One
        functionSignature:
          "stake(string _eventId, uint256 _amountATON, uint8 _team, bool isGasless, address _player)",
        args: {
          _eventId,
          _amountATON,
          _team,
          isGasless,
          _player,
        },
      }),
    };

    console.log(
      "Sending request to Syndicate API:",
      JSON.stringify(options, null, 2)
    );

    const response = await fetch(url, options);
    const responseText = await response.text();

    console.log("Raw Syndicate API Response:", responseText);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${responseText}`
      );
    }

    let syndicateData;
    try {
      syndicateData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing Syndicate API response:", parseError);
      throw new Error(
        `Failed to parse Syndicate API response: ${responseText}`
      );
    }

    console.log(
      "Parsed Syndicate API Response:",
      JSON.stringify(syndicateData, null, 2)
    );

    // Here you might want to check syndicateData for specific success indicators
    // For now, we'll assume it's successful if we get to this point
    return true;
  } catch (error) {
    console.error("Error in gasslessStake:", error);
    return false;
  }
}

// The rest of your code (sleep function, etc.) remains unchanged
module.exports = { gasslessStake };
