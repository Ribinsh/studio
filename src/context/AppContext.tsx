
'use client';

import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { LiveMatchScoreData, GroupStandings, TeamStanding } from '@/lib/types';
import { sortStandingsDisplay } from '@/lib/standings';
import { useSubscription, useMutation, ApolloError } from '@apollo/client';
import { SUBSCRIBE_LIVE_MATCH, UPDATE_LIVE_MATCH, CLEAR_LIVE_MATCH, SUBSCRIBE_STANDINGS, UPSERT_STANDINGS } from '@/graphql/operations';
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Define the shape of the context data
interface AppContextProps {
  teams: { groupA: string[]; groupB: string[] }; // Teams remain fixed for now
  liveMatch: LiveMatchScoreData | null;
  standings: GroupStandings | null;
  isLoading: boolean;
  error: ApolloError | null; // To store potential GraphQL errors
  updateLiveScore: (scoreData: LiveMatchScoreData | null) => Promise<void>; // Make async
  updateAllStandings: (updatedStandings: GroupStandings) => Promise<void>; // For batch updates
}

// Initial teams based on the provided fixture - remains static for now
const initialTeamsData = {
  groupA: ["Kanthapuram", "Marakkara", "Vaalal", "Puthankunnu"],
  groupB: ["Kizhisseri", "Kizhakkoth", "Kakkancheri"]
};

// Create the context with a default value
export const AppContext = createContext<AppContextProps>({
  teams: initialTeamsData,
  liveMatch: null,
  standings: null,
  isLoading: true,
  error: null,
  updateLiveScore: async () => {},
  updateAllStandings: async () => {},
});

