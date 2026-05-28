/** @type {const} */
const themeColors = {
  // Matte black background — dominant across all screens
  primary:    { light: '#8B6914', dark: '#C9922A' },   // Matte bronze — primary actions, active states, MARCUS wordmark
  background: { light: '#0A0A0A', dark: '#0A0A0A' },   // Matte black
  surface:    { light: '#1A1A1A', dark: '#1A1A1A' },   // Elevated cards and panels
  foreground: { light: '#F0EDE8', dark: '#F0EDE8' },   // Primary text — warm white
  muted:      { light: '#7A7A7A', dark: '#9E9E9E' },   // Matte silver — secondary text and icons
  border:     { light: '#2A2A2A', dark: '#2A2A2A' },   // Subtle dividers
  tint:       { light: '#C9922A', dark: '#C9922A' },   // Tab bar active tint (bronze)
  success:    { light: '#2E7D32', dark: '#4CAF50' },
  warning:    { light: '#E65100', dark: '#FF9800' },
  error:      { light: '#B71C1C', dark: '#EF5350' },
};

module.exports = { themeColors };
