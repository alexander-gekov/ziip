const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [255 * f(0), 255 * f(8), 255 * f(4)].map(Math.round);
};

export type GameColors = ReturnType<typeof generateGameColors>;

export const generateGameColors = () => {
  const baseHue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 10 + 85);
  const baseLightness = Math.floor(Math.random() * 10 + 45);

  const startRgb = hslToRgb(baseHue, saturation, baseLightness);
  const endRgb = hslToRgb(
    (baseHue + 30) % 360,
    saturation,
    Math.max(30, baseLightness - 10)
  );

  return {
    start: `hsl(${baseHue}, ${saturation}%, ${baseLightness}%)`,
    end: `hsl(${(baseHue + 30) % 360}, ${saturation}%, ${Math.max(
      30,
      baseLightness - 10
    )}%)`,
    filledBg: `rgba(${startRgb[0]}, ${startRgb[1]}, ${startRgb[2]}, 0.2)`,
    highlightBg: `rgba(${startRgb[0]}, ${startRgb[1]}, ${startRgb[2]}, 0.4)`,
    activeBg: `rgba(${endRgb[0]}, ${endRgb[1]}, ${endRgb[2]}, 0.3)`,
    startBg: `rgba(${startRgb[0]}, ${startRgb[1]}, ${startRgb[2]}, 0.2)`,
  };
};

export const useGameColors = (colors: GameColors) => {
  return colors;
};
