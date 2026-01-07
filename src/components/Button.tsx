import type { ButtonHTMLAttributes } from 'react';
import { getButtonStyle, type ButtonColor } from '../utils/buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
}

export default function Button({
  color = 'primary',
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...getButtonStyle(color),
        ...style,
      }}
      className="rounded-md px-4 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
