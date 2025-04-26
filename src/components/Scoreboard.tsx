import type React from 'react';
import type { MatchData } from '@/services/google-sheets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, PlayCircleIcon, CheckCircleIcon, InfoIcon } from 'lucide-react';

interface ScoreboardProps {
  matches: MatchData[];
}

const Scoreboard: React.FC<ScoreboardProps> = ({ matches }) => {
  const getStatusIcon = (match: MatchData) => {
    // Basic logic to determine status - could be refined based on actual data points
    const isLive = match.team1SetScore > 0 || match.team2SetScore > 0 || (match.team1FinalScore > 0 && match.team2FinalScore > 0 && match.team1SetScore < 2 && match.team2SetScore < 2) ; // Example: If scores exist but sets aren't final
    const isFinished = match.team1SetScore >= 2 || match.team2SetScore >= 2; // Example: Assuming best of 3 sets
    const isUpcoming = !isLive && !isFinished && match.team1FinalScore === 0 && match.team2FinalScore === 0;

    if (isLive) return <PlayCircleIcon className="h-4 w-4 text-green-500" />;
    if (isFinished) return <CheckCircleIcon className="h-4 w-4 text-primary" />;
    if (isUpcoming) return <ClockIcon className="h-4 w-4 text-muted-foreground" />;
    return <InfoIcon className="h-4 w-4 text-muted-foreground" />; // Default/Unknown
  };

   const getStatusBadge = (match: MatchData) => {
    const isLive = match.team1SetScore > 0 || match.team2SetScore > 0 || (match.team1FinalScore > 0 && match.team2FinalScore > 0 && match.team1SetScore < 2 && match.team2SetScore < 2);
    const isFinished = match.team1SetScore >= 2 || match.team2SetScore >= 2;
    const isUpcoming = !isLive && !isFinished && match.team1FinalScore === 0 && match.team2FinalScore === 0;


    if (isLive) return <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">Live</Badge>;
    if (isFinished) return <Badge variant="secondary" className="bg-green-200 text-green-800">Finished</Badge>;
    if (isUpcoming) return <Badge variant="outline">Upcoming</Badge>;
     return <Badge variant="outline">Status TBD</Badge>;
   };


  return (
    <div className="overflow-x-auto rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary hover:bg-secondary">
            <TableHead className="w-[80px] text-center">Match</TableHead>
            <TableHead className="w-[100px] text-center">Time</TableHead>
            <TableHead>Team 1</TableHead>
            <TableHead className="w-[120px] text-center">Score (Set / Final)</TableHead>
            <TableHead>Team 2</TableHead>
            <TableHead className="w-[120px] text-center">Score (Set / Final)</TableHead>
            <TableHead className="w-[100px] text-center">Status</TableHead>
            <TableHead className="w-[150px] text-center">Break Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No match data available yet.
              </TableCell>
            </TableRow>
          ) : (
            matches.map((match) => (
              <TableRow key={match.matchNo} className="hover:bg-muted/50">
                <TableCell className="font-medium text-center">{match.matchNo}</TableCell>
                <TableCell className="text-center">{match.time}</TableCell>
                <TableCell>{match.team1}</TableCell>
                <TableCell className="text-center">
                  <span className={match.team1SetScore > match.team2SetScore ? 'font-bold text-accent' : ''}>
                    {match.team1SetScore}
                  </span>
                  {' / '}
                   <span className={match.team1FinalScore > match.team2FinalScore ? 'font-bold text-primary' : ''}>
                     {match.team1FinalScore}
                   </span>
                </TableCell>
                <TableCell>{match.team2}</TableCell>
                <TableCell className="text-center">
                  <span className={match.team2SetScore > match.team1SetScore ? 'font-bold text-accent' : ''}>
                    {match.team2SetScore}
                  </span>
                   {' / '}
                   <span className={match.team2FinalScore > match.team1FinalScore ? 'font-bold text-primary' : ''}>
                    {match.team2FinalScore}
                   </span>
                </TableCell>
                 <TableCell className="text-center">
                   {getStatusBadge(match)}
                 </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">{match.breakPoints || 'N/A'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default Scoreboard;