// Create the provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast(); // Get toast function

  // Teams remain static for now
  const [teams] = useState<{ groupA: string[]; groupB: string[] }>(initialTeamsData);
  const [liveMatch, setLiveMatch] = useState<LiveMatchScoreData | null>(null);
  const [standings, setStandings] = useState<GroupStandings | null>(null);
  const [appError, setAppError] = useState<ApolloError | null>(null); // Local state for errors
  const [isStandingsLoading, setIsStandingsLoading] = useState(true);
  const [isLiveMatchLoading, setIsLiveMatchLoading] = useState(true);

  // --- Hasura Subscriptions ---

  // Subscribe to Live Match Data
   const { data: liveMatchData, loading: liveMatchLoading, error: liveMatchError } = useSubscription<{ live_match: any[] }>(SUBSCRIBE_LIVE_MATCH);

  useEffect(() => {
    setIsLiveMatchLoading(liveMatchLoading);
    if (liveMatchError) {
      console.error("AppContext: Hasura liveMatch subscription error:", liveMatchError);
      setAppError(liveMatchError);
      setLiveMatch(null); // Clear live match on error
      toast({ title: "Error", description: "Could not sync live match data.", variant: "destructive" });
    } else if (liveMatchData && liveMatchData.live_match.length > 0) {
        const rawMatch = liveMatchData.live_match[0];
        // Transform Hasura data (snake_case) to camelCase for LiveMatchScoreData
        setLiveMatch({
            team1: rawMatch.team1,
            team1SetScore: rawMatch.team1_set_score,
            team1CurrentPoints: rawMatch.team1_current_points,
            team2: rawMatch.team2,
            team2SetScore: rawMatch.team2_set_score,
            team2CurrentPoints: rawMatch.team2_current_points,
            status: rawMatch.status || '', // Default to empty string if null
            matchType: rawMatch.match_type || '', // Default to empty string if null
        });
        setAppError(null); // Clear error on successful data fetch
    } else if (!liveMatchLoading) {
        // Data is empty, but not loading and no error
        setLiveMatch(null);
         setAppError(null);
    }
  }, [liveMatchData, liveMatchLoading, liveMatchError, toast]);


  // Subscribe to Standings Data
   const { data: standingsData, loading: standingsLoading, error: standingsError } = useSubscription<{ standings: any[] }>(SUBSCRIBE_STANDINGS);

   useEffect(() => {
     setIsStandingsLoading(standingsLoading);
     if (standingsError) {
       console.error("AppContext: Hasura standings subscription error:", standingsError);
       setAppError(standingsError);
       setStandings(null); // Clear standings on error
       toast({ title: "Error", description: "Could not sync standings data.", variant: "destructive" });
     } else if (standingsData && standingsData.standings) {
        // Process and group standings data
        const groupA: TeamStanding[] = [];
        const groupB: TeamStanding[] = [];

        standingsData.standings.forEach((rawStanding: any) => {
           const teamStanding: TeamStanding = {
               name: rawStanding.name,
               matchesPlayed: rawStanding.matches_played,
               wins: rawStanding.wins,
               losses: rawStanding.losses,
               setsWon: rawStanding.sets_won,
               setsLost: rawStanding.sets_lost,
               points: rawStanding.points,
               breakPoints: rawStanding.break_points,
           };
           if (rawStanding.group_key === 'A') {
               groupA.push(teamStanding);
           } else if (rawStanding.group_key === 'B') {
               groupB.push(teamStanding);
           }
        });

        // Ensure sorting after grouping
        setStandings({
            groupA: sortStandingsDisplay(groupA),
            groupB: sortStandingsDisplay(groupB),
        });
        setAppError(null); // Clear error on successful data fetch
     } else if (!standingsLoading) {
        // Data is empty, but not loading and no error
        setStandings(null);
        setAppError(null);
     }
   }, [standingsData, standingsLoading, standingsError, toast]);

   // Determine overall loading state
   const isLoading = useMemo(() => isStandingsLoading || isLiveMatchLoading, [isStandingsLoading, isLiveMatchLoading]);

  // --- Hasura Mutations ---
  const [updateLiveMatchMutation] = useMutation(UPDATE_LIVE_MATCH);
  const [clearLiveMatchMutation] = useMutation(CLEAR_LIVE_MATCH);
  const [upsertStandingsMutation] = useMutation(UPSERT_STANDINGS);


  const updateLiveScore = useCallback(async (scoreData: LiveMatchScoreData | null) => {
     console.log("AppContext: Updating live score via Hasura:", scoreData);
     if (scoreData === null) {
        // Clear the live match data
        try {
             await clearLiveMatchMutation();
             // No toast here, success implied by UI update via subscription
        } catch (error: any) {
             console.error("AppContext: Failed to clear live score in Hasura:", error);
             toast({ title: "Error", description: `Failed to clear live score: ${error.message}`, variant: "destructive" });
        }
     } else {
        // Update or insert the live match data
        try {
             // Transform camelCase to snake_case for Hasura mutation input
             const hasuraInput = {
                 // Assuming a fixed ID or letting Hasura handle the singleton logic
                 // id: 1, // Include if your table has an ID column
                 team1: scoreData.team1,
                 team1_set_score: scoreData.team1SetScore,
                 team1_current_points: scoreData.team1CurrentPoints,
                 team2: scoreData.team2,
                 team2_set_score: scoreData.team2SetScore,
                 team2_current_points: scoreData.team2CurrentPoints,
                 status: scoreData.status || "", // Ensure non-null
                 match_type: scoreData.matchType || "", // Ensure non-null
             };
             await updateLiveMatchMutation({ variables: { object: hasuraInput } });
             // No toast here, success implied by UI update via subscription
        } catch (error: any) {
             console.error("AppContext: Failed to update live score in Hasura:", error);
             toast({ title: "Error", description: `Failed to update live score: ${error.message}`, variant: "destructive" });
        }
     }
  }, [toast, updateLiveMatchMutation, clearLiveMatchMutation]);


  const updateAllStandings = useCallback(async (updatedStandings: GroupStandings) => {
    console.log("AppContext: Updating all standings via Hasura:", updatedStandings);
       if (!updatedStandings || !updatedStandings.groupA || !updatedStandings.groupB) {
            toast({ title: "Error", description: "Invalid standings data provided.", variant: "destructive" });
            return;
       }

       // Combine group A and B and transform to Hasura input format
       const hasuraObjects = [
           ...updatedStandings.groupA.map(team => ({
               group_key: 'A',
               name: team.name,
               matches_played: team.matchesPlayed,
               wins: team.wins,
               losses: team.losses,
               sets_won: team.setsWon,
               sets_lost: team.setsLost,
               points: team.points,
               break_points: team.breakPoints,
           })),
           ...updatedStandings.groupB.map(team => ({
               group_key: 'B',
               name: team.name,
               matches_played: team.matchesPlayed,
               wins: team.wins,
               losses: team.losses,
               sets_won: team.setsWon,
               sets_lost: team.setsLost,
               points: team.points,
               break_points: team.breakPoints,
           })),
       ];

       try {
           await upsertStandingsMutation({ variables: { objects: hasuraObjects } });
           // Toast might be better handled in the admin page after successful mutation call
           // toast({ title: "Success", description: "Standings updated globally." });
       } catch (error: any) {
           console.error("AppContext: Failed to update standings in Hasura:", error);
           toast({ title: "Error", description: `Failed to update standings: ${error.message}`, variant: "destructive" });
       }
   }, [toast, upsertStandingsMutation]);


  // Memoize the context value
  const contextValue = useMemo(() => ({
     teams,
     liveMatch,
     standings,
     isLoading,
     error: appError, // Pass the error state
     updateLiveScore,
     updateAllStandings,
  }), [teams, liveMatch, standings, isLoading, appError, updateLiveScore, updateAllStandings]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
