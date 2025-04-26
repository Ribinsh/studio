
'use client';

import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { LiveMatchScoreData, GroupStandings, TeamStanding } from '@/lib/types';
import { sortStandingsDisplay } from '@/lib/standings'; // Import sorting utility

// Define the shape of the context data
interface AppContextProps {
  teams: { groupA: string[]; groupB: string[] };
  liveMatch: LiveMatchScoreData | null;
  standings: GroupStandings | null;
  isLoading: boolean;
  // Removed addTeam from context props
  updateLiveScore: (scoreData: LiveMatchScoreData | null) => void;
  updateTeamStanding: (group: 'groupA' | 'groupB', teamIndex: number, updatedStanding: Partial<TeamStanding>) => void;
  // You might add functions to delete teams, clear all data etc. later
}

// Initial teams based on the provided fixture
const initialTeamsData = {
  groupA: ["Kanthapuram", "Marakkara", "Vaalal", "Puthankunnu"],
  groupB: ["Kizhisseri", "Kizhakkoth", "Kakkancheri"]
};

// Create the context with a default value reflecting the initial teams
export const AppContext = createContext<AppContextProps>({
  teams: initialTeamsData,
  liveMatch: null,
  standings: null, // Will be initialized based on initialTeamsData
  isLoading: true, // Start loading initially
  // Removed addTeam default function
  updateLiveScore: () => {},
  updateTeamStanding: () => {},
});

