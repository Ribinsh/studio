
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import React, { useContext, useState, useEffect } from 'react'; // Added useEffect
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LiveMatchScoreData, TeamStanding, GroupStandings } from '@/lib/types'; // Import GroupStandings
import { useToast } from '@/hooks/use-toast';
// Removed Separator import as it's no longer needed

export default function AdminPage() {
  // Removed addTeam from context destructuring
  const { teams, liveMatch, standings, updateLiveScore, updateTeamStanding, isLoading } = useContext(AppContext);
  const { toast } = useToast();

  // State for forms - Removed states related to adding teams
  const [liveScoreData, setLiveScoreData] = useState<Partial<LiveMatchScoreData>>(liveMatch || {
    team1: '', team1SetScore: 0, team1CurrentPoints: 0,
    team2: '', team2SetScore: 0, team2CurrentPoints: 0,
    status: 'Live',
  });
  // Initialize editingStandings with a deep copy or null
   const [editingStandings, setEditingStandings] = useState<GroupStandings | null>(null);

  // Update local live score state when context changes (e.g., initial load)
  useEffect(() => {
    // Only update if liveMatch from context is different to avoid unnecessary updates
    if (JSON.stringify(liveMatch) !== JSON.stringify(liveScoreData)) {
        setLiveScoreData(liveMatch || {
          team1: '', team1SetScore: 0, team1CurrentPoints: 0,
          team2: '', team2SetScore: 0, team2CurrentPoints: 0,
          status: 'Live',
        });
    }
  }, [liveMatch]); // Keep liveScoreData out of dependency array

  // Update local standings state when context changes
  useEffect(() => {
     // Deep copy standings from context only if they differ from local state or local state is null
     if (standings && JSON.stringify(standings) !== JSON.stringify(editingStandings)) {
         setEditingStandings(JSON.parse(JSON.stringify(standings)));
     } else if (!standings && editingStandings !== null) {
         // Handle case where context standings become null (e.g., reset)
         setEditingStandings(null);
     }
  }, [standings]); // Keep editingStandings out of dependency array


  // Removed handleAddTeam function

  const handleLiveScoreChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLiveScoreData(prev => ({
      ...prev,
      [name]: name.includes('Score') || name.includes('Points') ? parseInt(value, 10) || 0 : value,
    }));
  };

   const handleLiveScoreSelectChange = (name: keyof LiveMatchScoreData, value: string) => {
     setLiveScoreData(prev => ({
       ...prev,
       [name]: value,
     }));
   };

  const handleUpdateLiveScore = (e: FormEvent) => {
    e.preventDefault();
    if (!liveScoreData.team1 || !liveScoreData.team2) {
        toast({ title: "Error", description: "Both team names must be selected.", variant: "destructive" });
        return;
    }
     if (liveScoreData.team1 === liveScoreData.team2) {
         toast({ title: "Error", description: "Team 1 and Team 2 cannot be the same.", variant: "destructive" });
         return;
     }
    updateLiveScore(liveScoreData as LiveMatchScoreData); // Assume complete data
    toast({ title: "Success", description: "Live score updated." });
  };

  const handleClearLiveScore = () => {
     const clearedScore = {
       team1: '', team1SetScore: 0, team1CurrentPoints: 0,
       team2: '', team2SetScore: 0, team2CurrentPoints: 0,
       status: '',
     };
     setLiveScoreData(clearedScore);
     updateLiveScore(null); // Clear in context
     toast({ title: "Success", description: "Live score cleared." });
   };


  const handleStandingChange = (group: 'groupA' | 'groupB', teamIndex: number, field: keyof TeamStanding, value: string | number) => {
    setEditingStandings(prev => {
      if (!prev) return null;
      const updatedStandings = JSON.parse(JSON.stringify(prev)); // Deep copy
      const numericValue = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
      // Ensure the field exists before trying to assign
      if (updatedStandings[group][teamIndex] && field in updatedStandings[group][teamIndex]) {
          (updatedStandings[group][teamIndex] as any)[field] = numericValue;
      } else {
          console.error(`Field ${field} does not exist on team standing object.`);
      }
      return updatedStandings;
    });
  };

  const handleUpdateAllStandings = () => {
    if (!editingStandings) return;

    try {
        // Iterate and update each team individually using the context function
        editingStandings.groupA.forEach((team, index) => {
            const originalIndex = standings?.groupA.findIndex(t => t.name === team.name); // Find original index if order changed
            if (originalIndex !== undefined && originalIndex !== -1) {
                updateTeamStanding('groupA', originalIndex, team);
            } else {
                 console.warn(`Could not find original index for team ${team.name} in Group A during update.`);
            }
        });
        editingStandings.groupB.forEach((team, index) => {
             const originalIndex = standings?.groupB.findIndex(t => t.name === team.name);
             if (originalIndex !== undefined && originalIndex !== -1) {
                updateTeamStanding('groupB', originalIndex, team);
             } else {
                 console.warn(`Could not find original index for team ${team.name} in Group B during update.`);
             }
        });
        toast({ title: "Success", description: "All standings updated." });
    } catch (error: any) {
         toast({ title: "Error updating standings", description: error.message, variant: "destructive" });
    }
  };


  // Combine all teams for selection dropdowns
  const allTeams = [...teams.groupA, ...teams.groupB];


  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Admin Panel</h1>

       {/* Removed Add/Manage Teams Card */}

      {/* Update Live Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Update Live Score</CardTitle>
          <CardDescription>Set the current live match details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateLiveScore} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 */}
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="text-lg font-semibold">Team 1</h3>
              <div>
                <Label htmlFor="team1Select">Select Team 1</Label>
                 <Select name="team1" value={liveScoreData.team1 || ''} onValueChange={(value) => handleLiveScoreSelectChange('team1', value)}>
                      <SelectTrigger id="team1Select">
                         <SelectValue placeholder="Select Team 1" />
                      </SelectTrigger>
                      <SelectContent>
                         {allTeams.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                      </SelectContent>
                 </Select>
              </div>
              <div>
                <Label htmlFor="team1SetScore">Set Score</Label>
                <Input id="team1SetScore" name="team1SetScore" type="number" min="0" value={liveScoreData.team1SetScore ?? 0} onChange={handleLiveScoreChange} />
              </div>
              <div>
                <Label htmlFor="team1CurrentPoints">Current Points</Label>
                <Input id="team1CurrentPoints" name="team1CurrentPoints" type="number" min="0" value={liveScoreData.team1CurrentPoints ?? 0} onChange={handleLiveScoreChange} />
              </div>
            </div>

            {/* Team 2 */}
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="text-lg font-semibold">Team 2</h3>
               <div>
                 <Label htmlFor="team2Select">Select Team 2</Label>
                  <Select name="team2" value={liveScoreData.team2 || ''} onValueChange={(value) => handleLiveScoreSelectChange('team2', value)}>
                       <SelectTrigger id="team2Select">
                          <SelectValue placeholder="Select Team 2" />
                       </SelectTrigger>
                       <SelectContent>
                          {allTeams.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                       </SelectContent>
                  </Select>
               </div>
              <div>
                <Label htmlFor="team2SetScore">Set Score</Label>
                <Input id="team2SetScore" name="team2SetScore" type="number" min="0" value={liveScoreData.team2SetScore ?? 0} onChange={handleLiveScoreChange} />
              </div>
              <div>
                <Label htmlFor="team2CurrentPoints">Current Points</Label>
                <Input id="team2CurrentPoints" name="team2CurrentPoints" type="number" min="0" value={liveScoreData.team2CurrentPoints ?? 0} onChange={handleLiveScoreChange} />
              </div>
            </div>

             {/* Match Status */}
             <div className="md:col-span-2">
                 <Label htmlFor="status">Match Status (Optional)</Label>
                 <Input id="status" name="status" type="text" placeholder="e.g., Live, Timeout, Set Finished" value={liveScoreData.status || ''} onChange={handleLiveScoreChange} />
             </div>


            {/* Submit Button */}
            <div className="md:col-span-2 flex justify-end gap-2">
                 <Button type="button" variant="outline" onClick={handleClearLiveScore} disabled={isLoading}>
                    Clear Live Score
                 </Button>
                 <Button type="submit" disabled={isLoading}>Update Live Score</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Update Standings */}
      <Card>
        <CardHeader>
          <CardTitle>Update Group Standings</CardTitle>
           <CardDescription>Manually edit the standings for each team. Remember to save changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !editingStandings ? ( // Show loading only if editingStandings isn't populated yet
            <p>Loading standings...</p>
          ) : editingStandings ? (
            <>
              {(['groupA', 'groupB'] as Array<keyof GroupStandings>).map((groupKey) => ( // Type assertion for map
                <div key={groupKey} className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">{groupKey === 'groupA' ? 'Group A' : 'Group B'}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">MP</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                        <TableHead className="text-center">BP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingStandings[groupKey].map((team, index) => (
                        <TableRow key={team.name}>
                          <TableCell>{team.name}</TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" min="0" value={team.matchesPlayed} onChange={(e) => handleStandingChange(groupKey, index, 'matchesPlayed', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" min="0" value={team.wins} onChange={(e) => handleStandingChange(groupKey, index, 'wins', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" min="0" value={team.losses} onChange={(e) => handleStandingChange(groupKey, index, 'losses', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" value={team.points} onChange={(e) => handleStandingChange(groupKey, index, 'points', e.target.value)} /></TableCell>
                           {/* Make BP accept positive/negative numbers */}
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" value={team.breakPoints} onChange={(e) => handleStandingChange(groupKey, index, 'breakPoints', e.target.value)} /></TableCell>
                        </TableRow>
                      ))}
                       {editingStandings[groupKey].length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">No teams in this group yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
              ))}
               <div className="flex justify-end mt-4">
                    <Button onClick={handleUpdateAllStandings} disabled={isLoading}>Save Standings Changes</Button>
               </div>
            </>
          ) : (
            <p className="text-muted-foreground">Standings data not available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
