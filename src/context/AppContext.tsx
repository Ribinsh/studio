
'use client';

import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { LiveMatchScoreData, GroupStandings, TeamStanding } from '@/lib/types';
import { sortStandingsDisplay } from '@/lib/standings';
import { database } from '@/lib/firebase'; // Import Firebase database instance (can be null)
import { ref, set, onValue, off, get } from 'firebase/database'; // Import Firebase Realtime DB functions
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Define the shape of the context data
interface AppContextProps {
  teams: { groupA: string[]; groupB: string[] }; // Teams remain fixed for now
  liveMatch: LiveMatchScoreData | null;
  standings: GroupStandings | null;
  isLoading: boolean;
  updateLiveScore: (scoreData: LiveMatchScoreData | null) => Promise<void>; // Make async
  updateAllStandings: (updatedStandings: GroupStandings) => Promise<void>; // New function to update all standings
}

// Initial teams based on the provided fixture - remains static for now
const initialTeamsData = {
  groupA: ["Kanthapuram", "Marakkara", "Vaalal", "Puthankunnu"],
  groupB: ["Kizhisseri", "Kizhakkoth", "Kakkancheri"]
};

// Helper to create initial standing for a team
const createInitialStanding = (teamName: string): TeamStanding => ({
    name: teamName,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    setsWon: 0,
    setsLost: 0,
    points: 0,
    breakPoints: 0,
});

// Helper to initialize standings for given teams
const initializeFirebaseStandings = async (currentTeams: { groupA: string[]; groupB: string[] }) => {
    if (!database) {
        console.error("AppContext: Cannot initialize standings, Firebase database is not available.");
        return null;
    }
    console.log("AppContext: Initializing Firebase standings for teams:", currentTeams);
    const initialGroupA = currentTeams.groupA.map(createInitialStanding);
    const initialGroupB = currentTeams.groupB.map(createInitialStanding);
    const initialStandings: GroupStandings = {
        groupA: sortStandingsDisplay(initialGroupA),
        groupB: sortStandingsDisplay(initialGroupB),
    };
    try {
        await set(ref(database, 'standings'), initialStandings);
        console.log("AppContext: Initialized and saved standings to Firebase.");
        return initialStandings;
    } catch (error) {
        console.error("AppContext: Failed to initialize standings in Firebase:", error);
        return null; // Return null on failure
    }
};


