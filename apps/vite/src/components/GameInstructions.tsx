import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type GameColors } from "@/hooks/useGameColors";

interface GameInstructionsProps {
  colors: GameColors;
}

export const GameInstructions: React.FC<GameInstructionsProps> = ({
  colors,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-white border border-gray-200">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50">
        <span className="font-medium text-gray-900 text-sm">How to play</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Button>

      {isExpanded && (
        <div className="px-3 pb-2 space-y-2 border-t border-gray-100">
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-0.5">
              <div
                className="w-5 h-5 rounded text-white text-xs flex items-center justify-center font-bold"
                style={{ backgroundColor: colors.start }}>
                1
              </div>
              <div
                className="w-5 h-5 rounded text-white text-xs flex items-center justify-center font-bold"
                style={{ backgroundColor: colors.start }}>
                2
              </div>
              <div
                className="w-5 h-5 rounded text-white text-xs flex items-center justify-center font-bold"
                style={{ backgroundColor: colors.start }}>
                3
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 leading-tight">
                Connect numbers in sequence, starting from 1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ backgroundColor: colors.start }}>
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors.end }}></div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 leading-tight">
                Fill all empty cells to complete the puzzle
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
