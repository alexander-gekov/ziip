import type { Level, NumberedCell } from "../utils/levelGenerator";

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

// Define color schemes outside the function to ensure they're constant
const colorSchemes = [
  {
    hueSteps: [25, 15, 5],
    saturationSteps: [85, 90, 95],
    lightnessSteps: [45, 42, 40],
    fixed: true,
    baseHue: 25,
  },
  {
    hueSteps: [0, 15, 30],
    saturationSteps: [0, 5, 10],
    lightnessSteps: [0, -5, -10],
  },
  {
    hueSteps: [60, 30, 0],
    saturationSteps: [0, 5, 10],
    lightnessSteps: [0, -5, -10],
  },
  {
    hueSteps: [240, 270, 300],
    saturationSteps: [0, 5, 10],
    lightnessSteps: [0, -5, -10],
  },
  {
    hueSteps: [120, 90, 60],
    saturationSteps: [0, 5, 10],
    lightnessSteps: [0, -5, -10],
  },
  {
    hueSteps: [30, 0, 300],
    saturationSteps: [0, 5, 10],
    lightnessSteps: [0, -5, -10],
  },
];

// Generate a deterministic hash from a string
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

export const generateGameColors = (seed?: string) => {
  // Use the seed to deterministically select a color scheme
  const hash = seed ? hashString(seed) : Math.floor(Math.random() * 1000000);
  const schemeIndex = hash % colorSchemes.length;
  const scheme = colorSchemes[schemeIndex];

  // Use the hash to generate deterministic base values
  const baseHue = scheme.fixed ? scheme.baseHue : hash % 360;
  const saturation = scheme.fixed ? 90 : 85 + (hash % 10);
  const baseLightness = scheme.fixed ? 45 : 45 + (hash % 10);

  const colors = scheme.hueSteps.map((hueStep, index) => {
    const hue = scheme.fixed
      ? scheme.baseHue + hueStep
      : (baseHue + hueStep) % 360;
    const sat = scheme.fixed
      ? scheme.saturationSteps[index]
      : Math.min(100, saturation + scheme.saturationSteps[index]);
    const light = scheme.fixed
      ? scheme.lightnessSteps[index]
      : Math.max(30, baseLightness + scheme.lightnessSteps[index]);
    return {
      hue,
      sat,
      light,
      rgb: hslToRgb(hue, sat, light),
    };
  });

  return {
    start: `hsl(${colors[0].hue}, ${colors[0].sat}%, ${colors[0].light}%)`,
    end: `hsl(${colors[2].hue}, ${colors[2].sat}%, ${colors[2].light}%)`,
    filledBg: `rgba(${colors[0].rgb[0]}, ${colors[0].rgb[1]}, ${colors[0].rgb[2]}, 0.2)`,
    highlightBg: `rgba(${colors[1].rgb[0]}, ${colors[1].rgb[1]}, ${colors[1].rgb[2]}, 0.4)`,
    activeBg: `rgba(${colors[2].rgb[0]}, ${colors[2].rgb[1]}, ${colors[2].rgb[2]}, 0.3)`,
    startBg: `rgba(${colors[0].rgb[0]}, ${colors[0].rgb[1]}, ${colors[0].rgb[2]}, 0.2)`,
  };
};

export const useGameColors = (colors: GameColors) => {
  return colors;
};

export type { Level, NumberedCell };
