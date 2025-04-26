
import type React from 'react';
import type { TeamStanding, GroupStandings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sortStandingsDisplay } from '@/lib/standings'; // Import the sorting utility

interface GroupTableProps {
  title: string;
  teams: TeamStanding[];
}

// Internal component to render a single group's table
const GroupTable: React.FC<GroupTableProps> = ({ title, teams }) => {
  // Sort teams before rendering using the utility function
  const sortedTeams = sortStandingsDisplay(teams);

  return (
    <Card className="mb-6 shadow-md border border-border/50">
      <CardHeader className="bg-secondary rounded-t-lg p-3">
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
                <TableHead className="text-center px-2 py-2 font-bold">Pts</TableHead>
                <TableHead className="text-center px-2 py-2">BP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                     No standings available yet for this group.
                   </TableCell>
                 </TableRow>
               ) : (
                  sortedTeams.map((team, index) => (
                  <TableRow key={team.name} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-center px-2 py-2">{index + 1}</TableCell>
                      <TableCell className="px-3 py-2">{team.name}</TableCell>
                      <TableCell className="text-center px-2 py-2">{team.matchesPlayed}</TableCell>
                      <TableCell className="text-center px-2 py-2">{team.wins}</TableCell>
                      <TableCell className="text-center px-2 py-2">{team.losses}</TableCell>
                      <TableCell className="text-center font-bold text-primary px-2 py-2">{team.points}</TableCell>
                      {/* Ensure breakPoints display correctly (e.g., handle null/undefined if necessary) */}
                      <TableCell className="text-center px-2 py-2">
                         {team.breakPoints > 0 ? `+${team.breakPoints}` : (team.breakPoints ?? 0)}
                       </TableCell>
                  </TableRow>
                  ))
               )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};


// Main component rendering both group tables
// Updated to handle potentially null standings
const GroupsDisplay: React.FC<{ standings: GroupStandings | null }> = ({ standings }) => {
  if (!standings) {
    // Optional: Render a placeholder or message if standings are null
    return <p className="text-center text-muted-foreground">Standings data is not available.</p>;
  }

  return (
    <div>
      {/* Pass the specific group array, default to empty array if somehow missing */}
      <GroupTable title="Group A Standings" teams={standings.groupA || []} />
      <GroupTable title="Group B Standings" teams={standings.groupB || []} />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        MP: Matches Played, W: Wins, L: Losses, Pts: Points, BP: Break Points (Point Difference)
      </p>
    </div>
  );
};

export default GroupsDisplay;