// Create the context with a default value
export const AppContext = createContext<AppContextProps>({
  teams: initialTeamsData,
  liveMatch: null,
  standings: null,
  isLoading: true,
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
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch data from Firebase on initial mount and listen for updates ---
  useEffect(() => {
    // Only proceed if database is initialized
    if (!database) {
        console.error("AppContext: Firebase database not initialized. Cannot set up listeners.");
        setIsLoading(false); // Set loading to false as we can't load data
        toast({
            title: "Configuration Error",
            description: "Could not connect to the database. Please check the setup.",
            variant: "destructive",
            duration: 10000, // Show for longer
        });
        return; // Exit useEffect early
    }

    console.log("AppContext: Setting up Firebase listeners...");
    setIsLoading(true);

    const liveMatchRef = ref(database, 'liveMatch');
    const standingsRef = ref(database, 'standings');

    // Listener for Live Match Data
    const liveMatchListener = onValue(liveMatchRef, (snapshot) => {
      const data = snapshot.val();
      console.log("AppContext: Received liveMatch update from Firebase:", data);
      setLiveMatch(data ? { ...data, matchType: data.matchType || '' } : null);
    }, (error) => {
      console.error("AppContext: Firebase liveMatch listener error:", error);
      toast({ title: "Error", description: "Could not sync live match data.", variant: "destructive" });
      // Optionally set liveMatch to null or keep existing state on error
    });

    // Listener for Standings Data
    const standingsListener = onValue(standingsRef, (snapshot) => {
        const data: GroupStandings | null = snapshot.val();
        console.log("AppContext: Received standings update from Firebase:", data);
        if (data && data.groupA && data.groupB) {
             // Ensure sorting on fetch/update
             const sortedData = {
                 groupA: sortStandingsDisplay(data.groupA),
                 groupB: sortStandingsDisplay(data.groupB),
             };
            setStandings(sortedData);
        } else {
            console.log("AppContext: Standings data from Firebase is null or invalid. Attempting to initialize.");
            // Attempt to initialize if data is missing/invalid
            initializeFirebaseStandings(initialTeamsData).then(initializedData => {
                if (initializedData) {
                    setStandings(initializedData); // Set local state after initializing FB
                } else {
                     setStandings(null); // Set to null if initialization failed
                     toast({ title: "Warning", description: "Could not initialize standings data.", variant: "destructive" });
                }
            });
        }
         // Set loading to false after the first standings update is processed
         setIsLoading(false);
    }, (error) => {
        console.error("AppContext: Firebase standings listener error:", error);
        toast({ title: "Error", description: "Could not sync standings data.", variant: "destructive" });
        setIsLoading(false); // Set loading false even on error
        setStandings(null); // Set standings to null on error
    });


    // Cleanup listeners on component unmount
    return () => {
      console.log("AppContext: Cleaning up Firebase listeners.");
      // Check if database exists before calling off
      if(database) {
          off(liveMatchRef, 'value', liveMatchListener);
          off(standingsRef, 'value', standingsListener);
      }
    };
  // Run only once on mount
  }, [toast]); // Add toast to dependency array


  // --- Action Functions ---

  const updateLiveScore = useCallback(async (scoreData: LiveMatchScoreData | null) => {
     if (!database) {
         console.error("AppContext: Cannot update live score, Firebase database is not available.");
         toast({ title: "Error", description: "Database connection unavailable.", variant: "destructive" });
         return;
     }
     console.log("AppContext: Updating live score in Firebase:", scoreData);
     try {
        // Ensure matchType exists, default to empty string if not provided
        const dataToSet = scoreData ? { ...scoreData, matchType: scoreData.matchType || '' } : null;
        await set(ref(database, 'liveMatch'), dataToSet);
        // No toast here to avoid flooding, success is implied by UI update
        // toast({ title: "Success", description: "Live score updated globally." });
     } catch (error: any) {
        console.error("AppContext: Failed to update live score in Firebase:", error);
        toast({ title: "Error", description: `Failed to update live score: ${error.message}`, variant: "destructive" });
     }
  }, [toast]);


  const updateAllStandings = useCallback(async (updatedStandings: GroupStandings) => {
       if (!database) {
           console.error("AppContext: Cannot update standings, Firebase database is not available.");
           toast({ title: "Error", description: "Database connection unavailable.", variant: "destructive" });
           return;
       }
       console.log("AppContext: Updating all standings in Firebase:", updatedStandings);
       if (!updatedStandings || !updatedStandings.groupA || !updatedStandings.groupB) {
            toast({ title: "Error", description: "Invalid standings data provided.", variant: "destructive" });
            return;
       }
       try {
           // Ensure the standings being saved are sorted correctly
           const sortedStandings = {
               groupA: sortStandingsDisplay(updatedStandings.groupA),
               groupB: sortStandingsDisplay(updatedStandings.groupB),
           };
           await set(ref(database, 'standings'), sortedStandings);
           // Toast moved to Admin page upon successful save action
           // toast({ title: "Success", description: "Standings updated globally." });
       } catch (error: any) {
           console.error("AppContext: Failed to update standings in Firebase:", error);
           toast({ title: "Error", description: `Failed to update standings: ${error.message}`, variant: "destructive" });
       }
   }, [toast]);


  // Memoize the context value
  const contextValue = useMemo(() => ({
     teams,
     liveMatch,
     standings,
     isLoading,
     updateLiveScore,
     updateAllStandings, // Use the new function name
  }), [teams, liveMatch, standings, isLoading, updateLiveScore, updateAllStandings]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
