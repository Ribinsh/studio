import type React from 'react';
import type { MatchData } from '@/services/google-sheets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, PlayCircleIcon, CheckCircleIcon, InfoIcon } from 'lucide-react';

interface ScoreboardProps {
  matches: MatchData[];
}

const Scoreboard: React.FC<ScoreboardProps> = ({ matches }) => {

  // Determine match status based on scores and potentially breakpoint text
  const getStatusInfo = (match: MatchData): { icon: React.ReactNode; badge: React.ReactNode; isFinished: boolean } => {
    const isFinished = match.team1SetScore >= 2 || match.team2SetScore >= 2; // Assuming best of 3 sets
    const hasScores = match.team1FinalScore > 0 || match.team2FinalScore > 0 || match.team1SetScore > 0 || match.team2SetScore > 0;
    const isLive = hasScores && !isFinished; // If there are scores but match not finished
    const isUpcoming = !hasScores && !isFinished; // No scores yet

    if (isLive || match.breakPoints?.toLowerCase() === 'live') {
        return {
            icon: <PlayCircleIcon className="h-4 w-4 text-green-500" />,
            badge: <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">Live</Badge>,
            isFinished: false,
        };
    }
    if (isFinished) {
        return {
            icon: <CheckCircleIcon className="h-4 w-4 text-primary" />,
            badge: <Badge variant="secondary" className="bg-green-200 text-green-800">Finished</Badge>,
            isFinished: true,
        };
    }
     if (isUpcoming || match.breakPoints?.toLowerCase() === 'upcoming') {
        return {
            icon: <ClockIcon className="h-4 w-4 text-muted-foreground" />,
            badge: <Badge variant="outline">Upcoming</Badge>,
            isFinished: false,
        };
    }

    // Default/Unknown status
    return {
        icon: <InfoIcon className="h-4 w-4 text-muted-foreground" />,
        badge: <Badge variant="outline">Status TBD</Badge>,
        isFinished: false, // Assume not finished if status is unknown
    };
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
            <TableHead className="w-[150px] text-center">Info</TableHead>
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
            matches.map((match) => {
              const { badge: statusBadge } = getStatusInfo(match);
              return (
                <TableRow key={match.matchNo} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-center">{match.matchNo}</TableCell>
                  <TableCell className="text-center">{match.time}</TableCell>
                  <TableCell>{match.team1}</TableCell>
                  <TableCell className="text-center">
                    <span className={match.team1SetScore > match.team2SetScore ? 'font-bold text-accent' : ''}>
                      {match.team1SetScore ?? 0} {/* Default to 0 if null/undefined */}
                    </span>
                    {' / '}
                    <span className={match.team1FinalScore > match.team2FinalScore ? 'font-bold text-primary' : ''}>
                      {match.team1FinalScore ?? 0} {/* Default to 0 */}
                    </span>
                  </TableCell>
                  <TableCell>{match.team2}</TableCell>
                  <TableCell className="text-center">
                    <span className={match.team2SetScore > match.team1SetScore ? 'font-bold text-accent' : ''}>
                      {match.team2SetScore ?? 0} {/* Default to 0 */}
                    </span>
                    {' / '}
                    <span className={match.team2FinalScore > match.team1FinalScore ? 'font-bold text-primary' : ''}>
                      {match.team2FinalScore ?? 0} {/* Default to 0 */}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {statusBadge}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{match.breakPoints || 'N/A'}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default Scoreboard;
