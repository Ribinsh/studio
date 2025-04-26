
import type { GroupStandings, TeamStanding } from '@/lib/types'; // Import necessary types

/**
 * Represents the data structure for the *live* match score,
 * fetched from a dedicated source (e.g., a specific sheet/tab).
 */
export interface LiveMatchScoreData {
  /**
   * The match number (optional, might not be in the live score sheet).
   */
  matchNo?: number;
  /**
   * The name of the first team.
   */
  team1: string;
  /**
   * The current set score of the first team.
   */
  team1SetScore: number;
  /**
   * The current points of the first team in the active set.
   */
  team1CurrentPoints: number;
  /**
   * The name of the second team.
   */
  team2: string;
  /**
   * The current set score of the second team.
   */
  team2SetScore: number;
  /**
   * The current points of the second team in the active set.
   */
  team2CurrentPoints: number;
  /**
   * Optional status like "Live", "Timeout", "Finished Set", etc.
   */
  status?: string;
}

/**
 * Parses CSV text data from Google Sheets into LiveMatchScoreData.
 * Expects 3 rows: Header, Team 1 Data, Team 2 Data.
 * Columns expected: Team, Set Score, Current Points, Status
 * @param csvText The raw CSV text.
 * @returns LiveMatchScoreData object or null if parsing fails.
 */
function parseLiveScoreCsv(csvText: string): LiveMatchScoreData | null {
    if (!csvText) return null;

    // Split into lines, removing potential empty lines at the end
    const lines = csvText.trim().split('\n');
    if (lines.length < 3) {
        console.error("Live score CSV has less than 3 lines (Header + 2 Teams).");
        return null;
    }

    // Basic CSV parsing (split by comma, trim whitespace)
    const parseLine = (line: string): string[] => line.split(',').map(cell => cell.trim());

    const header = parseLine(lines[0]);
    const team1Data = parseLine(lines[1]);
    const team2Data = parseLine(lines[2]);

    // Find column indices (case-insensitive matching)
    const findIndex = (colName: string) => header.findIndex(h => h.toLowerCase() === colName.toLowerCase());

    const teamColIndex = findIndex("Team");
    const setScoreColIndex = findIndex("Set Score");
    const currentPointsColIndex = findIndex("Current Points");
    const statusColIndex = findIndex("Status"); // Optional

    // Validate required columns exist
    if (teamColIndex === -1 || setScoreColIndex === -1 || currentPointsColIndex === -1) {
        console.error("Missing required columns (Team, Set Score, Current Points) in live score CSV header:", header);
        return null;
    }

    try {
        const team1 = team1Data[teamColIndex];
        const team2 = team2Data[teamColIndex];
        const team1SetScore = parseInt(team1Data[setScoreColIndex], 10);
        const team2SetScore = parseInt(team2Data[setScoreColIndex], 10);
        const team1CurrentPoints = parseInt(team1Data[currentPointsColIndex], 10);
        const team2CurrentPoints = parseInt(team2Data[currentPointsColIndex], 10);
        // Status is optional and might be on either row, or maybe a dedicated cell/row not handled here yet.
        // Let's assume status might be in the first team's row for simplicity.
        const status = statusColIndex !== -1 ? team1Data[statusColIndex] : 'Live'; // Default to 'Live' if no status column

        // Basic validation
        if (isNaN(team1SetScore) || isNaN(team2SetScore) || isNaN(team1CurrentPoints) || isNaN(team2CurrentPoints)) {
            console.error("Non-numeric score/points found in live score CSV.");
            return null;
        }
        if (!team1 || !team2) {
            console.error("Missing team names in live score CSV.");
            return null;
        }

        return {
            team1,
            team1SetScore,
            team1CurrentPoints,
            team2,
            team2SetScore,
            team2CurrentPoints,
            status,
            // matchNo is not typically in this simple live score sheet format
        };
    } catch (e) {
        console.error("Error parsing live score CSV data:", e);
        return null;
    }
}


/**
 * Asynchronously retrieves *live* match score data from a specific Google Sheets URL.
 * Fetches the sheet as CSV and parses it.
 *
 * @param googleSheetsLiveScoreUrl The CSV export URL of the Google Sheets document/tab for the live score.
 * @returns A promise that resolves to a LiveMatchScoreData object or null if no match is live/data unavailable.
 */
