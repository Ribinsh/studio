
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
 * Expects 3 rows minimum: Header, Team 1 Data, Team 2 Data.
 * Will gracefully handle fewer rows by returning null.
 * Columns expected: Team, Set Score, Current Points, Status
 * @param csvText The raw CSV text.
 * @returns LiveMatchScoreData object or null if parsing fails or data is insufficient.
 */
function parseLiveScoreCsv(csvText: string): LiveMatchScoreData | null {
    console.log("Attempting to parse CSV:", csvText);
    if (!csvText || typeof csvText !== 'string') {
        console.error("parseLiveScoreCsv received invalid or empty csvText.");
        return null;
    }

    // Split into lines, trim whitespace from each line, filter empty lines
    const lines = csvText.split('\n')
                         .map(line => line.trim())
                         .filter(line => line.length > 0);

    // Log the actual lines received for better debugging
    console.log("Filtered non-empty lines from CSV:", lines);
    console.log(`Parsed ${lines.length} non-empty lines from CSV.`);

    // Check if we have at least the header and two team rows
    if (lines.length < 3) {
        console.warn(`Live score CSV has only ${lines.length} non-empty lines. Expected at least 3 (Header + 2 Teams). Assuming no match data.`);
        return null; // Not enough data for a match score
    }

    // Basic CSV parsing (split by comma, trim whitespace from cells)
    // Handle potential commas within quoted strings if necessary, though unlikely for this data
    const parseLine = (line: string): string[] => line.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1')); // Handle potential quotes

    const header = parseLine(lines[0]);
    // Defensive: ensure team1Data and team2Data actually exist
    const team1Data = lines.length > 1 ? parseLine(lines[1]) : null;
    const team2Data = lines.length > 2 ? parseLine(lines[2]) : null;

    console.log("CSV Header:", header);
    console.log("Team 1 Data:", team1Data);
    console.log("Team 2 Data:", team2Data);

    // If team data is missing after header, return null
    if (!team1Data || !team2Data) {
      console.error("Missing team data rows after header in live score CSV.");
      return null;
    }

    // Find column indices (case-insensitive matching)
    const findIndex = (colName: string) => {
        const index = header.findIndex(h => h.toLowerCase().trim() === colName.toLowerCase().trim());
        if(index === -1) console.warn(`Column "${colName}" not found in header:`, header);
        return index;
    }


    const teamColIndex = findIndex("Team");
    const setScoreColIndex = findIndex("Set Score");
    const currentPointsColIndex = findIndex("Current Points");
    const statusColIndex = findIndex("Status"); // Optional

    // Validate required columns exist in header
    if (teamColIndex === -1 || setScoreColIndex === -1 || currentPointsColIndex === -1) {
        console.error("Missing required columns (Team, Set Score, Current Points) in live score CSV header:", header);
        return null;
    }
     // Validate team rows have enough columns based on required indices
     if (team1Data.length <= Math.max(teamColIndex, setScoreColIndex, currentPointsColIndex) ||
         team2Data.length <= Math.max(teamColIndex, setScoreColIndex, currentPointsColIndex)) {
         console.error("Team data rows do not have enough columns based on header indices.", { team1DataLength: team1Data.length, team2DataLength: team2Data.length, maxIndex: Math.max(teamColIndex, setScoreColIndex, currentPointsColIndex) });
         return null;
     }


    try {
        // Ensure data exists at indices before accessing
        const team1 = team1Data[teamColIndex];
        const team2 = team2Data[teamColIndex];
        const team1SetScoreStr = team1Data[setScoreColIndex];
        const team2SetScoreStr = team2Data[setScoreColIndex];
        const team1CurrentPointsStr = team1Data[currentPointsColIndex];
        const team2CurrentPointsStr = team2Data[currentPointsColIndex];

        // Use || '0' as fallback for parseInt if cell is empty or undefined
        const team1SetScore = parseInt(team1SetScoreStr || '0', 10);
        const team2SetScore = parseInt(team2SetScoreStr || '0', 10);
        const team1CurrentPoints = parseInt(team1CurrentPointsStr || '0', 10);
        const team2CurrentPoints = parseInt(team2CurrentPointsStr || '0', 10);

        // Status is optional. Check index and if data exists. Might be on either row.
        // Prioritize Team 1 status row, then Team 2, then default.
        let status = 'Live'; // Default status
        if (statusColIndex !== -1) {
             if (team1Data.length > statusColIndex && team1Data[statusColIndex]) {
                 status = team1Data[statusColIndex];
             } else if (team2Data.length > statusColIndex && team2Data[statusColIndex]) {
                 status = team2Data[statusColIndex]; // Check team 2 if team 1 status is empty
             }
        }


        // Basic validation
        if (isNaN(team1SetScore) || isNaN(team2SetScore) || isNaN(team1CurrentPoints) || isNaN(team2CurrentPoints)) {
            console.error("Non-numeric score/points found in live score CSV. Parsed values:", { team1SetScoreStr, team2SetScoreStr, team1CurrentPointsStr, team2CurrentPointsStr });
            return null;
        }
        if (!team1 || !team2) {
            console.error("Missing team names in live score CSV.");
            return null;
        }

        const parsedResult = {
            team1,
            team1SetScore,
            team1CurrentPoints,
            team2,
            team2SetScore,
            team2CurrentPoints,
            status,
            // matchNo is not typically in this simple live score sheet format
        };
        console.log("Successfully parsed live score CSV:", parsedResult);
        return parsedResult;

    } catch (e: any) {
        console.error("Error during parsing live score CSV data values:", e.message || e);
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

  // Define the specific valid URL identifier expected
   const validDocId = '13q43vurVd8iv0efEXRD7ck88oDDbkTVLHkLAtxQkHUU'; // User provided ID
   const liveScoreSheetGid = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_GID || '0'; // Default to GID 0 if not set
   const liveScoreDocIdFromEnv = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_DOC_ID;

   let effectiveUrl: string;

   if (liveScoreDocIdFromEnv && liveScoreDocIdFromEnv !== 'YOUR_DOC_ID_HERE') {
       // Use environment variable if set and valid
       effectiveUrl = `https://docs.google.com/spreadsheets/d/${liveScoreDocIdFromEnv}/export?format=csv&gid=${liveScoreSheetGid}`;
       console.log("Using Google Sheet URL from environment variables:", effectiveUrl);
   } else if (googleSheetsLiveScoreUrl && googleSheetsLiveScoreUrl.includes(validDocId)) {
        // Use the provided URL if it contains the expected document ID
        // Extract GID if present, otherwise default
        const urlParams = new URLSearchParams(googleSheetsLiveScoreUrl.split('?')[1]);
        const gid = urlParams.get('gid') || liveScoreSheetGid;
        effectiveUrl = `https://docs.google.com/spreadsheets/d/${validDocId}/export?format=csv&gid=${gid}`;
        console.log("Using user-provided Google Sheet URL:", effectiveUrl);
    } else {
        // If neither env var nor valid provided URL is available
        console.warn("Invalid or placeholder Google Sheets URL for live score. No valid Doc ID found in environment or provided URL:", googleSheetsLiveScoreUrl);
        console.log("Will NOT attempt to fetch. Returning null.");
        // Return null, don't attempt fetch or use mock data
        return null;
    }


   // Add cache-busting query parameter
   const urlWithCacheBuster = `${effectiveUrl}&_=${new Date().getTime()}`;


  try {
      console.log(`Fetching live score from: ${urlWithCacheBuster}`); // Log the URL being fetched
      const response = await fetch(urlWithCacheBuster, {
          method: 'GET',
          cache: 'no-store', // Ensure fresh data is fetched
          headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
          },
          // Add timeout? Consider using AbortController if fetch takes too long
      });

      console.log(`Fetch response status: ${response.status}`); // Log status

      if (!response.ok) {
          // Handle non-200 responses (e.g., 404 Not Found, 403 Forbidden if permissions changed)
           const errorText = await response.text(); // Try to get error text from response
           console.error(`Failed to fetch live score CSV: ${response.status} ${response.statusText}. Response body: ${errorText}`);
           // Do not fall back to mock data here, signal the error properly
           return null; // Indicate fetch failure
      }

      const csvText = await response.text();

      if (!csvText || csvText.trim() === "") {
           console.warn("Received empty CSV response for live score. Sheet might be empty or cleared.");
           return null; // No data or empty sheet
       }

      // console.log("Received CSV Text:", csvText); // Log raw CSV for debugging if needed
      const parsedData = parseLiveScoreCsv(csvText);

      if (!parsedData) {
          console.error("Failed to parse live score CSV data after fetch. Check CSV format and parser logic.");
          // Parsing failed, return null, don't use mock data
          return null;
      }

      console.log("Successfully fetched and parsed live score from Google Sheets.");
      return parsedData;

  } catch (error: any) {
      // Catch network errors or other exceptions during fetch/parsing
      console.error("Error in getLiveScoreDataFromSheets:", error.message || error);
      // Don't fallback to mock data on generic errors, return null
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

     if (!googleSheetsStandingsUrl || googleSheetsStandingsUrl === 'YOUR_STANDINGS_SHEETS_URL_HERE' || googleSheetsStandingsUrl.includes('YOUR_STANDINGS_DOC_ID_HERE') || googleSheetsStandingsUrl.includes('YOUR_STANDINGS_GID_HERE')) {
        console.warn("Using mock standings data. Please configure Google Sheets URL for standings.");
        return getMockStandingsData(); // Use mock data if URL is not set or is placeholder
     }

    try {
        // Replace with actual fetch and parse logic for standings sheet
        console.log(`Fetching standings from: ${googleSheetsStandingsUrl}&_=${new Date().getTime()}`);
        // --- Placeholder for actual fetch ---
        // const response = await fetch(googleSheetsStandingsUrl + '&_=' + new Date().getTime(), { cache: 'no-store' });
        // if (!response.ok) throw new Error('Failed to fetch standings');
        // const csvText = await response.text();
        // const parsedStandings = parseStandingsCsv(csvText); // Need to implement parseStandingsCsv
        // return parsedStandings;
        // --- End Placeholder ---

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
