import type { MatchData } from '@/services/google-sheets';
import type { TeamStanding, GroupStandings, TeamsConfig } from './types';

const POINTS_FOR_WIN = 3;
const POINTS_FOR_LOSS = 1; // Example: Adjust based on tournament rules


/**
 * Initializes the standings for a list of teams.
 * @param teams - Array of team names.
 * @returns An object mapping team names to their initial standing data.
 */
function initializeStandings(teams: string[]): Record<string, TeamStanding> {
  const standings: Record<string, TeamStanding> = {};
  teams.forEach(team => {
    standings[team] = {
      name: team,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      points: 0,
    };
  });
  return standings;
}

/**
 * Updates the standings of two teams based on a single match result.
 * @param standings - The current standings record.
 * @param match - The match data.
 */
function updateStandingsForMatch(standings: Record<string, TeamStanding>, match: MatchData): void {
  const team1 = match.team1;
  const team2 = match.team2;

  // Ensure both teams exist in the standings before processing
  if (!standings[team1] || !standings[team2]) {
     console.warn(`Skipping match ${match.matchNo}: One or both teams (${team1}, ${team2}) not found in configured groups.`);
     return;
   }

  // Only update if the match is considered finished (based on set scores)
   // Assuming best of 3 sets for finish condition
   const isFinished = match.team1SetScore >= 2 || match.team2SetScore >= 2;
   if (!isFinished) {
     return; // Don't update standings for ongoing or upcoming matches
   }


  // Update matches played
  standings[team1].matchesPlayed += 1;
  standings[team2].matchesPlayed += 1;

  // Update sets won/lost
  standings[team1].setsWon += match.team1SetScore;
  standings[team1].setsLost += match.team2SetScore;
  standings[team2].setsWon += match.team2SetScore;
  standings[team2].setsLost += match.team1SetScore;

  // Determine winner and loser based on set score
  if (match.team1SetScore > match.team2SetScore) {
    // Team 1 wins
    standings[team1].wins += 1;
    standings[team1].points += POINTS_FOR_WIN;
    standings[team2].losses += 1;
    standings[team2].points += POINTS_FOR_LOSS;
  } else if (match.team2SetScore > match.team1SetScore) {
    // Team 2 wins
    standings[team2].wins += 1;
    standings[team2].points += POINTS_FOR_WIN;
    standings[team1].losses += 1;
    standings[team1].points += POINTS_FOR_LOSS;
  } else {
    // Handle draws if applicable by tournament rules (unlikely in volleyball sets)
     console.warn(`Match ${match.matchNo} between ${team1} and ${team2} has equal set scores (${match.team1SetScore}-${match.team2SetScore}). Standings might be inaccurate if this isn't a draw scenario.`);
     // Optionally assign points for a draw if rules allow
  }
}

/**
 * Sorts team standings based on tournament rules (Points > Set Difference > Sets Won > Name).
 * @param standings - Array of team standings.
 * @returns Sorted array of team standings.
 */
function sortStandings(standings: TeamStanding[]): TeamStanding[] {
  return standings.sort((a, b) => {
    // 1. Sort by Points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2. Sort by Set Difference (descending)
    const setDiffA = a.setsWon - a.setsLost;
    const setDiffB = b.setsWon - b.setsLost;
    if (setDiffB !== setDiffA) {
      return setDiffB - setDiffA;
    }
    // 3. Sort by Sets Won (descending)
    if (b.setsWon !== a.setsWon) {
      return b.setsWon - a.setsWon;
    }
     // 4. Sort by Head-to-Head (Requires access to all match data - complex, omitted for now)

    // 5. Sort by Name (ascending) for tie-breaking
    return a.name.localeCompare(b.name);
  });
}


/**
 * Calculates the group standings based on match data and team configurations.
 * @param matches - Array of all match data.
 * @param teamsConfig - The configuration of teams in each group.
 * @returns The calculated group standings.
 */
export function calculateStandings(matches: MatchData[], teamsConfig: TeamsConfig): GroupStandings {
  const allTeams = [...teamsConfig.groupA, ...teamsConfig.groupB];
  const standings = initializeStandings(allTeams);

  matches.forEach(match => {
    updateStandingsForMatch(standings, match);
  });

  // Filter and sort standings for each group
  const groupAStandings = sortStandings(
    teamsConfig.groupA.map(teamName => standings[teamName]).filter(Boolean) // Filter out undefined if team not in standings obj
  );
  const groupBStandings = sortStandings(
    teamsConfig.groupB.map(teamName => standings[teamName]).filter(Boolean)
  );


  return {
    groupA: groupAStandings,
    groupB: groupBStandings,
  };
}
```

</content>
  </change>