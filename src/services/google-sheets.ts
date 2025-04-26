
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
 * Asynchronously retrieves *live* match score data from a specific Google Sheets URL.
 * This sheet is expected to have 2 rows representing the current opponents.
 * Placeholder implementation.
 *
 * @param googleSheetsLiveScoreUrl The URL of the Google Sheets document/tab for the live score.
 * @returns A promise that resolves to a LiveMatchScoreData object or null if no match is live/data unavailable.
 */
export async function getLiveScoreDataFromSheets(googleSheetsLiveScoreUrl: string): Promise<LiveMatchScoreData | null> {
  // TODO: Implement this by calling the Google Sheets API.
  // Fetch data from the specified URL (likely just 2 rows).
  // Parse the rows to extract team names, set scores, and current points.
  // Combine into a single LiveMatchScoreData object.
  // Handle errors and return null if fetching/parsing fails or sheet is empty.

  if (!googleSheetsLiveScoreUrl || googleSheetsLiveScoreUrl === 'YOUR_LIVE_SCORE_SHEETS_URL_HERE') {
      console.warn("Using mock live score data. Please set NEXT_PUBLIC_GOOGLE_SHEETS_LIVE_SCORE_URL.");
      return getMockLiveScoreData(); // Use mock data if URL is not set
  }

  try {
      // Replace with actual fetch logic
      console.log(`Fetching live score from: ${googleSheetsLiveScoreUrl}`);
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
      // Assume fetch is successful and returns mock data structure for now
      return getMockLiveScoreData();
  } catch (error) {
      console.error("Failed to fetch live score data:", error);
      // Optionally return mock data on error or null
      // return getMockLiveScoreData();
       return null;
  }
}

/**
 * Asynchronously retrieves group standings data from a specific Google Sheets URL.
 * This sheet is expected to contain pre-calculated or manually entered standings.
 * Placeholder implementation.
 *
 * @param googleSheetsStandingsUrl The URL of the Google Sheets document/tab for the standings.
 * @returns A promise that resolves to a GroupStandings object or null if data unavailable.
 */
export async function getStandingsDataFromSheets(googleSheetsStandingsUrl: string): Promise<GroupStandings | null> {
    // TODO: Implement this by calling the Google Sheets API.
    // Fetch data from the specified URL (standings table).
    // Parse the rows for each group (Group A, Group B).
    // Map the data to TeamStanding objects and structure it as GroupStandings.
    // Ensure columns match the TeamStanding interface (Name, MP, W, L, Pts, BP).
    // Handle errors and return null if fetching/parsing fails.

     if (!googleSheetsStandingsUrl || googleSheetsStandingsUrl === 'YOUR_STANDINGS_SHEETS_URL_HERE') {
        console.warn("Using mock standings data. Please set NEXT_PUBLIC_GOOGLE_SHEETS_STANDINGS_URL.");
        return getMockStandingsData(); // Use mock data if URL is not set
     }

    try {
        // Replace with actual fetch logic
        console.log(`Fetching standings from: ${googleSheetsStandingsUrl}`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
        // Assume fetch is successful and returns mock data structure for now
        return getMockStandingsData();
     } catch (error) {
        console.error("Failed to fetch standings data:", error);
        // Optionally return mock data on error or null
        // return getMockStandingsData();
         return null;
     }
}


// --- Mock Data Functions ---

// Helper function to provide mock live score data
export function getMockLiveScoreData(): LiveMatchScoreData | null {
  // Simulate a live match
  return {
    matchNo: 2, // Example match number
    team1: 'Vaalal',
    team1SetScore: 1,
    team1CurrentPoints: 18,
    team2: 'Puthankunnu',
    team2SetScore: 1,
    team2CurrentPoints: 20,
    status: 'Live',
  };
  // To simulate no live match, return null:
  // return null;
}

// Helper function to provide mock standings data
export function getMockStandingsData(): GroupStandings {
    // Mock standings data reflecting calculated results from previous mock fixture data
    // Ensure this data includes the 'breakPoints' field.
    const groupA: TeamStanding[] = [
        { name: 'Kanthapuram', matchesPlayed: 2, wins: 2, losses: 0, setsWon: 4, setsLost: 1, points: 4, breakPoints: 7 },
        { name: 'Puthankunnu', matchesPlayed: 1, wins: 0, losses: 1, setsWon: 1, setsLost: 1, points: 1, breakPoints: 2 }, // Assuming live match counts as played for points
        { name: 'Marakkara', matchesPlayed: 1, wins: 0, losses: 1, setsWon: 1, setsLost: 2, points: 1, breakPoints: -2 },
        { name: 'Vaalal', matchesPlayed: 2, wins: 0, losses: 2, setsWon: 1, setsLost: 3, points: 2, breakPoints: -7 }, // Assuming live match counts as played for points
    ].sort(sortStandingsLogic); // Sort mock data using the same logic

    const groupB: TeamStanding[] = [
         { name: 'Kizhisseri', matchesPlayed: 2, wins: 1, losses: 1, setsWon: 2, setsLost: 1, points: 3, breakPoints: 3 }, // Corrected Kizhisseri
         { name: 'Kakkancheri', matchesPlayed: 1, wins: 0, losses: 1, setsWon: 1, setsLost: 2, points: 1, breakPoints: -3 },
         { name: 'Kizhakkoth', matchesPlayed: 1, wins: 0, losses: 0, setsWon: 0, setsLost: 0, points: 0, breakPoints: 0 }, // Match not played yet
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
    if (b.breakPoints !== a.breakPoints) {
      return b.breakPoints - a.breakPoints;
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

