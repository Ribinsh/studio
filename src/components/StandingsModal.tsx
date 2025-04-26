
import type React from 'react';
import type { GroupStandings } from '@/lib/types'; // Keep this type
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import GroupsDisplay from '@/components/GroupsDisplay';
import { LoaderIcon, UsersIcon, AlertCircleIcon } from 'lucide-react'; // Import AlertCircleIcon

interface StandingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  standings: GroupStandings | null; // Allow standings to be null initially or on error
  isLoading: boolean;
  error: string | null; // Pass error state
}

const StandingsModal: React.FC<StandingsModalProps> = ({ isOpen, onClose, standings, isLoading, error }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] bg-card shadow-lg rounded-lg max-h-[85vh]">
        <DialogHeader className="text-center pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-center">
            <UsersIcon className="mr-2 h-6 w-6" />
            Group Standings
          </DialogTitle>
           {/* Show description based on state */}
           {isLoading && (
              <DialogDescription className="text-muted-foreground mt-1">Loading latest standings...</DialogDescription>
           )}
           {error && (
               <DialogDescription className="text-destructive mt-1">Could not load standings. Showing last known or mock data.</DialogDescription>
           )}
           {!isLoading && !error && standings && (
              <DialogDescription className="text-muted-foreground mt-1">
                Current tournament standings based on available data.
              </DialogDescription>
           )}
           {!isLoading && !error && !standings && (
                <DialogDescription className="text-muted-foreground mt-1">Standings data is currently unavailable.</DialogDescription>
           )}
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-150px)]"> {/* Adjust height based on header/footer */}
          <div className="py-6 px-2 md:px-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading Standings...</p>
              </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-destructive p-4 border border-destructive rounded-md">
                    <AlertCircleIcon className="h-10 w-10 mb-3" />
                    <p className="text-base font-semibold">{error}</p>
                    {/* Conditionally render GroupsDisplay if standings has fallback mock data */}
                    {standings ? (
                        <>
                        <p className="text-xs mt-1">Displaying potentially outdated or mock data.</p>
                        <GroupsDisplay standings={standings} />
                        </>
                    ) : (
                        <p className="text-sm mt-1">Standings data could not be displayed.</p>
                    )}
                </div>
            ) : standings ? (
                <GroupsDisplay standings={standings} />
            ) : (
                 // Case where not loading, no error, but standings are null/empty
                 <div className="flex justify-center items-center h-40">
                    <p className="text-muted-foreground">Standings data not available.</p>
                 </div>
             )}
          </div>
        </ScrollArea>
         {/* Optional Footer for legend or close button */}
         {/* <DialogFooter className="p-4 border-t">
           <Button variant="outline" onClick={onClose}>Close</Button>
         </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};

export default StandingsModal;
