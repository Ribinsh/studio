/**
 * Represents the standings of a single team.
 */
export interface TeamStanding {
  name: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  setsWon: number; // Keep sets won/lost for internal calculation if needed, but won't display ratio
  setsLost: number;
  points: number; // Points based on tournament rules (e.g., 2 for win, 1 for loss, etc.)
  breakPoints: number; // Numerical break points (e.g., point difference aggregate) for tie-breaking
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
