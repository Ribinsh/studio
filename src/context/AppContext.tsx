
'use client';

import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { LiveMatchScoreData, GroupStandings, TeamStanding } from '@/lib/types';
import { sortStandingsDisplay } from '@/lib/standings';
import { useSubscription, useMutation, ApolloError, gql } from '@apollo/client';
import { SUBSCRIBE_LIVE_MATCH, UPDATE_LIVE_MATCH, CLEAR_LIVE_MATCH, SUBSCRIBE_STANDINGS, UPSERT_STANDINGS } from '@/graphql/operations';
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Define the shape of the context data
interface AppContextProps {
  teams: { groupA: string[]; groupB: string[] }; // Teams remain fixed for now
  liveMatch: LiveMatchScoreData | null;
  standings: GroupStandings | null;
  isLoading: boolean;
  error: ApolloError | string | null; // Allow string for custom errors
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
  const [appError, setAppError] = useState<ApolloError | string | null>(null); // Local state for errors
  const [isStandingsLoading, setIsStandingsLoading] = useState(true);
  const [isLiveMatchLoading, setIsLiveMatchLoading] = useState(true);

  // --- Hasura Subscriptions ---

  // Subscribe to Live Match Data
   const { data: liveMatchData, loading: liveMatchLoading, error: liveMatchError } = useSubscription<{ live_match: any[] }>(SUBSCRIBE_LIVE_MATCH, {
        fetchPolicy: 'network-only', // Ensure fresh data
        onError: (error) => {
             console.error("AppContext: Hasura liveMatch subscription error (onError callback):", JSON.stringify(error, null, 2));
             setAppError(`Live Match Sync Failed: ${error.message}`);
             setLiveMatch(null); // Clear live match on error
             toast({ title: "Error", description: "Could not sync live match data.", variant: "destructive" });
        }
   });

  useEffect(() => {
    setIsLiveMatchLoading(liveMatchLoading);
    if (liveMatchError) {
        // Error already handled by onError callback usually, but log just in case
      console.error("AppContext: Hasura liveMatch subscription error (useEffect check):", liveMatchError);
      // Set error state if not already set by onError
      if (!appError) {
          setAppError(`Live Match Sync Failed: ${liveMatchError.message}`);
          setLiveMatch(null); // Clear live match on error
      }
    } else if (liveMatchData && liveMatchData.live_match.length > 0) {
        const rawMatch = liveMatchData.live_match[0];
        // Transform Hasura data (snake_case) to camelCase for LiveMatchScoreData
        setLiveMatch({
            id: rawMatch.id, // Assuming 'id' is the primary key
            team1: rawMatch.team1,
            team1SetScore: rawMatch.team1_set_score,
            team1CurrentPoints: rawMatch.team1_current_points,
            team2: rawMatch.team2,
            team2SetScore: rawMatch.team2_set_score,
            team2CurrentPoints: rawMatch.team2_current_points,
            status: rawMatch.status || '', // Default to empty string if null
            matchType: rawMatch.match_type || '', // Default to empty string if null
        });
        // Clear error only if it was related to live match
        if (typeof appError === 'string' && appError.startsWith('Live Match')) {
             setAppError(null);
        } else if (appError instanceof ApolloError && appError.message.includes('Live Match')) {
             setAppError(null);
        }
    } else if (!liveMatchLoading) {
        // Data is empty, but not loading and no error
        setLiveMatch(null);
        // Clear error only if it was related to live match
         if (typeof appError === 'string' && appError.startsWith('Live Match')) {
             setAppError(null);
         }
    }
    // Include appError here cautiously. If it causes loops, refine error clearing logic.
  }, [liveMatchData, liveMatchLoading, liveMatchError, toast, appError]);


  // Subscribe to Standings Data
   const { data: standingsData, loading: standingsLoading, error: standingsError } = useSubscription<{ standings: any[] }>(SUBSCRIBE_STANDINGS, {
        fetchPolicy: 'network-only', // Ensure fresh data
        onError: (error) => {
            console.error("AppContext: Hasura standings subscription error (onError callback):", JSON.stringify(error, null, 2));
            // Check for specific "field not found" error
            if (error.message.includes("field 'standings' not found")) {
                console.error("❗ HASURA CHECK: The 'standings' field was not found in your Hasura GraphQL schema for subscriptions. Please ensure:");
                console.error("   1. A table named 'standings' exists in your connected database.");
                console.error("   2. The 'standings' table is tracked by Hasura (Data -> [table name] -> Modify -> Track Table).");
                console.error("   3. The role used by your application (likely via admin secret) has SELECT permissions for the 'standings' table.");
                console.error("   4. Reload Hasura metadata if you made recent changes.");
                setAppError("Standings Sync Failed: 'standings' field not found in Hasura schema. Check Hasura setup.");
            } else {
                 setAppError(`Standings Sync Failed: ${error.message}`);
            }
            setStandings(null); // Clear standings on error
            toast({ title: "Error", description: "Could not sync standings data.", variant: "destructive" });
        }
   });

