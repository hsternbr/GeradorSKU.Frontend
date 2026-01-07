import { buttonColors } from '../constants/colors';

// Tipo das cores permitidas
export type ButtonColor = keyof typeof buttonColors;

// Mapa tipado
const colorMap: Record<ButtonColor, string> = {
  green: buttonColors.green,
  red: buttonColors.red,
  yellow: buttonColors.yellow,
  blue: buttonColors.blue,
  primary: buttonColors.primary,
};

// Função de estilo
export const getButtonStyle = (color: ButtonColor = 'primary') => {
  const backgroundColor = colorMap[color];

  const textColor = color === 'primary' ? '#FFFFFF' : '#000000';

  return {
    backgroundColor,
    borderColor: backgroundColor,
    color: textColor,
    fontFamily: "'Source Sans Pro', sans-serif",
    fontWeight: 700,
  };
};