export async function getLiveScoreDataFromSheets(googleSheetsLiveScoreUrl: string): Promise<LiveMatchScoreData | null> {

  // Prevent fetching placeholder/invalid URLs
  if (!googleSheetsLiveScoreUrl || googleSheetsLiveScoreUrl.includes('EXAMPLE') || googleSheetsLiveScoreUrl.includes('13q43vurVd8iv0efEXRD7ck88oDDbkTVLHkLAtxQkHUU') === false) {
    console.warn("Invalid or placeholder Google Sheets URL for live score provided:", googleSheetsLiveScoreUrl);
    console.log("Returning mock live score data instead.");
    // Return mock data or null, depending on desired behavior for invalid config
     return getMockLiveScoreData();
     // return null;
  }

   // Add cache-busting query parameter
   const urlWithCacheBuster = `${googleSheetsLiveScoreUrl}&_=${new Date().getTime()}`;


  try {
      console.log(`Fetching live score from: ${urlWithCacheBuster}`); // Log the URL being fetched
      const response = await fetch(urlWithCacheBuster, {
          method: 'GET',
          cache: 'no-store', // Ensure fresh data is fetched
          headers: {
              // Add any necessary headers here, though usually not needed for public CSV export
          },
      });

      if (!response.ok) {
          // Handle non-200 responses (e.g., 404 Not Found, 403 Forbidden if permissions changed)
           throw new Error(`Failed to fetch live score CSV: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();

      if (!csvText || csvText.trim() === "") {
           console.log("Received empty CSV response for live score.");
           return null; // No data or empty sheet
       }

      // console.log("Received CSV Text:", csvText); // For debugging
      const parsedData = parseLiveScoreCsv(csvText);

      if (!parsedData) {
          console.error("Failed to parse live score CSV data.");
          return null;
      }

      console.log("Successfully fetched and parsed live score:", parsedData);
      return parsedData;

  } catch (error: any) {
      console.error("Error fetching or parsing live score data:", error.message || error);
      // Optionally fallback to mock data on error, or return null
      // console.log("Falling back to mock live score data due to error.");
      // return getMockLiveScoreData();
      return null;
  }
}

/**
 * Asynchronously retrieves group standings data from a specific Google Sheets URL.
 * This sheet is expected to contain pre-calculated or manually entered standings.
 * Placeholder implementation - currently returns mock data.
 *
 * @param googleSheetsStandingsUrl The URL of the Google Sheets document/tab for the standings.
 * @returns A promise that resolves to a GroupStandings object or null if data unavailable.
 */
export async function getStandingsDataFromSheets(googleSheetsStandingsUrl: string): Promise<GroupStandings | null> {
    // TODO: Implement actual fetching and parsing for standings CSV/API
    // Fetch data from the specified URL (standings table).
    // Parse the rows for each group (Group A, Group B).
    // Map the data to TeamStanding objects and structure it as GroupStandings.
    // Ensure columns match the TeamStanding interface (Name, MP, W, L, Pts, BP).
    // Handle errors and return null if fetching/parsing fails.

     if (!googleSheetsStandingsUrl || googleSheetsStandingsUrl === 'YOUR_STANDINGS_SHEETS_URL_HERE' || googleSheetsStandingsUrl.includes('YOUR_STANDINGS_DOC_ID_HERE')) {
        console.warn("Using mock standings data. Please configure Google Sheets URL for standings.");
        return getMockStandingsData(); // Use mock data if URL is not set or is placeholder
     }

    try {
        // Replace with actual fetch and parse logic for standings sheet
        console.log(`Fetching standings from: ${googleSheetsStandingsUrl}`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
        // Assume fetch is successful and returns mock data structure for now
        // Replace this with actual parsing logic when implemented
        console.log("Standings fetching not implemented, returning mock data.");
        return getMockStandingsData();
     } catch (error) {
        console.error("Failed to fetch standings data:", error);
        // Optionally return mock data on error or null
         console.log("Falling back to mock standings data due to error.");
         return getMockStandingsData();
         // return null;
     }
}


// --- Mock Data Functions ---

// Helper function to provide mock live score data
export function getMockLiveScoreData(): LiveMatchScoreData | null {
  // Simulate a live match
  console.log("Providing MOCK live score data.");
  return {
    matchNo: 2, // Example match number
    team1: 'Mock Team A',
    team1SetScore: 1,
    team1CurrentPoints: 15,
    team2: 'Mock Team B',
    team2SetScore: 0,
    team2CurrentPoints: 12,
    status: 'Live (Mock)',
  };
  // To simulate no live match, return null:
  // return null;
}

// Helper function to provide mock standings data
export function getMockStandingsData(): GroupStandings {
    console.log("Providing MOCK standings data.");
    // Mock standings data reflecting calculated results from previous mock fixture data
    // Ensure this data includes the 'breakPoints' field.
    const groupA: TeamStanding[] = [
        { name: 'Kanthapuram (Mock)', matchesPlayed: 2, wins: 2, losses: 0, setsWon: 4, setsLost: 1, points: 4, breakPoints: 7 },
        { name: 'Puthankunnu (Mock)', matchesPlayed: 1, wins: 0, losses: 1, setsWon: 1, setsLost: 1, points: 1, breakPoints: 2 }, // Assuming live match counts as played for points
        { name: 'Marakkara (Mock)', matchesPlayed: 1, wins: 0, losses: 1, setsWon: 1, setsLost: 2, points: 1, breakPoints: -2 },
        { name: 'Vaalal (Mock)', matchesPlayed: 2, wins: 0, losses: 2, setsWon: 1, setsLost: 3, points: 2, breakPoints: -7 }, // Assuming live match counts as played for points
    ].sort(sortStandingsLogic); // Sort mock data using the same logic

    const groupB: TeamStanding[] = [
         { name: 'Kizhisseri (Mock)', matchesPlayed: 2, wins: 1, losses: 1, setsWon: 2, setsLost: 1, points: 3, breakPoints: 3 }, // Corrected Kizhisseri
         { name: 'Kakkancheri (Mock)', matchesPlayed: 1, wins: 0, losses: 1, setsWon: 1, setsLost: 2, points: 1, breakPoints: -3 },
         { name: 'Kizhakkoth (Mock)', matchesPlayed: 1, wins: 0, losses: 0, setsWon: 0, setsLost: 0, points: 0, breakPoints: 0 }, // Match not played yet
    ].sort(sortStandingsLogic); // Sort mock data

    return {
        groupA,
        groupB,
    };
}


// Helper sorting logic (can be kept here or moved back to a utils/standings file if needed)
function sortStandingsLogic(a: TeamStanding, b: TeamStanding): number {
     // 1. Sort by Points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2. Sort by Number of Matches Won (descending) - Use only if points are equal
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    // 3. Sort by Break Points (Point Difference) (descending) - Use if wins are also equal
    // Ensure breakPoints are treated as numbers
    const bpA = a.breakPoints ?? 0;
    const bpB = b.breakPoints ?? 0;
    if (bpB !== bpA) {
      return bpB - bpA;
    }
    // 4. Sort by Name (ascending) as the final tie-breaker
    return a.name.localeCompare(b.name);
}

// --- Deprecated Function (from previous implementation) ---
// Keep the old interface and function commented out or remove if no longer needed.
/*
export interface MatchData {
  matchNo: number;
  time: string;
  team1: string;
  team1SetScore: number;
  team1FinalScore: number; // Now represents current points in live scenario
  team1PointDiff: number;
  team2: string;
  team2SetScore: number;
  team2FinalScore: number; // Now represents current points in live scenario
  team2PointDiff: number;
  status: string;
}

export async function getMatchDataFromSheets(googleSheetsUrl: string): Promise<MatchData[]> {
  // This function used to fetch all fixtures. Now deprecated in favor of
  // getLiveScoreDataFromSheets and getStandingsDataFromSheets.
  console.warn("getMatchDataFromSheets is deprecated. Using mock data.");
  return getMockMatchFixtureData(); // Example: return old mock fixture data if needed elsewhere
}

export function getMockMatchFixtureData(): MatchData[] {
 // Return the old mock fixture data if necessary
 return [
    { matchNo: 1, time: '4:30 PM', team1: 'Kanthapuram', team1SetScore: 2, team1FinalScore: 25, team1PointDiff: 2, team2: 'Marakkara', team2SetScore: 1, team2FinalScore: 23, team2PointDiff: -2, status: 'Finished' },
    // ... other matches
  ];
}
*/
