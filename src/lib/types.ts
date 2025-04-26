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
  points: number; // Points based on tournament rules (e.g., 3 for win, 1 for loss, etc.)
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
```

</content>
  </change>