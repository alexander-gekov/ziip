import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import ConfettiExplosion from "react-confetti-explosion";
import { type GameColors } from "@/hooks/useGameColors";

interface CompletionAnimationProps {
  isComplete: boolean;
  onAnimationComplete: () => void;
  colors: GameColors;
  timeElapsed: number;
  onNewGame: () => void;
}

export const CompletionAnimation: React.FC<CompletionAnimationProps> = ({
  isComplete,
  onAnimationComplete,
  colors,
  timeElapsed,
  onNewGame,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  const confettiConfig = {
    force: 0.8,
    duration: 3000,
    particleCount: 200,
    width: 1600,
    colors: ["#FF5733", "#33FF57", "#5733FF", "#FFFF33", "#33FFFF"],
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isComplete && !hasShown) {
      setIsOpen(true);
      setIsExploding(true);
      setHasShown(true);
      const timer = setTimeout(() => {
        setIsOpen(false);
        setIsExploding(false);
        onAnimationComplete();
      }, 4000);
      return () => clearTimeout(timer);
    }
    if (!isComplete) {
      setHasShown(false);
      setIsExploding(false);
    }
  }, [isComplete, onAnimationComplete, hasShown]);

  const handleClose = () => {
    setIsOpen(false);
    setIsExploding(false);
    onAnimationComplete();
  };

  if (!isOpen) return null;

  return (
    <>
      {isExploding && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <ConfettiExplosion {...confettiConfig} />
        </div>
      )}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="absolute -top-8 left-0 right-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`firework-${i}`}
                className="animate-firework"
                style={{
                  position: "relative",
                  left: `${25 + i * 15}%`,
                  marginTop: `${10 + (i % 2) * 5}%`,
                  animationDelay: `${i * 0.2}s`,
                }}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <div
                    key={`spark-${j}`}
                    className={cn(
                      "absolute w-1 h-1 rounded-full animate-spark",
                      j % 2 === 0 ? "bg-yellow-300" : "bg-orange-300"
                    )}
                    style={{
                      transform: `rotate(${j * 45}deg) translateX(15px)`,
                      animationDelay: `${j * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          <DialogHeader className="text-center sm:text-center">
            <div className="relative mb-6 mx-auto">
              <div className="text-7xl animate-bounce-slow">🎉</div>
            </div>

            <DialogTitle className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r mb-3 animate-gradient">
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
                }}>
                Amazing!
              </span>
            </DialogTitle>
            <div className="space-y-4">
              <div className="text-6xl font-bold text-gray-800 font-mono">
                {formatTime(timeElapsed)}
              </div>
              <p className="text-xl text-gray-700 font-medium">
                Puzzle Complete!
              </p>
              <p className="text-sm text-gray-500">
                You've successfully connected all the dots! 🔗
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onNewGame();
                  handleClose();
                }}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{
                  backgroundImage: `linear-gradient(to right, ${colors.start}, ${colors.end})`,
                }}>
                New Game
              </button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
