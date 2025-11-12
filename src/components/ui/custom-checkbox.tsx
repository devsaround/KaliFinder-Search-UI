import * as React from 'react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
  disabled?: boolean;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  label,
  count,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: isHovered && !disabled ? '#f9fafb' : 'transparent',
        transition: 'background-color 150ms',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '20px',
              height: '20px',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          />
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              border: checked ? '2px solid #7c3aed' : '2px solid #d1d5db',
              backgroundColor: checked ? '#7c3aed' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms',
              boxShadow: checked ? '0 2px 4px rgba(124, 58, 237, 0.2)' : 'none',
            }}
          >
            {checked && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation: 'checkmark 200ms ease-in-out',
                }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#111827',
            userSelect: 'none',
          }}
        >
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '2px 10px',
            borderRadius: '9999px',
          }}
        >
          {count}
        </span>
      )}
    </label>
  );
};
