import fetch from "node-fetch";
const ethers = require("ethers");
import { getEventFlash } from "@flash/getEventFlash";

// This function simulates calling a smart contract function via the Syndicate API
export async function addEvent(_eventId: string): Promise<boolean> {
  try {
    const event = await getEventFlash(_eventId);
    console.log("Event: ", event);
    const eventId = event.eventFlash.EVENT_ID;
    const sport = event.eventFlash.SPORT;
    const startDate = event.eventFlash.START_UTIME; // Ensure this is in seconds

    const open = event.eventDTO.open;
    console.log("Date now: ", Date.now());

    console.log("\n\n ADD EVENT### ");
    console.log("Event ID: ", eventId);
    console.log("Sport: ", sport);
    console.log("Start Date: ", startDate);
    if (startDate > 0 && !open) {
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
              "addEvent(string _eventId,uint256 _startDate,uint8 _sport)", // Ensure the function signature matches exactly what's in the contract
            args: { _eventId: eventId, _startDate: startDate, _sport: sport }, // This is correct if no arguments are needed for the function
          }),
        }
      );

      const syndicateData = await response.json(); // Directly parse response to JSON
      console.log("\n\nSyndicate API Response:", syndicateData);

      return true; // Return true to indicate success
    }
    return false;
  } catch (error) {
    console.error("Error calling addEvent:", error);
    return false; // Return false to indicate failure
  }
}
