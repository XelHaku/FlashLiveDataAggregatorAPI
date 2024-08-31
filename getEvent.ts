import { ethers } from "ethers";
import { EventDTO } from "@models/event.model";
import { addEvent } from "@syndicate/addEvent";
import { sleep } from "@utils/sleep";
import { getEventFlash } from "@flash/getEventFlash";

const ARENATON_CONTRACT = process.env.ARENATON_CONTRACT as string;
const RPC_URL = process.env.RPC_URL as string;
const BASE_URL = process.env.URL as string;

// Define the contract ABI with the correct function signature
const contractABI = [
  {
    type: "function",
    name: "getEventDTO",
    inputs: [
      { name: "_eventId", type: "string" },
      { name: "_player", type: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "eventId", type: "string" },
          { name: "startDate", type: "uint256" },
          { name: "sport", type: "uint8" },
          { name: "total_A", type: "uint256" },
          { name: "total_B", type: "uint256" },
          { name: "total", type: "uint256" },
          { name: "winner", type: "int8" },
          { name: "eventState", type: "uint8" },
          {
            name: "playerStake",
            type: "tuple",
            components: [
              { name: "amount", type: "uint256" },
              { name: "team", type: "uint8" },
            ],
          },
          { name: "active", type: "bool" },
          { name: "closed", type: "bool" },
          { name: "paid", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
];

const DEFAULT_PLAYER_ADDRESS = "0x0000000000000000000000220000000000000001";

/**
 * Fetches and processes the EventDTO for a given event ID and player address.
 */
export async function getEvent(
  _eventId: string,
  _playerAddress: string = DEFAULT_PLAYER_ADDRESS,
  isAddEvent: boolean = false
): Promise<{ eventId: string; eventFlash: any; eventDTO: EventDTO }> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      ARENATON_CONTRACT,
      contractABI,
      provider
    );

    const event = await getEventFlash(_eventId);
    const playerAddress = _playerAddress || DEFAULT_PLAYER_ADDRESS;

    let eventRawDTO = await contract.getEventDTO(_eventId, playerAddress);

    if (
      eventRawDTO.sport === BigInt(0) &&
      isAddEvent &&
      event.STAGE_TYPE === "SCHEDULED"
    ) {
      console.log(`Event not found in contract, adding event and retrying...`);
      await addEvent(event);
      await sleep(5000);
      eventRawDTO = await contract.getEventDTO(_eventId, playerAddress);
    } else if (eventRawDTO.sport === 0) {
      eventRawDTO = createDefaultEventDTO(_eventId);
    }

    const eventDTO = mapEventDTO(eventRawDTO);
    updateEventState(eventDTO, event);

    if (event.STAGE_TYPE === "CANCELLED" || event.STAGE_TYPE === "POSTPONED") {
      eventDTO.eventState = "3";
    }

    return { eventId: _eventId, eventFlash: event, eventDTO };
  } catch (error) {
    console.error("Failed to fetch or process event DTO:", error);
    throw error;
  }
}

/**
 * Updates the event state based on current conditions.
 */
function updateEventState(eventDTO: EventDTO, event: any): void {
  const currentTime = Math.floor(Date.now() / 1000);
  const startDate = parseInt(eventDTO.startDate);

  eventDTO.eventState =
    currentTime > startDate
      ? event.WINNER === -1
        ? "2"
        : event.WINNER >= 0
        ? "3"
        : "1"
      : "1";

  event.sportImage = `${BASE_URL}/sports/${event.SPORT}.png`;
  event.stateImage = `${BASE_URL}/state/state${eventDTO.eventState}.png`;
}

/**
 * Converts raw event data into a more manageable format.
 */
function mapEventDTO(obj: any): EventDTO {
  const safeToString = (value: any): string => value?.toString() ?? "0";
  const safeToNumber = (value: any): number => parseInt(safeToString(value));

  const totalA = safeToNumber(obj[3]);
  const totalB = safeToNumber(obj[4]);

  const stakeAmount = parseFloat(ethers.formatEther(safeToString(obj[8]?.[0])));
  const expected = calculateExpected(
    safeToString(obj[8]?.[1]),
    obj[8]?.[0],
    totalA,
    totalB
  );
  const ratio =
    stakeAmount > 0
      ? ((parseFloat(expected) / stakeAmount) * 100).toFixed(2) + "%"
      : "0.00%";

  return {
    eventId: safeToString(obj[0]),
    startDate: safeToString(obj[1]),
    sport: safeToString(obj[2]),
    total_A: safeToString(obj[3]),
    total_B: safeToString(obj[4]),
    total: safeToString(obj[5]),
    winner: safeToString(obj[6]),
    eventState: safeToString(obj[7]),
    playerStake: {
      amount: safeToString(obj[8]?.[0]),
      team: safeToString(obj[8]?.[1]),
    },
    open: obj[9] ?? false,
    close: obj[10] ?? false,
    payout: obj[11] ?? false,
    oddsA: normalizeOdds(totalA, totalB),
    oddsB: normalizeOdds(totalB, totalA),
    totalAshort: formatShortTotal(safeToString(obj[3])),
    totalBshort: formatShortTotal(safeToString(obj[4])),
    expected,
    ratio,
  };
}

/**
 * Calculates the expected payout based on the player's stake and the total stakes.
 */
function calculateExpected(
  team: any,
  stakeAmount: any,
  totalA: number,
  totalB: number
): string {
  let expected = "0";

  const parsedStakeAmount = BigInt(stakeAmount.toString());
  const totalABigInt = BigInt(totalA);
  const totalBBigInt = BigInt(totalB);

  console.log("team", team.toString());
  console.log("stakeAmount", parsedStakeAmount.toString());
  console.log("totalA", totalA);
  console.log("totalB", totalB);

  if (team.toString() === "1" && totalABigInt > BigInt(0)) {
    expected = ethers.formatEther(
      (totalBBigInt * parsedStakeAmount) / totalABigInt + parsedStakeAmount
    );
  } else if (team.toString() === "2" && totalBBigInt > BigInt(0)) {
    expected = ethers.formatEther(
      (totalABigInt * parsedStakeAmount) / totalBBigInt + parsedStakeAmount
    );
  }

  return expected;
}

/**
 * Calculates odds based on total amounts.
 */
function normalizeOdds(totalA: number, totalB: number): number {
  if (totalA === 0 && totalB === 0) return 0;

  const odds = (100 * totalA) / (totalA + totalB);
  return odds;
}

/**
 * Formats a large number into a shorter string representation.
 */
function formatShortTotal(value: string): string {
  if (value === "0") return "0";

  try {
    const wei = BigInt(value);
    const ether = parseFloat(ethers.formatEther(wei));

    if (isNaN(ether)) return "0";

    if (ether < 0.000001) return ether.toExponential(0);
    if (ether < 0.001) return ether.toExponential(3);
    if (ether < 1000) return ether.toFixed(3);
    return ether.toFixed(0);
  } catch (error) {
    console.error("Error in formatShortTotal:", error);
    return "0";
  }
}

/**
 * Creates a default EventDTO object when no data is found.
 */
function createDefaultEventDTO(_eventId: string): EventDTO {
  return {
    eventId: _eventId,
    startDate: "0",
    sport: "0",
    total_A: "0",
    total_B: "0",
    total: "0",
    winner: "0",
    eventState: "0",
    playerStake: { amount: "0", team: "0" },
    open: false,
    close: false,
    payout: false,
    oddsA: 0,
    oddsB: 0,
    totalAshort: "0",
    totalBshort: "0",
    expected: "0",
    ratio: "0.0%",
  };
}
