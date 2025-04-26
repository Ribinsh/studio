/**
 * Represents the data structure of a match from Google Sheets.
 */
export interface MatchData {
  /**
   * The match number.
   */
  matchNo: number;
  /**
   * The time of the match.
   */
  time: string;
  /**
   * The name of the first team.
   */
  team1: string;
  /**
   * The set score of the first team.
   */
  team1SetScore: number;
  /**
   * The final score of the first team in the current/last set.
   */
  team1FinalScore: number;
   /**
    * The point difference gained/lost by team 1 in this match (for tie-breaking).
    * To be sourced from Google Sheets.
    */
  team1PointDiff: number;
  /**
   * The name of the second team.
   */
  team2: string;
  /**
   * The set score of the second team.
   */
  team2SetScore: number;
  /**
   * The final score of the second team in the current/last set.
   */
  team2FinalScore: number;
  /**
    * The point difference gained/lost by team 2 in this match (for tie-breaking).
    * To be sourced from Google Sheets.
    */
  team2PointDiff: number;
  /**
   * Match status information (e.g., "Live", "Finished", "Upcoming").
   */
  status: string;
}

/**
 * Asynchronously retrieves match data from a Google Sheets URL.
 * Placeholder implementation.
 *
 * @param googleSheetsUrl The URL of the Google Sheets document.
 * @returns A promise that resolves to an array of MatchData objects.
 */
export async function getMatchDataFromSheets(googleSheetsUrl: string): Promise<MatchData[]> {
  // TODO: Implement this by calling the Google Sheets API.
  // Fetch data, parse it, and ensure it includes columns for match details,
  // scores, status, and the numerical point differences for each team per match.
  // Map the parsed data to the MatchData interface structure.

  console.warn("Using mock data. Google Sheets fetching not implemented.");
  // Return mock data for now. Ensure mock data includes the new fields.
  return getMockMatchData();
}


// Helper function to provide mock data (also used in page.tsx)
// Ensure this function returns data matching the updated MatchData interface
export function getMockMatchData(): MatchData[] {
 return [
    { matchNo: 1, time: '4:30 PM', team1: 'Kanthapuram', team1SetScore: 2, team1FinalScore: 25, team1PointDiff: 2, team2: 'Marakkara', team2SetScore: 1, team2FinalScore: 23, team2PointDiff: -2, status: 'Finished' },
    { matchNo: 2, time: '5:00 PM', team1: 'Vaalal', team1SetScore: 1, team1FinalScore: 18, team1PointDiff: -2, team2: 'Puthankunnu', team2SetScore: 1, team2FinalScore: 20, team2PointDiff: 2, status: 'Live' }, // Ensure one match is live
    { matchNo: 3, time: '5:30 PM', team1: 'Kizhisseri', team1SetScore: 0, team1FinalScore: 0, team1PointDiff: 0, team2: 'Kizhakkoth', team2SetScore: 0, team2FinalScore: 0, team2PointDiff: 0, status: 'Upcoming' },
    { matchNo: 4, time: '6:00 PM', team1: 'Kanthapuram', team1SetScore: 2, team1FinalScore: 25, team1PointDiff: 5, team2: 'Vaalal', team2SetScore: 0, team2FinalScore: 20, team2PointDiff: -5, status: 'Finished' },
    { matchNo: 5, time: '6:30 PM', team1: 'Marakkara', team1SetScore: 0, team1FinalScore: 0, team1PointDiff: 0, team2: 'Puthankunnu', team2SetScore: 0, team2FinalScore: 0, team2PointDiff: 0, status: 'Upcoming' },
    { matchNo: 6, time: '7:00 PM', team1: 'Kakkancheri', team1SetScore: 1, team1FinalScore: 22, team1PointDiff: -3, team2: 'Kizhisseri', team2SetScore: 2, team2FinalScore: 25, team2PointDiff: 3, status: 'Finished' },
    { matchNo: 7, time: '7:30 PM', team1: 'Kanthapuram', team1SetScore: 0, team1FinalScore: 0, team1PointDiff: 0, team2: 'Puthankunnu', team2SetScore: 0, team2FinalScore: 0, team2PointDiff: 0, status: 'Upcoming' },
    { matchNo: 8, time: '8:00 PM', team1: 'Marakkara', team1SetScore: 0, team1FinalScore: 0, team1PointDiff: 0, team2: 'Vaalal', team2SetScore: 0, team2FinalScore: 0, team2PointDiff: 0, status: 'Upcoming' },
    { matchNo: 9, time: '8:30 PM', team1: 'Kakkancheri', team1SetScore: 0, team1FinalScore: 0, team1PointDiff: 0, team2: 'Kizhakkoth', team2SetScore: 0, team2FinalScore: 0, team2PointDiff: 0, status: 'Upcoming' },
  ];
}
