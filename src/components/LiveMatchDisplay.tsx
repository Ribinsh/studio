
import type React from 'react';
import type { LiveMatchScoreData } from '@/services/google-sheets'; // Use the new interface
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TvIcon, HourglassIcon } from 'lucide-react'; // Using TvIcon or HourglassIcon

interface LiveMatchDisplayProps {
  liveMatch: LiveMatchScoreData | null | undefined;
}

const LiveMatchDisplay: React.FC<LiveMatchDisplayProps> = ({ liveMatch }) => {
  if (!liveMatch) {
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
    team1CurrentPoints = 0, // Use current points field
    team2CurrentPoints = 0, // Use current points field
    status, // Optional status display
  } = liveMatch;

  // Determine leading team for potential styling based on current points and sets
  const team1LeadsPoints = team1CurrentPoints > team2CurrentPoints;
  const team2LeadsPoints = team2CurrentPoints > team1CurrentPoints;
  const team1LeadsSets = team1SetScore > team2SetScore;
  const team2LeadsSets = team2SetScore > team1SetScore;

  return (
    <div className="flex flex-col items-center justify-center text-center">

       {/* Optional: Display Status */}
       {status && status.toLowerCase() !== 'live' && (
            <p className="text-xl font-semibold text-accent mb-4 animate-pulse">{status}</p>
        )}

      {/* Team Names */}
      <div className="grid grid-cols-2 gap-4 w-full mb-6">
        <h2 className={`text-3xl md:text-4xl font-bold truncate ${team1LeadsSets ? 'text-primary' : 'text-foreground'}`}>
          {team1 || 'Team A'}
        </h2>
        <h2 className={`text-3xl md:text-4xl font-bold truncate ${team2LeadsSets ? 'text-primary' : 'text-foreground'}`}>
          {team2 || 'Team B'}
        </h2>
      </div>

      {/* Set Scores */}
      <div className="text-lg text-muted-foreground mb-2">Set Score</div>
      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <div className={`text-6xl md:text-8xl font-bold ${team1LeadsSets ? 'text-accent' : 'text-foreground'}`}>
          {team1SetScore}
        </div>
        <div className={`text-6xl md:text-8xl font-bold ${team2LeadsSets ? 'text-accent' : 'text-foreground'}`}>
          {team2SetScore}
        </div>
      </div>

      <Separator className="my-4 w-3/4" />

      {/* Current Set Points */}
      <div className="text-lg text-muted-foreground mb-2">Current Points</div>
      <div className="grid grid-cols-2 gap-4 w-full">
         <div className={`text-5xl md:text-7xl font-bold ${team1LeadsPoints ? 'text-primary' : 'text-foreground/80'}`}>
          {team1CurrentPoints}
        </div>
         <div className={`text-5xl md:text-7xl font-bold ${team2LeadsPoints ? 'text-primary' : 'text-foreground/80'}`}>
          {team2CurrentPoints}
        </div>
      </div>
    </div>
  );
};

export default LiveMatchDisplay;
