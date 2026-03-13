// Design System - Typography with your font families

// Font usage guide:
// - Lato: Headers, titles, emphasis
// - Nunito Sans: Body text, paragraphs (most readable)
// - Merriweather: Elegant headers, formal content
// - Roboto: UI elements, buttons, labels
// - Rubik: Modern headings, callouts

export const FONTS = {
  // Primary fonts
  lato: {
    regular: "Lato_400Regular",
    bold: "Lato_700Bold",
    black: "Lato_900Black",
  },
  nunitoSans: {
    regular: "NunitoSans_400Regular",
    semiBold: "NunitoSans_600SemiBold",
    bold: "NunitoSans_700Bold",
    extraBold: "NunitoSans_800ExtraBold",
  },
  merriweather: {
    regular: "Merriweather_400Regular",
    bold: "Merriweather_700Bold",
    black: "Merriweather_900Black",
  },
  roboto: {
    regular: "Roboto_400Regular",
    medium: "Roboto_500Medium",
    bold: "Roboto_700Bold",
  },
  rubik: {
    regular: "Rubik_400Regular",
    medium: "Rubik_500Medium",
    bold: "Rubik_700Bold",
  },
};

// Font usage by component type
export const FONT_USAGE = {
  // Main headings - Lato Bold
  heading: FONTS.lato.bold,

  // Subheadings - Rubik Medium
  subheading: FONTS.rubik.medium,

  // Body text - Nunito Sans Regular
  body: FONTS.nunitoSans.regular,

  // Button text - Roboto Medium
  button: FONTS.roboto.medium,

  // Labels & captions - Roboto Regular
  label: FONTS.roboto.regular,

  // Elegant headers - Merriweather Bold
  elegantHeading: FONTS.merriweather.bold,

  // Emphasis text - Lato Black
  emphasis: FONTS.lato.black,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
  massive: 40,
};

export const LINE_HEIGHTS = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 36,
  xxxl: 40,
  huge: 48,
  massive: 56,
};

export const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "800",
  black: "900",
};
