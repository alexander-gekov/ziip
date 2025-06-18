import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface CompletionAnimationProps {
  isComplete: boolean;
  onAnimationComplete: () => void;
}

export const CompletionAnimation: React.FC<CompletionAnimationProps> = ({
  isComplete,
  onAnimationComplete,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setShowAnimation(true);
      setShowConfetti(true);

      // Add fireworks effect after a short delay
      setTimeout(() => {
        setShowFireworks(true);
      }, 500);

      const completeTimer = setTimeout(() => {
        setShowConfetti(false);
        setShowFireworks(false);
        onAnimationComplete();
      }, 4000);

      return () => {
        clearTimeout(completeTimer);
      };
    } else {
      setShowAnimation(false);
      setShowConfetti(false);
      setShowFireworks(false);
    }
  }, [isComplete, onAnimationComplete]);

  const handleClose = () => {
    setShowAnimation(false);
    setShowConfetti(false);
    setShowFireworks(false);
    onAnimationComplete();
  };

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Dark overlay with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Fireworks */}
      {showFireworks && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`firework-${i}`}
              className="absolute animate-firework"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.3}s`,
              }}>
              {Array.from({ length: 12 }).map((_, j) => (
                <div
                  key={`spark-${j}`}
                  className={cn(
                    "absolute w-1 h-1 rounded-full animate-spark",
                    j % 4 === 0 && "bg-yellow-300",
                    j % 4 === 1 && "bg-orange-300",
                    j % 4 === 2 && "bg-red-300",
                    j % 4 === 3 && "bg-white"
                  )}
                  style={{
                    transform: `rotate(${j * 30}deg) translateX(20px)`,
                    animationDelay: `${j * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Celebration Card */}
      <div className="relative z-10 text-center bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 animate-bounce-in border-4 border-orange-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 group"
          aria-label="Close celebration">
          <X size={20} className="text-gray-600 group-hover:text-gray-800" />
        </button>

        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="text-7xl animate-bounce-slow">🎉</div>
          <div className="absolute -bottom-2 -left-2 text-3xl animate-pulse">
            🎊
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-3 animate-gradient">
          Amazing!
        </h2>
        <p className="text-xl text-gray-700 mb-2 font-medium">
          Puzzle Complete!
        </p>
        <p className="text-sm text-gray-500">
          You've successfully connected all the dots! 🔗
        </p>
      </div>
    </div>
  );
};
