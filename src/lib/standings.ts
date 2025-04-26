
// This file previously contained logic to calculate standings dynamically.
// Since standings are now fetched directly from Google Sheets, this calculation logic is removed.
// We might keep type definitions here if they are shared across components/services.

// If type definitions are moved or not needed, this file can be deleted.

// Keep type definitions if they are used by other files (e.g., components, services)
import type { TeamStanding, GroupStandings, TeamsConfig } from './types';

// --- Removed Calculation Logic ---
/*
const POINTS_FOR_WIN = 2;
// ... other constants ...

function initializeStandings(teams: string[]): Record<string, TeamStanding> { ... }
function updateStandingsForMatch(standings: Record<string, TeamStanding>, match: MatchData): void { ... }
function sortStandings(standings: TeamStanding[]): TeamStanding[] { ... }

export function calculateStandings(matches: MatchData[], teamsConfig: TeamsConfig): GroupStandings {
  // ... implementation ...
}
*/

// You might still want a sorting utility if the fetched data isn't pre-sorted
/**
 * Sorts team standings based on tournament rules:
 * 1. Points (desc)
 * 2. Number of Matches Won (desc)
 * 3. Break Points (Point Difference) (desc)
 * 4. Team Name (asc)
 * @param standings - Array of team standings.
 * @returns Sorted array of team standings.
 */
export function sortStandingsDisplay(standings: TeamStanding[]): TeamStanding[] {
  // Check if standings is actually an array before sorting
  if (!Array.isArray(standings)) {
    console.warn("sortStandingsDisplay received non-array input:", standings);
    return []; // Return empty array or handle as appropriate
  }

  return [...standings].sort((a, b) => { // Use spread to avoid mutating original array if passed directly
    // 1. Sort by Points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2. Sort by Number of Matches Won (descending)
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    // 3. Sort by Break Points (Point Difference) (descending)
    if (b.breakPoints !== a.breakPoints) {
      return b.breakPoints - a.breakPoints;
    }

    // 4. Sort by Name (ascending) as the final tie-breaker
    return a.name.localeCompare(b.name);
  });
}