// Create the provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize teams state with fixed data
  const [teams, setTeams] = useState<{ groupA: string[]; groupB: string[] }>(initialTeamsData);
  const [liveMatch, setLiveMatch] = useState<LiveMatchScoreData | null>(null);
  const [standings, setStandings] = useState<GroupStandings | null>(null); // Initialize as null
  const [isLoading, setIsLoading] = useState(true); // Manage loading state

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
   const initializeStandingsForTeams = useCallback((currentTeams: { groupA: string[]; groupB: string[] }) => {
       console.log("AppContext: Initializing standings for teams:", currentTeams);
       const initialGroupA = currentTeams.groupA.map(createInitialStanding);
       const initialGroupB = currentTeams.groupB.map(createInitialStanding);
       const newStandings = {
           groupA: sortStandingsDisplay(initialGroupA),
           groupB: sortStandingsDisplay(initialGroupB),
       };
       setStandings(newStandings);
       // Save the initialized standings to localStorage
       localStorage.setItem('courtSideStandings', JSON.stringify(newStandings));
       console.log("AppContext: Initialized and saved standings:", newStandings);
   }, []); // No dependencies needed as createInitialStanding and sortStandingsDisplay are stable


  // --- Load data from localStorage on initial mount ---
  useEffect(() => {
    console.log("AppContext: Attempting to load data from localStorage...");
    setIsLoading(true); // Set loading true at the start
    try {
      // Teams are now fixed, no need to load from storage
      // const storedTeams = localStorage.getItem('courtSideTeams');
      const storedLiveMatch = localStorage.getItem('courtSideLiveMatch');
      const storedStandings = localStorage.getItem('courtSideStandings');

      // Always use the initialTeamsData
      setTeams(initialTeamsData);
      console.log("AppContext: Using fixed initial team data.");

      if (storedLiveMatch) {
        setLiveMatch(JSON.parse(storedLiveMatch));
        console.log("AppContext: Loaded live match from localStorage.");
      }

      if (storedStandings) {
          const parsedStandings = JSON.parse(storedStandings);
          // **Verification Step:** Check if stored standings align with initialTeamsData
          const storedTeamsA = new Set(parsedStandings.groupA?.map((t: TeamStanding) => t.name) || []);
          const storedTeamsB = new Set(parsedStandings.groupB?.map((t: TeamStanding) => t.name) || []);
          const initialTeamsSetA = new Set(initialTeamsData.groupA);
          const initialTeamsSetB = new Set(initialTeamsData.groupB);

          const teamsMatch =
              storedTeamsA.size === initialTeamsSetA.size && [...storedTeamsA].every(team => initialTeamsSetA.has(team)) &&
              storedTeamsB.size === initialTeamsSetB.size && [...storedTeamsB].every(team => initialTeamsSetB.has(team));

          if (teamsMatch) {
              // Ensure standings have the correct structure and sort them
              const sortedStandings = {
                  groupA: sortStandingsDisplay(parsedStandings.groupA || []),
                  groupB: sortStandingsDisplay(parsedStandings.groupB || []),
              };
              setStandings(sortedStandings);
              console.log("AppContext: Loaded and verified standings from localStorage match initial teams.");
          } else {
              console.warn("AppContext: Stored standings do not match initial team data. Re-initializing standings.");
              initializeStandingsForTeams(initialTeamsData); // Re-initialize if mismatch
          }
      } else {
          // Initialize standings based on fixed initial teams if no standings found
          console.log("AppContext: No standings found in localStorage. Initializing standings.");
          initializeStandingsForTeams(initialTeamsData);
      }

    } catch (error) {
      console.error("AppContext: Error loading data from localStorage:", error);
      // Initialize with fixed state if loading fails
       setTeams(initialTeamsData);
       setLiveMatch(null);
       initializeStandingsForTeams(initialTeamsData); // Initialize standings on error too
    } finally {
      setIsLoading(false); // Mark loading as complete
      console.log("AppContext: Initial data loading finished.");
    }
  // Run only once on mount, initializeStandingsForTeams is memoized
  }, [initializeStandingsForTeams]);


  // --- Save data to localStorage whenever it changes ---
  // No need to save teams anymore as they are fixed
  // useEffect(() => {
  //   if (!isLoading) { // Only save after initial load
  //       console.log("AppContext: Saving teams to localStorage...");
  //       localStorage.setItem('courtSideTeams', JSON.stringify(teams));
  //   }
  // }, [teams, isLoading]);

  useEffect(() => {
     if (!isLoading) {
        console.log("AppContext: Saving live match to localStorage...");
        // Ensure null is saved correctly
        localStorage.setItem('courtSideLiveMatch', liveMatch ? JSON.stringify(liveMatch) : 'null');
     }
  }, [liveMatch, isLoading]);

  useEffect(() => {
    if (!isLoading && standings) { // Only save after initial load and if standings exist
        console.log("AppContext: Saving standings to localStorage...");
        localStorage.setItem('courtSideStandings', JSON.stringify(standings));
    }
  }, [standings, isLoading]);

  // --- Action Functions ---

  // Removed addTeam function

  const updateLiveScore = useCallback((scoreData: LiveMatchScoreData | null) => {
    setLiveMatch(scoreData);
    console.log("AppContext: Updated live score.");
  }, []);

 const updateTeamStanding = useCallback((group: 'groupA' | 'groupB', teamIndex: number, updatedStanding: Partial<TeamStanding>) => {
     setStandings(prev => {
         if (!prev) return null;
         const newStandings = JSON.parse(JSON.stringify(prev)); // Deep copy
         if (newStandings[group] && newStandings[group][teamIndex]) {
             // Merge partial updates into the existing standing
             newStandings[group][teamIndex] = { ...newStandings[group][teamIndex], ...updatedStanding };
             // Sort the updated group
             newStandings[group] = sortStandingsDisplay(newStandings[group]);
             console.log(`AppContext: Updated standing for team at index ${teamIndex} in ${group}.`);
             return newStandings;
         } else {
             console.error(`AppContext: Could not find team at index ${teamIndex} in ${group} to update standing.`);
             return prev; // Return previous state if update fails
         }
     });
 }, []);


  // Memoize the context value to prevent unnecessary re-renders of consumers
   const contextValue = useMemo(() => ({
     teams,
     liveMatch,
     standings,
     isLoading,
     // Removed addTeam from context value
     updateLiveScore,
     updateTeamStanding,
   }), [teams, liveMatch, standings, isLoading, updateLiveScore, updateTeamStanding]);


  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

