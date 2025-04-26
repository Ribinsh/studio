
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
  addTeam: (group: 'groupA' | 'groupB', teamName: string) => void;
  updateLiveScore: (scoreData: LiveMatchScoreData | null) => void;
  updateTeamStanding: (group: 'groupA' | 'groupB', teamIndex: number, updatedStanding: Partial<TeamStanding>) => void;
  // You might add functions to delete teams, clear all data etc. later
}

// Create the context with a default value
export const AppContext = createContext<AppContextProps>({
  teams: { groupA: [], groupB: [] },
  liveMatch: null,
  standings: null,
  isLoading: true, // Start loading initially
  addTeam: () => {},
  updateLiveScore: () => {},
  updateTeamStanding: () => {},
});

// Create the provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<{ groupA: string[]; groupB: string[] }>({ groupA: [], groupB: [] });
  const [liveMatch, setLiveMatch] = useState<LiveMatchScoreData | null>(null);
  const [standings, setStandings] = useState<GroupStandings | null>({ groupA: [], groupB: [] });
  const [isLoading, setIsLoading] = useState(true); // Manage loading state

  // --- Load data from localStorage on initial mount ---
  useEffect(() => {
    console.log("AppContext: Attempting to load data from localStorage...");
    try {
      const storedTeams = localStorage.getItem('courtSideTeams');
      const storedLiveMatch = localStorage.getItem('courtSideLiveMatch');
      const storedStandings = localStorage.getItem('courtSideStandings');

      if (storedTeams) {
        setTeams(JSON.parse(storedTeams));
        console.log("AppContext: Loaded teams from localStorage.");
      } else {
         // Initialize standings if teams are loaded but standings are not
         const initialTeams = JSON.parse(storedTeams || '{"groupA":[],"groupB":[]}');
         initializeStandingsForTeams(initialTeams);
         console.log("AppContext: Initialized standings for loaded teams.");
      }

      if (storedLiveMatch) {
        setLiveMatch(JSON.parse(storedLiveMatch));
        console.log("AppContext: Loaded live match from localStorage.");
      }

      if (storedStandings) {
        const parsedStandings = JSON.parse(storedStandings);
         // Ensure standings have the correct structure and sort them
         const sortedStandings = {
           groupA: sortStandingsDisplay(parsedStandings.groupA || []),
           groupB: sortStandingsDisplay(parsedStandings.groupB || []),
         };
        setStandings(sortedStandings);
        console.log("AppContext: Loaded and sorted standings from localStorage.");
      } else if (storedTeams) {
         // Initialize standings based on loaded teams if no standings found
         const initialTeams = JSON.parse(storedTeams);
         initializeStandingsForTeams(initialTeams);
         console.log("AppContext: Initialized standings as none were found in localStorage.");
       }

    } catch (error) {
      console.error("AppContext: Error loading data from localStorage:", error);
      // Initialize with empty state if loading fails
       setTeams({ groupA: [], groupB: [] });
       setLiveMatch(null);
       setStandings({ groupA: [], groupB: [] });
    } finally {
      setIsLoading(false); // Mark loading as complete
      console.log("AppContext: Initial data loading finished.");
    }
  }, []); // Empty dependency array ensures this runs only once on mount

   // Helper to initialize standings when teams are added or loaded
   const initializeStandingsForTeams = (currentTeams: { groupA: string[]; groupB: string[] }) => {
     const initialGroupA = currentTeams.groupA.map(createInitialStanding);
     const initialGroupB = currentTeams.groupB.map(createInitialStanding);
     const newStandings = {
         groupA: sortStandingsDisplay(initialGroupA),
         groupB: sortStandingsDisplay(initialGroupB),
     };
     setStandings(newStandings);
     localStorage.setItem('courtSideStandings', JSON.stringify(newStandings));
   };


  // --- Save data to localStorage whenever it changes ---
  useEffect(() => {
    if (!isLoading) { // Only save after initial load
        console.log("AppContext: Saving teams to localStorage...");
        localStorage.setItem('courtSideTeams', JSON.stringify(teams));
    }
  }, [teams, isLoading]);

  useEffect(() => {
     if (!isLoading) {
        console.log("AppContext: Saving live match to localStorage...");
        localStorage.setItem('courtSideLiveMatch', JSON.stringify(liveMatch));
     }
  }, [liveMatch, isLoading]);

  useEffect(() => {
    if (!isLoading) {
        console.log("AppContext: Saving standings to localStorage...");
        localStorage.setItem('courtSideStandings', JSON.stringify(standings));
    }
  }, [standings, isLoading]);

  // --- Action Functions ---

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

  const addTeam = useCallback((group: 'groupA' | 'groupB', teamName: string) => {
    setTeams(prev => {
        const newTeams = { ...prev };
        if (!newTeams[group].includes(teamName)) {
             newTeams[group] = [...newTeams[group], teamName];

             // Add initial standing for the new team
             setStandings(prevStandings => {
                 if (!prevStandings) return null; // Should not happen if initialized
                 const newTeamStanding = createInitialStanding(teamName);
                 const updatedGroupStandings = [...prevStandings[group], newTeamStanding];
                 const sortedGroupStandings = sortStandingsDisplay(updatedGroupStandings); // Sort after adding

                 const newStandingsState = {
                    ...prevStandings,
                    [group]: sortedGroupStandings
                 };
                 console.log(`AppContext: Added team ${teamName} to ${group} and updated standings.`);
                 return newStandingsState;
             });

             return newTeams;
        } else {
            console.warn(`AppContext: Team "${teamName}" already exists in ${group}.`);
            // Optionally throw an error or show a notification
             throw new Error(`Team "${teamName}" already exists in ${group}.`);
             // return prev; // No change if team exists
        }

    });
  }, []);

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
     addTeam,
     updateLiveScore,
     updateTeamStanding,
   }), [teams, liveMatch, standings, isLoading, addTeam, updateLiveScore, updateTeamStanding]);


  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
