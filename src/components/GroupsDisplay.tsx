
import type React from 'react';
import type { TeamStanding, GroupStandings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Keep Card for GroupTable internal structure

interface GroupTableProps {
  title: string;
  teams: TeamStanding[];
}

// Internal component to render a single group's table
const GroupTable: React.FC<GroupTableProps> = ({ title, teams }) => (
  <Card className="mb-6 shadow-md border border-border/50"> {/* Add border for clarity in modal */}
    <CardHeader className="bg-secondary rounded-t-lg p-3"> {/* Slightly smaller padding */}
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/50">
              <TableHead className="w-[35px] text-center px-2 py-2">#</TableHead>
              <TableHead className="px-3 py-2">Team</TableHead>
              <TableHead className="text-center px-2 py-2">MP</TableHead>
              <TableHead className="text-center px-2 py-2">W</TableHead>
              <TableHead className="text-center px-2 py-2">L</TableHead>
              <TableHead className="text-center px-2 py-2 font-bold">Pts</TableHead> {/* Make header bold */}
              <TableHead className="text-center px-2 py-2">BP</TableHead> {/* Added Break Points header */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-24 text-center text-muted-foreground"> {/* Updated colspan */}
                   No standings available yet for this group.
                 </TableCell>
               </TableRow>
             ) : (
                teams.map((team, index) => (
                <TableRow key={team.name} className="hover:bg-muted/30"> {/* Slightly subtler hover */}
                    <TableCell className="font-medium text-center px-2 py-2">{index + 1}</TableCell>
                    <TableCell className="px-3 py-2">{team.name}</TableCell>
                    <TableCell className="text-center px-2 py-2">{team.matchesPlayed}</TableCell>
                    <TableCell className="text-center px-2 py-2">{team.wins}</TableCell>
                    <TableCell className="text-center px-2 py-2">{team.losses}</TableCell>
                    <TableCell className="text-center font-bold text-primary px-2 py-2">{team.points}</TableCell>
                    <TableCell className="text-center px-2 py-2">{team.breakPoints > 0 ? `+${team.breakPoints}` : team.breakPoints}</TableCell> {/* Display break points */}
                </TableRow>
                ))
             )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);


// Main component rendering both group tables
const GroupsDisplay: React.FC<{ standings: GroupStandings }> = ({ standings }) => {
  return (
    <div>
      <GroupTable title="Group A Standings" teams={standings.groupA} />
      <GroupTable title="Group B Standings" teams={standings.groupB} />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        MP: Matches Played, W: Wins, L: Losses, Pts: Points, BP: Break Points (Point Difference)
      </p>
    </div>
  );
};

export default GroupsDisplay;
