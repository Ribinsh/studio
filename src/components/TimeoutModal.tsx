import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { TimerIcon } from 'lucide-react';

interface TimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TimeoutModal: React.FC<TimeoutModalProps> = ({ isOpen, onClose }) => {
  const DURATION = 30; // Timeout duration in seconds
  const [timeLeft, setTimeLeft] = useState(DURATION);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen) {
      setTimeLeft(DURATION); // Reset timer when opened
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer as NodeJS.Timeout);
            onClose(); // Auto-close when timer finishes
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timer) {
      clearInterval(timer); // Clear timer if modal is closed prematurely
    }

    return () => {
      if (timer) clearInterval(timer); // Cleanup timer on component unmount or re-render
    };
  }, [isOpen, onClose]);

  const progressValue = ((DURATION - timeLeft) / DURATION) * 100;

  // Only render the Dialog if isOpen is true
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card shadow-lg rounded-lg border-accent border-2">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-accent flex items-center justify-center">
            <TimerIcon className="mr-2 h-6 w-6 animate-bounce" />
            Team Timeout
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Match paused for a team timeout. Resuming in...
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center">
          <div className="text-6xl font-mono font-bold text-primary mb-4">
            {timeLeft}s
          </div>
          <Progress value={progressValue} className="w-full h-3 [&>div]:bg-accent" aria-label={`Time left: ${timeLeft} seconds`} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeoutModal;
