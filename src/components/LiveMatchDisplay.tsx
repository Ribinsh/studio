
import type React from 'react';
import type { MatchData } from '@/services/google-sheets';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TvIcon } from 'lucide-react'; // Using TvIcon as a placeholder for screen

interface LiveMatchDisplayProps {
  liveMatch: MatchData | null | undefined;
}

const LiveMatchDisplay: React.FC<LiveMatchDisplayProps> = ({ liveMatch }) => {
  if (!liveMatch) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-center text-muted-foreground">
        <TvIcon className="h-16 w-16 mb-4 text-primary opacity-50" />
        <p className="text-2xl font-semibold">No match currently live.</p>
        <p className="mt-2">Waiting for the next match to start...</p>
      </div>
    );
  }

  const {
    team1,
    team2,
    team1SetScore = 0,
    team2SetScore = 0,
    team1FinalScore = 0,
    team2FinalScore = 0,
  } = liveMatch;

  // Determine leading team for potential styling
  const team1LeadsPoints = team1FinalScore > team2FinalScore;
  const team2LeadsPoints = team2FinalScore > team1FinalScore;
  const team1LeadsSets = team1SetScore > team2SetScore;
  const team2LeadsSets = team2SetScore > team1SetScore;

  return (
    <div className="flex flex-col items-center justify-center text-center">

      {/* Team Names */}
      <div className="grid grid-cols-2 gap-4 w-full mb-6">
        <h2 className={`text-3xl md:text-4xl font-bold truncate ${team1LeadsSets || team1LeadsPoints ? 'text-primary' : 'text-foreground'}`}>
          {team1}
        </h2>
        <h2 className={`text-3xl md:text-4xl font-bold truncate ${team2LeadsSets || team2LeadsPoints ? 'text-primary' : 'text-foreground'}`}>
          {team2}
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
       <div className="text-lg text-muted-foreground mb-2">Current Set Points</div>
      <div className="grid grid-cols-2 gap-4 w-full">
         <div className={`text-5xl md:text-7xl font-bold ${team1LeadsPoints ? 'text-primary' : 'text-foreground/80'}`}>
          {team1FinalScore}
        </div>
         <div className={`text-5xl md:text-7xl font-bold ${team2LeadsPoints ? 'text-primary' : 'text-foreground/80'}`}>
          {team2FinalScore}
        </div>
      </div>

      {/* Optional: Display Break Points or other info if needed */}
      {/* <p className="mt-6 text-sm text-muted-foreground">{liveMatch.breakPoints}</p> */}
    </div>
  );
};

export default LiveMatchDisplay;
