
import type React from 'react';
import { useState, useEffect, useRef } from 'react'; // Import useState, useEffect, useRef
import type { LiveMatchScoreData } from '@/lib/types'; // Use type from lib
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TvIcon, HourglassIcon } from 'lucide-react'; // Using TvIcon or HourglassIcon
import { Badge } from "@/components/ui/badge"; // Import Badge
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface LiveMatchDisplayProps {
  liveMatch: LiveMatchScoreData | null | undefined;
}

// Helper hook to track previous value
function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}


const LiveMatchDisplay: React.FC<LiveMatchDisplayProps> = ({ liveMatch }) => {
  const [animateScore1, setAnimateScore1] = useState(false);
  const [animateScore2, setAnimateScore2] = useState(false);

  const team1CurrentPoints = liveMatch?.team1CurrentPoints ?? 0;
  const team2CurrentPoints = liveMatch?.team2CurrentPoints ?? 0;

  const prevTeam1Points = usePrevious(team1CurrentPoints);
  const prevTeam2Points = usePrevious(team2CurrentPoints);

  // Trigger animation when current points change
  useEffect(() => {
    if (prevTeam1Points !== undefined && team1CurrentPoints !== prevTeam1Points) {
      setAnimateScore1(true);
      const timer = setTimeout(() => setAnimateScore1(false), 500); // Duration of animation
      return () => clearTimeout(timer);
    }
  }, [team1CurrentPoints, prevTeam1Points]);

  useEffect(() => {
    if (prevTeam2Points !== undefined && team2CurrentPoints !== prevTeam2Points) {
      setAnimateScore2(true);
      const timer = setTimeout(() => setAnimateScore2(false), 500); // Duration of animation
      return () => clearTimeout(timer);
    }
  }, [team2CurrentPoints, prevTeam2Points]);


  if (!liveMatch || !liveMatch.team1 || !liveMatch.team2) { // Check if teams are set
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center text-muted-foreground">
        <HourglassIcon className="h-16 w-16 mb-4 text-primary opacity-50" />
        <p className="text-2xl font-semibold">No match currently live.</p>
        <p className="mt-2">Waiting for the next match to start or data to update...</p>
      </div>
    );
  }

  const {
    team1,
    team2,
    team1SetScore = 0,
    team2SetScore = 0,
    // team1CurrentPoints = 0, // Use state variable instead
    // team2CurrentPoints = 0, // Use state variable instead
    status,
    matchType, // Destructure matchType
  } = liveMatch;

  // Determine leading team for potential styling based on current points and sets
  const team1LeadsPoints = team1CurrentPoints > team2CurrentPoints;
  const team2LeadsPoints = team2CurrentPoints > team1CurrentPoints;
  const team1LeadsSets = team1SetScore > team2SetScore;
  const team2LeadsSets = team2SetScore > team1SetScore;

  return (
    <div className="flex flex-col items-center justify-center text-center">

        {/* Display Match Type */}
        {matchType && (
             <Badge variant="secondary" className="text-sm px-3 py-1 mb-3">
                {matchType}
             </Badge>
         )}

       {/* Optional: Display Status */}
       {status && status.toLowerCase() !== 'live' && status.trim() !== '' && ( // Display if status is not empty or 'live'
            <p className="text-xl font-semibold text-accent mb-4 animate-pulse">{status}</p>
        )}

      {/* Team Names */}
      <div className="grid grid-cols-2 gap-4 w-full mb-4">
        <h2 className={`text-2xl md:text-3xl font-bold truncate ${team1LeadsSets ? 'text-primary' : 'text-foreground'}`}>
          {team1}
        </h2>
        <h2 className={`text-2xl md:text-3xl font-bold truncate ${team2LeadsSets ? 'text-primary' : 'text-foreground'}`}>
          {team2}
        </h2>
      </div>

      {/* Current Set Points */}
      <div className="text-lg text-muted-foreground mb-2">Current Points</div>
      <div className="grid grid-cols-2 gap-4 w-full mb-6">
         <div className={cn(
                `text-6xl md:text-8xl font-bold transition-transform duration-300 ease-out`,
                team1LeadsPoints ? 'text-primary' : 'text-foreground/80', // Use primary color for leading team
                animateScore1 ? 'scale-125 text-accent' : 'scale-100' // Apply animation class (keep accent for animation bump)
              )}>
          {team1CurrentPoints}
        </div>
         <div className={cn(
               `text-6xl md:text-8xl font-bold transition-transform duration-300 ease-out`,
                team2LeadsPoints ? 'text-primary' : 'text-foreground/80', // Use primary color for leading team
                animateScore2 ? 'scale-125 text-accent' : 'scale-100' // Apply animation class (keep accent for animation bump)
              )}>
          {team2CurrentPoints}
        </div>
      </div>

      <Separator className="my-4 w-3/4" />

      {/* Set Scores */}
      <div className="text-base text-muted-foreground mb-1">Set Score</div>
      <div className="grid grid-cols-2 gap-4 w-full">
         {/* Reverted font size changes for set scores */}
        <div className={`text-4xl md:text-5xl font-bold ${team1LeadsSets ? 'text-accent' : 'text-foreground'}`}>
          {team1SetScore}
        </div>
        <div className={`text-4xl md:text-5xl font-bold ${team2LeadsSets ? 'text-accent' : 'text-foreground'}`}>
          {team2SetScore}
        </div>
      </div>

    </div>
  );
};

export default LiveMatchDisplay;
