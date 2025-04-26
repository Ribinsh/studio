

/**
 * Represents the standings of a single team.
 */
export interface TeamStanding {
  // id?: string | number; // Optional: Add if you have a simple primary key in Hasura
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

/**
 * Represents the data structure for the *live* match score,
 * managed via the admin page or potentially fetched later.
 */
export interface LiveMatchScoreData {
  /**
   * Optional: Unique identifier for the live match record (if using primary key).
   */
  id?: number | string;
  /**
   * The match number (optional).
   */
  matchNo?: number;
  /**
   * The name of the first team. MUST NOT BE EMPTY
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
   * The name of the second team. MUST NOT BE EMPTY
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
   /**
    * Optional type of the match.
    */
   matchType?: 'Group Stage' | 'Qualifier' | 'Exhibition' | 'Semi-Final' | 'Final' | ''; // Add matchType
}

