
import type { GroupStandings, TeamStanding } from '@/lib/types'; // Import necessary types
import Papa from 'papaparse'; // Import papaparse

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
 * Asynchronously retrieves *live* match score data from a specific Google Sheets URL.
 * Fetches the sheet as CSV and parses it using papaparse.
 *
 * @param googleSheetsLiveScoreUrl The direct CSV export URL of the Google Sheets document/tab for the live score.
 * @returns A promise that resolves to a LiveMatchScoreData object or null if no match is live/data unavailable.
 */
export async function getLiveScoreDataFromSheets(googleSheetsLiveScoreUrl?: string): Promise<LiveMatchScoreData | null> {

   // --- Use the new direct CSV link as the primary fallback ---
   const defaultLiveScoreUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuYS75C9qL3p-q4L-PQCEA7kVHzaStGnVUvS0i9Lk4Hs7gtCD5k1SJRbW5xjyVytZN8IWPtk0GOimS/pub?gid=0&single=true&output=csv';

   // --- Check for Environment Variables (Optional Override) ---
   // This part is kept for potential future configuration, but the default is now the direct link.
   const liveScoreDocIdFromEnv = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_DOC_ID;
   const liveScoreSheetGid = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_GID || '0'; // Default GID if only DOC ID is set

   let effectiveUrl: string;

   if (liveScoreDocIdFromEnv && liveScoreDocIdFromEnv !== 'YOUR_DOC_ID_HERE') {
       // Construct URL from environment variables if they are set and valid
       effectiveUrl = `https://docs.google.com/spreadsheets/d/${liveScoreDocIdFromEnv}/export?format=csv&gid=${liveScoreSheetGid}`;
       console.log("Using Google Sheet URL from environment variables:", effectiveUrl);
   } else if (googleSheetsLiveScoreUrl && googleSheetsLiveScoreUrl.startsWith('https')) {
       // Use the URL passed as argument if provided and looks like a valid URL
       effectiveUrl = googleSheetsLiveScoreUrl;
       console.log("Using URL passed as argument:", effectiveUrl);
   } else {
       // Fallback to the default direct CSV link
       effectiveUrl = defaultLiveScoreUrl;
       console.log("Using default Google Sheet CSV URL:", effectiveUrl);
   }


   // Add cache-busting query parameter
   const urlWithCacheBuster = `${effectiveUrl}${effectiveUrl.includes('?') ? '&' : '?'}cacheBuster=${new Date().getTime()}`;


  try {
      console.log(`Fetching live score from: ${urlWithCacheBuster}`); // Log the URL being fetched
      const response = await fetch(urlWithCacheBuster, {
          method: 'GET',
          cache: 'no-store', // Ensure fresh data is fetched
          headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
          },
      });

      console.log(`Fetch response status: ${response.status}`); // Log status

      if (!response.ok) {
           const errorText = await response.text(); // Try to get error text from response
           console.error(`Failed to fetch live score CSV: ${response.status} ${response.statusText}. Response body: ${errorText}`);
           return null; // Indicate fetch failure
      }

      const csvText = await response.text();

      if (!csvText || csvText.trim() === "") {
           console.warn("Received empty CSV response for live score. Sheet might be empty or cleared.");
           return null; // No data or empty sheet
       }

      // Parse CSV using papaparse
      const parsed = Papa.parse(csvText.trim(), {
          header: true,       // Treat the first row as headers
          skipEmptyLines: true // Skip empty lines
      });

      if (parsed.errors.length > 0) {
          console.error("Error parsing live score CSV with papaparse:", parsed.errors);
          // Try to log the raw CSV text that caused the error
          // console.log("Problematic CSV Text:\n", csvText.trim());
          return null;
      }

      // Ensure headers are strings (papaparse might infer types)
      const headers = parsed.meta.fields as string[];
      const requiredHeaders = ['Team', 'SetScore', 'CurrentPoints']; // Updated header names from the sheet
      const missingHeaders = requiredHeaders.filter(h => !headers || !headers.includes(h)); // Added check for headers existence

      if (missingHeaders.length > 0) {
          console.error(`Missing required headers in live score CSV: ${missingHeaders.join(', ')}. Found headers: ${headers ? headers.join(', ') : 'None'}`);
           console.log("Problematic CSV Text:\n", csvText.trim()); // Log CSV if headers missing
          return null;
      }

      // Papaparse returns data as an array of objects
      const rows = parsed.data as any[]; // Use 'any' for flexibility, validate below

      // Expect exactly two rows for the two teams after the header
      if (rows.length < 2) {
          console.warn(`Live score CSV has only ${rows.length} data rows after header. Expected 2 rows for the two teams.`);
          console.log("Parsed Rows:", rows); // Log rows for debugging
          return null;
      }

      const team1Data = rows[0];
      const team2Data = rows[1];

      // Validate required fields exist and parse them using the correct headers
      const team1 = team1Data['Team']?.trim();
      const team2 = team2Data['Team']?.trim();
      // Ensure fallback to '0' if values are null/undefined before parsing
      const team1SetScore = parseInt(team1Data['SetScore'] || '0', 10);
      const team2SetScore = parseInt(team2Data['SetScore'] || '0', 10);
      const team1CurrentPoints = parseInt(team1Data['CurrentPoints'] || '0', 10);
      const team2CurrentPoints = parseInt(team2Data['CurrentPoints'] || '0', 10);

      // Basic validation
      if (!team1 || !team2) {
          console.error("Missing team names in parsed live score data.");
          console.log("Team1 Data:", team1Data);
          console.log("Team2 Data:", team2Data);
          return null;
      }
      if (isNaN(team1SetScore) || isNaN(team2SetScore) || isNaN(team1CurrentPoints) || isNaN(team2CurrentPoints)) {
          console.error("Non-numeric score/points found in parsed live score data.");
          console.log("Team1 Data:", team1Data);
          console.log("Team2 Data:", team2Data);
          return null;
      }

      // Status is optional. Check if 'Status' header exists and use value from first row if present.
      let status = 'Live'; // Default status
      if (headers.includes('Status') && team1Data['Status'] && team1Data['Status'].trim() !== '') {
          status = team1Data['Status'].trim();
      }

       const liveMatchData: LiveMatchScoreData = {
           team1,
           team1SetScore,
           team1CurrentPoints,
           team2,
           team2SetScore,
           team2CurrentPoints,
           status,
       };

       console.log("Successfully parsed live score using papaparse:", liveMatchData);
       return liveMatchData;

  } catch (error: any) {
      // Catch network errors or other exceptions during fetch/parsing
      console.error("Error in getLiveScoreDataFromSheets (papaparse fetch/parse):", error.message || error);
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
    // TODO: Implement actual fetching and parsing for standings CSV/API using papaparse
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
