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
    <Card className="bg-white border-2 border-gray-200">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
        <span className="font-medium text-gray-900">How to play</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </Button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          <div className="flex items-start gap-3 mt-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div
                  className="w-6 h-6 rounded text-white text-xs flex items-center justify-center font-bold"
                  style={{ backgroundColor: colors.start }}>
                  1
                </div>
                <div
                  className="w-6 h-6 rounded text-white text-xs flex items-center justify-center font-bold"
                  style={{ backgroundColor: colors.start }}>
                  2
                </div>
                <div
                  className="w-6 h-6 rounded text-white text-xs flex items-center justify-center font-bold"
                  style={{ backgroundColor: colors.start }}>
                  3
                </div>
              </div>
              <span>Numbers to connect</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Connect the dots in order
              </h3>
              <p className="text-sm text-gray-600">
                Start from number 1 and connect to the next numbers in sequence.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8  rounded mt-1 flex items-center justify-center"
              style={{ backgroundColor: colors.start }}>
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors.end }}></div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Fill every cell</h3>
              <p className="text-sm text-gray-600">
                Your path must fill all empty cells in the grid to complete the
                puzzle.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
