export const buttonColors = {
  green: '#16a34a',
  red: '#dc2626',
  yellow: '#facc15',
  blue: '#2563eb',
  primary: '#1e40af',
} as const;

// Cores para uso geral - usando apenas as cores do buttonColors
export const colors = {
  ...buttonColors,
  // Cores específicas para componentes
  border: {
    default: buttonColors.primary,
    error: buttonColors.red,
  },
  focus: {
    ring: buttonColors.blue,
  },
  text: {
    label: buttonColors.primary,
    error: buttonColors.red,
  },
  background: {
    disabled: buttonColors.primary,
  },
} as const;