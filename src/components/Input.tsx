import type { InputHTMLAttributes } from 'react';
import { colors } from '../constants/colors';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label 
          className="text-sm font-medium"
          style={{ color: colors.text.label }}
        >
          {label}
        </label>
      )}

      <input
        {...props}
        className={`
          rounded-md border px-3 py-2 text-sm
          focus:outline-none
          ${className}
        `}
        style={{
          ...(props.style || {}),
          borderColor: error ? colors.border.error : colors.border.default,
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = `0 0 0 2px ${colors.focus.ring}`;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = '';
          props.onBlur?.(e);
        }}
      />

      {error && (
        <span 
          className="text-xs"
          style={{ color: colors.text.error }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
