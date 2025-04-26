
// This file previously contained functions to fetch data from Google Sheets.
// Since the application now manages data (teams, live score, standings) locally
// using React Context and an Admin page, these fetching functions are no longer needed.
// The data will be persisted in localStorage via the AppContext.

// Keeping the file temporarily in case types are needed, but likely can be removed
// if types are consolidated in lib/types.ts

// import type { LiveMatchScoreData, GroupStandings } from '@/lib/types';
// import Papa from 'papaparse';

// --- Removed Functions ---
// export async function getLiveScoreDataFromSheets(csvUrl?: string): Promise<LiveMatchScoreData | null> { ... }
// export async function getStandingsDataFromSheets(googleSheetsStandingsUrl: string): Promise<GroupStandings | null> { ... }
// export function getMockLiveScoreData(): LiveMatchScoreData | null { ... }
// export function getMockStandingsData(): GroupStandings { ... }
// function sortStandingsLogic(a: TeamStanding, b: TeamStanding): number { ... }
// function parseStandingsCsv(csvText: string): GroupStandings | null { ... }

console.log("Google Sheets fetching service (google-sheets.ts) is no longer actively used. Data is managed by AppContext.");

// You can safely delete this file if no other part of the application imports anything from it.
// Ensure types like LiveMatchScoreData and GroupStandings are defined in lib/types.ts.

export {}; // Add an empty export to make it a module if needed for some build tools
