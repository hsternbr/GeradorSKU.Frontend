import { colors } from '../constants/colors';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled,
  error,
}: SelectProps) {
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

      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`
          rounded-md border px-3 py-2 text-sm
          focus:outline-none
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
        style={{
          borderColor: error ? colors.border.error : colors.border.default,
          backgroundColor: disabled ? `${colors.background.disabled}20` : 'white',
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.boxShadow = `0 0 0 2px ${colors.focus.ring}`;
          }
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = '';
        }}
      >
        <option value="">{placeholder}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

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
