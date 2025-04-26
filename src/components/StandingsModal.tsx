
import type React from 'react';
import type { GroupStandings } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import GroupsDisplay from '@/components/GroupsDisplay';
import { LoaderIcon, UsersIcon } from 'lucide-react';

interface StandingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  standings: GroupStandings;
  isLoading: boolean;
}

const StandingsModal: React.FC<StandingsModalProps> = ({ isOpen, onClose, standings, isLoading }) => {
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
          <DialogDescription className="text-muted-foreground mt-1">
            Current tournament standings based on completed matches.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-150px)]"> {/* Adjust height based on header/footer */}
          <div className="py-6 px-2 md:px-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Calculating Standings...</p>
              </div>
            ) : (
              <GroupsDisplay standings={standings} />
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
