import type { MatchData } from '@/services/google-sheets';
import type { TeamStanding, GroupStandings, TeamsConfig } from './types';

const POINTS_FOR_WIN = 2; // Standard volleyball points for a win
const POINTS_FOR_LOSS = 1; // Standard volleyball points for a loss (if match played)
const POINTS_FOR_FORFEIT_WIN = 2; // Points if opponent forfeits
const POINTS_FOR_FORFEIT_LOSS = 0; // Points if team forfeits


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
      setRatio: 0, // Initialize set ratio
      pointRatio: 0, // Initialize point ratio (if needed later)
    };
  });
  return standings;
}

/**
 * Updates the standings of two teams based on a single match result.
 * Assumes a standard best-of-3 or best-of-5 scenario where the first team to win 2 (or 3) sets wins the match.
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

   // Determine if the match is finished based on standard volleyball rules (e.g., first to 2 sets)
   const isFinished = match.team1SetScore >= 2 || match.team2SetScore >= 2;

   if (!isFinished) {
     return; // Don't update standings for ongoing or upcoming matches
   }

   // Ensure scores are numbers, default to 0 if not
   const team1SetScore = Number(match.team1SetScore) || 0;
   const team2SetScore = Number(match.team2SetScore) || 0;


  // Update matches played *only* if the match is finished
  standings[team1].matchesPlayed += 1;
  standings[team2].matchesPlayed += 1;

  // Update sets won/lost
  standings[team1].setsWon += team1SetScore;
  standings[team1].setsLost += team2SetScore;
  standings[team2].setsWon += team2SetScore;
  standings[team2].setsLost += team1SetScore;

  // Determine winner and loser based on set score and assign points
  if (team1SetScore > team2SetScore) {
    // Team 1 wins
    standings[team1].wins += 1;
    standings[team1].points += POINTS_FOR_WIN;
    standings[team2].losses += 1;
    standings[team2].points += POINTS_FOR_LOSS;
  } else if (team2SetScore > team1SetScore) {
    // Team 2 wins
    standings[team2].wins += 1;
    standings[team2].points += POINTS_FOR_WIN;
    standings[team1].losses += 1;
    standings[team1].points += POINTS_FOR_LOSS;
  }
  // Note: No explicit handling for draws needed as volleyball matches don't end in set draws.
  // A match might be forfeited, which could be handled by specific set scores (e.g., 2-0 or 0-2 with 0 points)
  // or potentially a dedicated status field if available from the source data.

  // Calculate set ratio (handle division by zero)
   standings[team1].setRatio = standings[team1].setsLost === 0 ? (standings[team1].setsWon > 0 ? Infinity : 0) : standings[team1].setsWon / standings[team1].setsLost;
   standings[team2].setRatio = standings[team2].setsLost === 0 ? (standings[team2].setsWon > 0 ? Infinity : 0) : standings[team2].setsWon / standings[team2].setsLost;

}

/**
 * Sorts team standings based on common volleyball tournament rules:
 * 1. Points (desc)
 * 2. Number of Matches Won (desc)
 * 3. Set Ratio (Sets Won / Sets Lost) (desc) - Handle division by zero
 * 4. Point Ratio (Total Points Won / Total Points Lost) (desc) - Requires final scores, omitted for now
 * 5. Head-to-Head result (Requires specific logic, omitted for simplicity)
 * 6. Team Name (asc)
 * @param standings - Array of team standings.
 * @returns Sorted array of team standings.
 */
function sortStandings(standings: TeamStanding[]): TeamStanding[] {
  return standings.sort((a, b) => {
    // 1. Sort by Points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2. Sort by Number of Matches Won (descending)
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    // 3. Sort by Set Ratio (descending)
    if (b.setRatio !== a.setRatio) {
       // Handle Infinity cases correctly (higher ratio is better)
       if (a.setRatio === Infinity && b.setRatio !== Infinity) return -1;
       if (b.setRatio === Infinity && a.setRatio !== Infinity) return 1;
      return b.setRatio - a.setRatio;
    }

    // 4. Sort by Point Ratio (Requires final scores, currently omitted)
    // const pointRatioA = a.pointsLost === 0 ? (a.pointsWon > 0 ? Infinity : 0) : a.pointsWon / a.pointsLost;
    // const pointRatioB = b.pointsLost === 0 ? (b.pointsWon > 0 ? Infinity : 0) : b.pointsWon / b.pointsLost;
    // if (pointRatioB !== pointRatioA) {
    //    if (pointRatioA === Infinity && pointRatioB !== Infinity) return -1;
    //    if (pointRatioB === Infinity && pointRatioA !== Infinity) return 1;
    //   return pointRatioB - pointRatioA;
    // }

    // 5. Sort by Head-to-Head (Omitted for simplicity)
    // Requires looking up the result of the match between a and b.

    // 6. Sort by Name (ascending) as the final tie-breaker
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

  // First pass: update standings based on each match
  matches.forEach(match => {
    updateStandingsForMatch(standings, match);
  });

   // Recalculate ratios after all matches are processed
   Object.values(standings).forEach(team => {
     team.setRatio = team.setsLost === 0 ? (team.setsWon > 0 ? Infinity : 0) : team.setsWon / team.setsLost;
     // Calculate point ratio here if final scores are reliably available and needed
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
