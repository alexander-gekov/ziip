
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CompletionAnimationProps {
  isComplete: boolean;
  onAnimationComplete: () => void;
}

export const CompletionAnimation: React.FC<CompletionAnimationProps> = ({
  isComplete,
  onAnimationComplete
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setShowAnimation(true);
      
      // Start confetti after a short delay
      const confettiTimer = setTimeout(() => {
        setShowConfetti(true);
      }, 800);

      // Complete animation after 2 seconds
      const completeTimer = setTimeout(() => {
        onAnimationComplete();
      }, 2000);

      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isComplete, onAnimationComplete]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 animate-bounce",
                i % 5 === 0 && "bg-yellow-400",
                i % 5 === 1 && "bg-blue-400", 
                i % 5 === 2 && "bg-red-400",
                i % 5 === 3 && "bg-green-400",
                i % 5 === 4 && "bg-purple-400"
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Celebration Text */}
      <div className="text-center animate-scale-in">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-4xl font-bold text-green-600 mb-2 animate-fade-in">
          Congratulations!
        </h2>
        <p className="text-xl text-gray-700 animate-fade-in">
          Puzzle Complete!
        </p>
      </div>
    </div>
  );
};
