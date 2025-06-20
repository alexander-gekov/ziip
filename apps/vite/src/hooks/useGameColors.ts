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

  // Define color scheme patterns
  const colorSchemes = [
    // Orange to Red (specific gradient)
    {
      hueSteps: [25, 15, 5], // Orange (#ea580c) to Red (#f93316)
      saturationSteps: [85, 90, 95],
      lightnessSteps: [45, 42, 40],
      fixed: true, // This indicates we want exact values, not relative to baseHue
      baseHue: 25, // Starting from orange
    },
    // Analogous (3 adjacent colors)
    {
      hueSteps: [0, 15, 30],
      saturationSteps: [0, 5, 10],
      lightnessSteps: [0, -5, -10],
    },
    // Warm transition (yellow -> orange -> red)
    {
      hueSteps: [60, 30, 0],
      saturationSteps: [0, 5, 10],
      lightnessSteps: [0, -5, -10],
    },
    // Cool transition (blue -> purple -> pink)
    {
      hueSteps: [240, 270, 300],
      saturationSteps: [0, 5, 10],
      lightnessSteps: [0, -5, -10],
    },
    // Nature transition (green -> yellow-green -> yellow)
    {
      hueSteps: [120, 90, 60],
      saturationSteps: [0, 5, 10],
      lightnessSteps: [0, -5, -10],
    },
    // Sunset transition (orange -> red -> purple)
    {
      hueSteps: [30, 0, 300],
      saturationSteps: [0, 5, 10],
      lightnessSteps: [0, -5, -10],
    },
  ];

  // Select a random color scheme
  const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

  // Generate colors based on the scheme
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
