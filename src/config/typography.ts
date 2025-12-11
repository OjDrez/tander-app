/**
 * Typography Configuration
 *
 * Optimized for accessibility and readability, especially for older adults.
 * Font sizes increased by ~20% from standard recommendations.
 * Line heights increased for better readability.
 * Minimum text size is 16px (tiny) to meet accessibility standards.
 */
export default {
  sizes: {
    h1: 38, // Large Title - increased from 34
    h2: 32, // Title 1 - increased from 28
    h3: 26, // Title 2 - increased from 22
    h4: 22, // Title 3 - increased from 20
    body: 18, // Standard readable body text - increased from 17
    small: 17, // Subheadline - increased from 15
    tiny: 16, // Footnote - increased from 13 (minimum accessible size)
    button: 18, // Buttons - increased from 17
    headerLogo: 60,
    headerBody: 40,
  },

  lineHeights: {
    h1: 50, // Increased spacing for readability
    h2: 42,
    h3: 34,
    h4: 30,
    body: 28, // More breathing room
    small: 26,
    tiny: 24, // More comfortable reading
    button: 26,
    headerLogo: 66,
    headerBody: 46,
  },

  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Letter spacing for better readability
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};
