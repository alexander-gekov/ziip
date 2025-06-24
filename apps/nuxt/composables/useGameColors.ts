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

export const useGameColors = (initialSeed?: string) => {
  const seed = ref(initialSeed);
  const colors = ref<GameColors>(generateGameColors(initialSeed));
  const currentSchemeIndex = ref(0);

  const regenerateColors = (newSeed?: string) => {
    seed.value = newSeed;
    colors.value = generateGameColors(newSeed);
  };

  const cycleColorScheme = () => {
    currentSchemeIndex.value =
      (currentSchemeIndex.value + 1) % colorSchemes.length;
    const scheme = colorSchemes[currentSchemeIndex.value];
    const baseHue = scheme.fixed
      ? scheme.baseHue
      : Math.floor(Math.random() * 360);
    const hash = Math.floor(Math.random() * 1000000);
    colors.value = generateGameColors(hash.toString());
  };

  const getContrastColor = (bgColor: string) => {
    if (bgColor.startsWith("hsl")) {
      const [, , lightness] = bgColor.match(/\d+/g)?.map(Number) || [];
      return Number(lightness) > 50 ? "#000000" : "#ffffff";
    }
    return "#000000";
  };

  const adjustOpacity = (color: string, opacity: number) => {
    if (color.startsWith("rgba")) {
      return color.replace(/[\d.]+\)$/, `${opacity})`);
    }
    if (color.startsWith("hsl")) {
      return color.replace("hsl", "hsla").replace(")", `, ${opacity})`);
    }
    return color;
  };

  const darken = (color: string, amount: number) => {
    if (color.startsWith("hsl")) {
      const [hue, saturation, lightness] =
        color.match(/\d+/g)?.map(Number) || [];
      return `hsl(${hue}, ${saturation}%, ${Math.max(0, lightness - amount)}%)`;
    }
    return color;
  };

  const lighten = (color: string, amount: number) => {
    if (color.startsWith("hsl")) {
      const [hue, saturation, lightness] =
        color.match(/\d+/g)?.map(Number) || [];
      return `hsl(${hue}, ${saturation}%, ${Math.min(
        100,
        lightness + amount
      )}%)`;
    }
    return color;
  };

  return {
    colors: readonly(colors),
    seed: readonly(seed),
    regenerateColors,
    cycleColorScheme,
    getContrastColor,
    adjustOpacity,
    darken,
    lighten,
  };
};
