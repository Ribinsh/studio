"use client";

import type { MatchData } from '@/services/google-sheets';
import { getMatchDataFromSheets } from '@/services/google-sheets';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimerIcon, TrophyIcon, LoaderIcon, UsersIcon } from 'lucide-react';
import TimeoutModal from '@/components/TimeoutModal';
import Scoreboard from '@/components/Scoreboard';
import GroupsDisplay from '@/components/GroupsDisplay';
import type { TeamStanding } from '@/lib/types';
import { calculateStandings } from '@/lib/standings';

// Define teams and groups
const TEAMS = {
  groupA: ['Kanthapuram', 'Marakkara', 'Vaalal', 'Puthankunnu'],
  groupB: ['Kizhisseri', 'Kizhakkoth', 'Kakkancheri'],
};

export default function Home() {
  const [matchData, setMatchData] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual Google Sheets URL from user config
        const googleSheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || 'YOUR_GOOGLE_SHEETS_URL_HERE';
        if (googleSheetsUrl === 'YOUR_GOOGLE_SHEETS_URL_HERE') {
           console.warn("Using mock data. Please set NEXT_PUBLIC_GOOGLE_SHEETS_URL in your .env file.");
        }
        const data = await getMatchDataFromSheets(googleSheetsUrl);
        setMatchData(data);
      } catch (err) {
        setError('Failed to fetch match data. Please check the Google Sheets URL and permissions.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // Optional: Add polling to refresh data periodically
    // const intervalId = setInterval(fetchData, 30000); // Refresh every 30 seconds
    // return () => clearInterval(intervalId);
  }, []);

  const standings = useMemo(() => calculateStandings(matchData, TEAMS), [matchData]);

  const handleTimeoutClick = () => {
    setIsTimeoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">CourtSide Chronicle</h1>
        <p className="text-muted-foreground">Volleyball Tournament Live Scores & Standings</p>
      </header>

      <div className="flex justify-center mb-6">
        <Button
          onClick={handleTimeoutClick}
          variant="destructive"
          className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform transform hover:scale-105"
        >
          <TimerIcon className="mr-2 h-5 w-5" />
          Trigger Team Timeout (30s)
        </Button>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-primary">
                <TrophyIcon className="mr-2 h-6 w-6" />
                Match Schedule & Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading Scores...</p>
                </div>
              ) : error ? (
                 <div className="text-center text-destructive p-4 border border-destructive rounded-md">
                   <p>{error}</p>
                   <p>Displaying mock data instead.</p>
                   <Scoreboard matches={getMockMatchData()} />
                 </div>
              ) : (
                <Scoreboard matches={matchData} />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
           <Card className="shadow-lg">
            <CardHeader>
               <CardTitle className="flex items-center text-2xl text-primary">
                 <UsersIcon className="mr-2 h-6 w-6" />
                 Group Standings
               </CardTitle>
            </CardHeader>
             <CardContent>
               {isLoading && !error ? ( // Show loading only if standings are not yet calculated
                 <div className="flex justify-center items-center h-40">
                   <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Calculating Standings...</p>
                  </div>
                ) : (
                  <GroupsDisplay standings={standings} />
                )}
             </CardContent>
           </Card>
         </div>
      </main>

      <TimeoutModal
        isOpen={isTimeoutModalOpen}
        onClose={() => setIsTimeoutModalOpen(false)}
      />

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CourtSide Chronicle. All rights reserved.</p>
      </footer>
    </div>
  );
}


// Helper function to provide mock data if fetching fails
function getMockMatchData(): MatchData[] {
 return [
    { matchNo: 1, time: '4:30 PM', team1: 'Kanthapuram', team1SetScore: 1, team1FinalScore: 25, team2: 'Marakkara', team2SetScore: 0, team2FinalScore: 22, breakPoints: 'Team 1: 10, Team 2: 8' },
    { matchNo: 2, time: '5:00 PM', team1: 'Vaalal', team1SetScore: 0, team1FinalScore: 18, team2: 'Puthankunnu', team2SetScore: 1, team2FinalScore: 25, breakPoints: 'N/A' },
    { matchNo: 3, time: '5:30 PM', team1: 'Kizhisseri', team1SetScore: 0, team1FinalScore: 0, team2: 'Kizhakkoth', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
    { matchNo: 4, time: '6:00 PM', team1: 'Kanthapuram', team1SetScore: 0, team1FinalScore: 0, team2: 'Vaalal', team2SetScore: 0, team2FinalScore: 0, breakPoints: 'Upcoming' },
     // Add more mock matches if needed
  ];
}
