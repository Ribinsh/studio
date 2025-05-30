
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LiveMatchScoreData, TeamStanding, GroupStandings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShieldCheck, Home } from 'lucide-react';
import Link from 'next/link'; // Import Link for Home button

// Define Match Types
const matchTypes: Exclude<LiveMatchScoreData['matchType'], '' | undefined>[] = ['Group Stage', 'Qualifier', 'Exhibition', 'Semi-Final', 'Final'];
const NONE_MATCH_TYPE_VALUE = "__NONE__"; // Use for the "None" option in Select
const AUTH_CODE = "7000"; // Authentication code

export default function AdminPage() {
  // Use context which now interacts with Hasura
  const { teams, liveMatch, standings, updateLiveScore, updateAllStandings, isLoading, error: contextError } = useContext(AppContext);
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // State for local editing
  const [liveScoreData, setLiveScoreData] = useState<Partial<LiveMatchScoreData>>(liveMatch || {
    team1: '', team1SetScore: 0, team1CurrentPoints: 0,
    team2: '', team2SetScore: 0, team2CurrentPoints: 0,
    status: 'Live',
    matchType: '',
  });
  const [editingStandings, setEditingStandings] = useState<GroupStandings | null>(null);
  const [isSaving, setIsSaving] = useState(false); // State for saving indicators

  // Update local live score state when context changes (to reflect global updates)
  useEffect(() => {
     // Check if the context data is substantially different before updating local state
     // Prevents overwriting local edits if context updates while editing
     if (liveMatch && JSON.stringify(liveMatch) !== JSON.stringify(liveScoreData)) {
        setLiveScoreData({ ...liveMatch }); // Sync with context
     } else if (!liveMatch && liveScoreData && (liveScoreData.team1 || liveScoreData.team2)) {
        // If context clears the match, clear local form too
        setLiveScoreData({
            team1: '', team1SetScore: 0, team1CurrentPoints: 0,
            team2: '', team2SetScore: 0, team2CurrentPoints: 0,
            status: '',
            matchType: '',
        });
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMatch]); // Removed liveScoreData dependency to avoid loops

  // Update local standings state when context changes
  useEffect(() => {
     if (standings && !isSaving) { // Only update if not currently saving
        // Deep compare to avoid unnecessary updates/overwrites
        if (JSON.stringify(standings) !== JSON.stringify(editingStandings)) {
            setEditingStandings(JSON.parse(JSON.stringify(standings))); // Deep copy from context
        }
     } else if (!standings && editingStandings !== null && !isSaving) {
        setEditingStandings(null); // Clear if context is null
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standings, isSaving]); // Add isSaving dependency


  const handleAuthCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAuthCodeInput(e.target.value);
    setAuthError(null); // Clear error on input change
  };

  const handleAuthenticate = () => {
    if (authCodeInput === AUTH_CODE) {
      setIsAuthenticated(true);
      setAuthError(null);
      toast({ title: "Authentication Successful", description: "Welcome to the Admin Panel." });
    } else {
      setAuthError("Incorrect authentication code.");
      toast({ title: "Authentication Failed", description: "Incorrect code entered.", variant: "destructive" });
    }
  };

  const handleLiveScoreChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLiveScoreData(prev => ({
      ...prev,
      [name]: name.includes('Score') || name.includes('Points') ? parseInt(value, 10) || 0 : value,
    }));
  };

   const handleLiveScoreSelectChange = (name: keyof LiveMatchScoreData, value: string) => {
     // Prevent selecting the placeholder value
     if (value === NONE_MATCH_TYPE_VALUE) return;
     setLiveScoreData(prev => ({
       ...prev,
       [name]: value,
     }));
   };

   const handleMatchTypeChange = (value: string) => {
     const actualValue = value === NONE_MATCH_TYPE_VALUE ? '' : value;
     setLiveScoreData(prev => ({
       ...prev,
       matchType: actualValue as LiveMatchScoreData['matchType'],
     }));
   };

  const handleUpdateLiveScore = async (e: FormEvent) => {
    e.preventDefault();
    if (!liveScoreData.team1 || !liveScoreData.team2) {
        toast({ title: "Error", description: "Both team names must be selected.", variant: "destructive" });
        return;
    }
     if (liveScoreData.team1 === liveScoreData.team2) {
         toast({ title: "Error", description: "Team 1 and Team 2 cannot be the same.", variant: "destructive" });
         return;
     }
    setIsSaving(true);
    try {
        await updateLiveScore(liveScoreData as LiveMatchScoreData); // Call context function (now interacts with Hasura)
        toast({ title: "Success", description: "Live score update sent." }); // Give feedback
    } catch (error: any) {
        // Context likely handles this, but catch just in case
        toast({ title: "Error", description: `Failed to send live score update: ${error.message}`, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleClearLiveScore = async () => {
     const clearedScore = {
       team1: '', team1SetScore: 0, team1CurrentPoints: 0,
       team2: '', team2SetScore: 0, team2CurrentPoints: 0,
       status: '',
       matchType: '',
     };
     setIsSaving(true);
     setLiveScoreData(clearedScore); // Update local state immediately
     try {
        await updateLiveScore(null); // Send null to trigger clear in Hasura via context
        toast({ title: "Success", description: "Live score cleared globally." });
     } catch (error: any) {
         toast({ title: "Error", description: `Failed to clear live score: ${error.message}`, variant: "destructive" });
         // Optionally revert local state if needed:
         // setLiveScoreData(liveMatch || clearedScore);
     } finally {
        setIsSaving(false);
     }
   };


  const handleStandingChange = (group: 'groupA' | 'groupB', teamIndex: number, field: keyof TeamStanding, value: string | number) => {
    setEditingStandings(prev => {
      if (!prev) return null;
      // Create a deep copy to modify
       const updatedStandings = JSON.parse(JSON.stringify(prev));
      // Ensure the value is a number for numeric fields, default to 0 if parsing fails
      const numericValue = typeof value === 'string' ? (parseInt(value, 10) || 0) : value;


      if (updatedStandings[group] && updatedStandings[group][teamIndex] && field in updatedStandings[group][teamIndex]) {
        // Type assertion needed here as TS doesn't know the exact type of 'field'
        (updatedStandings[group][teamIndex] as any)[field] = numericValue;
      } else {
          console.error(`Field ${field} or team at index ${teamIndex} in ${group} is invalid.`);
      }
      return updatedStandings;
    });
  };


  const handleUpdateAllStandings = async () => {
    if (!editingStandings) {
        toast({ title: "Error", description: "No standings data to save.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        // Pass the locally edited standings to the context function
        await updateAllStandings(editingStandings); // Context function handles Hasura update
        toast({ title: "Success", description: "Standings updated globally." });
    } catch (error: any) { // Catch potential errors from the async operation
        toast({ title: "Error", description: `Failed to update standings: ${error.message}`, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };


  const allTeams = [...teams.groupA, ...teams.groupB];

  // Authentication Modal
  if (!isAuthenticated) {
    return (
        <Dialog open={true} onOpenChange={() => { /* Prevent closing */ }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-primary" /> Admin Access Required
                    </DialogTitle>
                    <DialogDescription>
                        Please enter the authentication code to access the admin panel.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="authCode" className="text-right col-span-1">
                            Code
                        </Label>
                        <Input
                            id="authCode"
                            type="password"
                            value={authCodeInput}
                            onChange={handleAuthCodeChange}
                            className="col-span-3"
                            onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                        />
                    </div>
                    {authError && (
                        <p className="text-sm text-destructive text-center">{authError}</p>
                    )}
                </div>
                <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                     {/* Home Button */}
                     <Link href="/" className="w-full sm:w-auto">
                         <Button variant="outline" className="w-full">
                              <Home className="mr-2 h-4 w-4" /> Go to Home
                         </Button>
                     </Link>
                     {/* Authenticate Button */}
                     <Button onClick={handleAuthenticate} className="w-full sm:w-auto">Authenticate</Button>
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  }


  // Render Admin Content if authenticated
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Admin Panel</h1>

       {/* Display Context Error */}
        {contextError && (
           <Card className="mb-6 border-destructive">
             <CardHeader>
                <CardTitle className="text-destructive">Data Synchronization Error</CardTitle>
                <CardDescription className="text-destructive">Could not synchronize data with the server. Please check your connection and the console for details.</CardDescription>
             </CardHeader>
              <CardContent>
                  <pre className="text-xs text-destructive overflow-auto bg-muted p-2 rounded">{JSON.stringify(contextError, null, 2)}</pre>
              </CardContent>
           </Card>
        )}

      {/* Update Live Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Update Live Score</CardTitle>
          <CardDescription>Set the current live match details, including match type. Updates are global via Hasura.</CardDescription>
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
                         {/* Show selected value or placeholder */}
                         <SelectValue placeholder="Select Team 1" />
                      </SelectTrigger>
                      <SelectContent>
                         {/* Add a disabled placeholder item */}
                         <SelectItem value={NONE_MATCH_TYPE_VALUE} disabled>Select Team 1</SelectItem>
                         {allTeams.map(team => <SelectItem key={`t1-${team}`} value={team}>{team}</SelectItem>)}
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
                          <SelectItem value={NONE_MATCH_TYPE_VALUE} disabled>Select Team 2</SelectItem>
                          {allTeams.map(team => <SelectItem key={`t2-${team}`} value={team}>{team}</SelectItem>)}
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

             {/* Match Status & Type */}
             <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                     <Label htmlFor="status">Match Status (Optional)</Label>
                     <Input id="status" name="status" type="text" placeholder="e.g., Live, Timeout, Set Finished" value={liveScoreData.status || ''} onChange={handleLiveScoreChange} />
                 </div>
                 <div>
                     <Label htmlFor="matchTypeSelect">Match Type</Label>
                     <Select
                        name="matchType"
                        value={liveScoreData.matchType || NONE_MATCH_TYPE_VALUE} // Use NONE_MATCH_TYPE_VALUE when no type is selected
                        onValueChange={handleMatchTypeChange}
                      >
                        <SelectTrigger id="matchTypeSelect">
                            <SelectValue placeholder="Select Match Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE_MATCH_TYPE_VALUE}>
                                None (Clear Type)
                            </SelectItem>
                            {matchTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                 </div>
             </div>


            {/* Submit Button */}
            <div className="md:col-span-2 flex justify-end gap-2">
                 <Button type="button" variant="outline" onClick={handleClearLiveScore} disabled={isSaving || isLoading}>
                    {isSaving ? 'Clearing...' : 'Clear Live Score'}
                 </Button>
                 <Button type="submit" disabled={isSaving || isLoading}>
                    {isSaving ? 'Updating...' : 'Update Live Score'}
                 </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Update Standings */}
      <Card>
        <CardHeader>
          <CardTitle>Update Group Standings</CardTitle>
           <CardDescription>Manually edit the standings for each team. Save changes to update globally via Hasura.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !editingStandings ? (
            <p className="text-center text-muted-foreground py-4">Loading standings...</p>
           ) : contextError && !editingStandings ? ( // Show error if initial load failed
             <p className="text-center text-destructive py-4">Failed to load standings data.</p>
          ) : editingStandings ? (
            <>
              {(['groupA', 'groupB'] as Array<keyof GroupStandings>).map((groupKey) => (
                <div key={groupKey} className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">{groupKey === 'groupA' ? 'Group A' : 'Group B'}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">MP</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">SW</TableHead> {/* Added Sets Won */}
                        <TableHead className="text-center">SL</TableHead> {/* Added Sets Lost */}
                        <TableHead className="text-center">Pts</TableHead>
                        <TableHead className="text-center">BP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingStandings[groupKey].map((team, index) => (
                        <TableRow key={team.name}>
                          <TableCell>{team.name}</TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" min="0" value={team.matchesPlayed ?? 0} onChange={(e) => handleStandingChange(groupKey, index, 'matchesPlayed', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" min="0" value={team.wins ?? 0} onChange={(e) => handleStandingChange(groupKey, index, 'wins', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" min="0" value={team.losses ?? 0} onChange={(e) => handleStandingChange(groupKey, index, 'losses', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" min="0" value={team.setsWon ?? 0} onChange={(e) => handleStandingChange(groupKey, index, 'setsWon', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" min="0" value={team.setsLost ?? 0} onChange={(e) => handleStandingChange(groupKey, index, 'setsLost', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" value={team.points ?? 0} onChange={(e) => handleStandingChange(groupKey, index, 'points', e.target.value)} /></TableCell>
                          <TableCell><Input className="w-16 mx-auto text-center" type="number" value={team.breakPoints ?? 0} onChange={(e) => handleStandingChange(groupKey, index, 'breakPoints', e.target.value)} /></TableCell>
                        </TableRow>
                      ))}
                       {editingStandings[groupKey].length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-4">No teams in this group yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
              ))}
               <div className="flex justify-end mt-4">
                     <Button onClick={handleUpdateAllStandings} disabled={isSaving || isLoading}>
                        {isSaving ? 'Saving...' : 'Save Standings Changes'}
                    </Button>
               </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">Standings data not available or failed to load.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
