/**
 * Represents the standings of a single team.
 */
export interface TeamStanding {
  name: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  points: number; // Points based on tournament rules (e.g., 2 for win, 1 for loss, etc.)
  setRatio: number; // Sets Won / Sets Lost (Infinity if Sets Lost is 0)
  pointRatio?: number; // Optional: Points Won / Points Lost (Requires final scores)
}

/**
 * Represents the standings for both groups.
 */
export interface GroupStandings {
  groupA: TeamStanding[];
  groupB: TeamStanding[];
}

/**
 * Represents the defined groups and their teams.
 */
export interface TeamsConfig {
   groupA: string[];
   groupB: string[];
 }
