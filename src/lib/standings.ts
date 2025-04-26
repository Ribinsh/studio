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
      breakPoints: 0, // Initialize break points
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

   // Determine if the match is finished based on status field or set scores
   const isFinished = match.status?.toLowerCase() === 'finished' || match.team1SetScore >= 2 || match.team2SetScore >= 2;

   if (!isFinished) {
     return; // Don't update standings for ongoing or upcoming matches
   }

   // Ensure scores and point differences are numbers, default to 0 if not
   const team1SetScore = Number(match.team1SetScore) || 0;
   const team2SetScore = Number(match.team2SetScore) || 0;
   const team1PointDiff = Number(match.team1PointDiff) || 0;
   const team2PointDiff = Number(match.team2PointDiff) || 0;


  // Update matches played *only* if the match is finished
  standings[team1].matchesPlayed += 1;
  standings[team2].matchesPlayed += 1;

  // Update sets won/lost
  standings[team1].setsWon += team1SetScore;
  standings[team1].setsLost += team2SetScore;
  standings[team2].setsWon += team2SetScore;
  standings[team2].setsLost += team1SetScore;

  // Update break points (aggregate point difference)
  standings[team1].breakPoints += team1PointDiff;
  standings[team2].breakPoints += team2PointDiff;


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
  } else {
      // Handle cases like forfeits if point differences are set but sets might be 0-0
      // Or if points are assigned differently for 2-0 vs 2-1 wins (though current POINTS constants don't reflect that)
      // If a match didn't complete but counts as played (e.g. forfeit with points assigned)
      // ensure points are added if necessary based on rules.
      // Current logic assumes a standard finished match based on set scores for point assignment.
      // A status like 'Forfeit Team1' could trigger different point logic if needed.
  }

  // Note: Set Ratio and Point Ratio calculations removed as per requirement.
}

/**
 * Sorts team standings based on tournament rules:
 * 1. Points (desc)
 * 2. Number of Matches Won (desc)
 * 3. Break Points (Point Difference) (desc)
 * 4. Team Name (asc)
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
    // 3. Sort by Break Points (Point Difference) (descending)
    if (b.breakPoints !== a.breakPoints) {
      return b.breakPoints - a.breakPoints;
    }

    // 4. Sort by Name (ascending) as the final tie-breaker
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

   // No recalculations needed after processing all matches unless logic changes

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