   useEffect(() => {
     setIsStandingsLoading(standingsLoading);
     if (standingsError) {
       // Error already handled by onError callback usually, but log just in case
       console.error("AppContext: Hasura standings subscription error (useEffect check):", standingsError);
        // Set error state if not already set by onError
       if (!appError) {
          setAppError(`Standings Sync Failed: ${standingsError.message}`);
          setStandings(null); // Clear standings on error
       }
     } else if (standingsData && standingsData.standings) {
         // Process and group standings data using Maps for deduplication
         const groupAMap = new Map<string, TeamStanding>();
         const groupBMap = new Map<string, TeamStanding>();

         standingsData.standings.forEach((rawStanding: any) => {
           const teamStanding: TeamStanding = {
               // Assuming primary key is composite (group_key, name)
               // No need for separate ID if (group_key, name) is unique
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
               // Use team name as key to automatically handle duplicates
               groupAMap.set(teamStanding.name, teamStanding);
           } else if (rawStanding.group_key === 'B') {
               groupBMap.set(teamStanding.name, teamStanding);
           }
         });

         // Convert Maps back to arrays and sort
         const groupA = Array.from(groupAMap.values());
         const groupB = Array.from(groupBMap.values());

         setStandings({
             groupA: sortStandingsDisplay(groupA),
             groupB: sortStandingsDisplay(groupB),
         });

         // Clear error only if it was related to standings
         if (typeof appError === 'string' && appError.startsWith('Standings')) {
              setAppError(null);
         } else if (appError instanceof ApolloError && appError.message.includes('Standings')) {
              setAppError(null);
         }
     } else if (!standingsLoading) {
         // Data is empty, but not loading and no error
         setStandings(null);
         // Clear error only if it was related to standings
          if (typeof appError === 'string' && appError.startsWith('Standings')) {
              setAppError(null);
          }
     }
     // Include appError here cautiously. If it causes loops, refine error clearing logic.
   }, [standingsData, standingsLoading, standingsError, toast, appError]);

   // Determine overall loading state
   const isLoading = useMemo(() => isStandingsLoading || isLiveMatchLoading, [isStandingsLoading, isLiveMatchLoading]);

  // --- Hasura Mutations ---
  const [updateLiveMatchMutation] = useMutation(UPDATE_LIVE_MATCH);
  const [clearLiveMatchMutation] = useMutation(CLEAR_LIVE_MATCH);
  const [upsertStandingsMutation] = useMutation(UPSERT_STANDINGS);


  const updateLiveScore = useCallback(async (scoreData: LiveMatchScoreData | null) => {
     console.log("AppContext: Updating live score via Hasura:", scoreData);
     if (scoreData === null || !scoreData.team1 || !scoreData.team2) { // Add check for valid teams
        // Clear the live match data
        try {
             await clearLiveMatchMutation();
             // No toast here, success implied by UI update via subscription
        } catch (error: any) {
             console.error("AppContext: Failed to clear live score in Hasura:", error);
             toast({ title: "Error Clearing Score", description: `${error.message}`, variant: "destructive" });
             // Re-throw or handle as needed
             throw error;
        }
     } else {
        // Update or insert the live match data
        try {
             // Transform camelCase to snake_case for Hasura mutation input
             const hasuraInput = {
                 // Assuming a fixed ID = 1 for the single live match row
                 id: scoreData.id || 1, // Use provided ID or default to 1
                 team1: scoreData.team1,
                 team1_set_score: scoreData.team1SetScore,
                 team1_current_points: scoreData.team1CurrentPoints,
                 team2: scoreData.team2,
                 team2_set_score: scoreData.team2SetScore,
                 team2_current_points: scoreData.team2CurrentPoints,
                 status: scoreData.status || "", // Ensure non-null
                 match_type: scoreData.matchType || "", // Ensure non-null
             };
             await updateLiveMatchMutation({
                variables: { object: hasuraInput },
                 // No need for refetchQueries with subscriptions active
                 // refetchQueries: [{ query: SUBSCRIBE_LIVE_MATCH }]
                });
             // No toast here, success implied by UI update via subscription
        } catch (error: any) {
             console.error("AppContext: Failed to update live score in Hasura:", error);
             toast({ title: "Error Updating Score", description: `${error.message}`, variant: "destructive" });
             // Re-throw or handle as needed
             throw error;
        }
     }
  }, [toast, updateLiveMatchMutation, clearLiveMatchMutation]);


  const updateAllStandings = useCallback(async (updatedStandings: GroupStandings) => {
    console.log("AppContext: Updating all standings via Hasura:", updatedStandings);
       if (!updatedStandings || !updatedStandings.groupA || !updatedStandings.groupB) {
            const errorMsg = "Invalid standings data provided.";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
            throw new Error(errorMsg); // Throw error to indicate failure in Admin page
       }

       // Combine group A and B and transform to Hasura input format
       const hasuraObjects = [
           ...updatedStandings.groupA.map(team => ({
               group_key: 'A',
               name: team.name,
               matches_played: team.matchesPlayed ?? 0, // Provide defaults
               wins: team.wins ?? 0,
               losses: team.losses ?? 0,
               sets_won: team.setsWon ?? 0,
               sets_lost: team.setsLost ?? 0,
               points: team.points ?? 0,
               break_points: team.breakPoints ?? 0,
           })),
           ...updatedStandings.groupB.map(team => ({
               group_key: 'B',
               name: team.name,
               matches_played: team.matchesPlayed ?? 0,
               wins: team.wins ?? 0,
               losses: team.losses ?? 0,
               sets_won: team.setsWon ?? 0,
               sets_lost: team.setsLost ?? 0,
               points: team.points ?? 0,
               break_points: team.breakPoints ?? 0,
           })),
       ];

       try {
           await upsertStandingsMutation({
             variables: { objects: hasuraObjects },
              // No need for refetchQueries with subscriptions active
             // refetchQueries: [{ query: SUBSCRIBE_STANDINGS }]
            });
           // Toast might be better handled in the admin page after successful mutation call
           // toast({ title: "Success", description: "Standings updated globally." });
       } catch (error: any) {
           console.error("AppContext: Failed to update standings in Hasura:", error);
           toast({ title: "Error Updating Standings", description: `${error.message}`, variant: "destructive" });
           // Re-throw or handle as needed
           throw error;
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

    