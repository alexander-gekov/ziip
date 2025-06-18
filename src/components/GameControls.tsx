
import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo, Lightbulb } from 'lucide-react';

interface GameControlsProps {
  onUndo: () => void;
  onHint: () => void;
  onClear: () => void;
  canUndo: boolean;
  isComplete: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onUndo,
  onHint,
  onClear,
  canUndo,
  isComplete
}) => {
  return (
    <div className="flex gap-3 justify-center">
      <Button
        variant="outline"
        onClick={onUndo}
        disabled={!canUndo || isComplete}
        className="flex items-center gap-2 px-6 py-2 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-50"
      >
        <Undo size={16} />
        Undo
      </Button>
      
      <Button
        variant="outline"
        onClick={onHint}
        disabled={isComplete}
        className="flex items-center gap-2 px-6 py-2 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 disabled:opacity-50"
      >
        <Lightbulb size={16} />
        Hint
      </Button>
    </div>
  );
};
