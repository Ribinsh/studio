import type React from 'react';
import type { TeamStanding, GroupStandings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GroupsDisplayProps {
  standings: GroupStandings;
}

const GroupTable: React.FC<{ title: string; teams: TeamStanding[] }> = ({ title, teams }) => (
  <Card className="mb-6 shadow-md">
    <CardHeader className="bg-secondary rounded-t-lg p-4">
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px] text-center">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">MP</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">L</TableHead>
              <TableHead className="text-center">SW</TableHead>
              <TableHead className="text-center">SL</TableHead>
              <TableHead className="text-center">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                   No standings available yet for this group.
                 </TableCell>
               </TableRow>
             ) : (
                teams.map((team, index) => (
                <TableRow key={team.name} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-center">{index + 1}</TableCell>
                    <TableCell>{team.name}</TableCell>
                    <TableCell className="text-center">{team.matchesPlayed}</TableCell>
                    <TableCell className="text-center">{team.wins}</TableCell>
                    <TableCell className="text-center">{team.losses}</TableCell>
                    <TableCell className="text-center">{team.setsWon}</TableCell>
                    <TableCell className="text-center">{team.setsLost}</TableCell>
                    <TableCell className="text-center font-bold text-primary">{team.points}</TableCell>
                </TableRow>
                ))
             )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);


const GroupsDisplay: React.FC<GroupsDisplayProps> = ({ standings }) => {
  return (
    <div>
      <GroupTable title="Group A Standings" teams={standings.groupA} />
      <GroupTable title="Group B Standings" teams={standings.groupB} />
      <p className="text-xs text-muted-foreground mt-4 text-center">
        MP: Matches Played, W: Wins, L: Losses, SW: Sets Won, SL: Sets Lost, Pts: Points
      </p>
    </div>
  );
};

export default GroupsDisplay;
