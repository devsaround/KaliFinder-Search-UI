import * as React from 'react';

interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value = [0, 100],
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      style,
      ...props
    },
    ref
  ) => {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState<number | null>(null);
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const getValueFromPosition = (clientX: number): number => {
      if (!trackRef.current) return min;

      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + percent * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    };

    const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(index);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (isDragging === null || disabled) return;
      e.preventDefault();

      const newValue = getValueFromPosition(e.clientX);
      const newValues = [...localValue];
      newValues[isDragging] = newValue;

      // Ensure min doesn't exceed max and vice versa
      if (isDragging === 0 && newValues[0]! > newValues[1]!) {
        newValues[0] = newValues[1]!;
      } else if (isDragging === 1 && newValues[1]! < newValues[0]!) {
        newValues[1] = newValues[0]!;
      }

      setLocalValue(newValues);
      onValueChange?.(newValues);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (isDragging !== null) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        setIsDragging(null);
      }
    };

    const getThumbPosition = (val: number): string => {
      const percent = ((val - min) / (max - min)) * 100;
      return `${percent}%`;
    };

    const rangeStart = getThumbPosition(localValue[0]!);
    const rangeEnd = getThumbPosition(localValue[1]!);

    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          touchAction: 'none',
          alignItems: 'center',
          paddingTop: '12px',
          paddingBottom: '12px',
          paddingLeft: '4px',
          paddingRight: '4px',
          userSelect: 'none',
          ...style,
        }}
        {...props}
      >
        <div
          ref={trackRef}
          style={{
            position: 'relative',
            height: '8px',
            width: '100%',
            flexGrow: 1,
            overflow: 'visible',
            borderRadius: '9999px',
            backgroundColor: '#e5e7eb',
            boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              height: '100%',
              background: 'linear-gradient(to right, #7c3aed, #8b5cf6)',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              left: rangeStart,
              right: `calc(100% - ${rangeEnd})`,
            }}
          />
        </div>
        {localValue.map((val, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              display: 'block',
              height: '28px',
              width: '28px',
              marginLeft: '-14px',
              borderRadius: '9999px',
              border: '3px solid #7c3aed',
              backgroundColor: '#ffffff',
              boxShadow:
                isDragging === index
                  ? '0 10px 15px -3px rgba(124, 58, 237, 0.4), 0 4px 6px -2px rgba(124, 58, 237, 0.3)'
                  : '0 4px 6px -1px rgba(124, 58, 237, 0.3), 0 2px 4px -1px rgba(124, 58, 237, 0.2)',
              cursor: disabled ? 'not-allowed' : isDragging === index ? 'grabbing' : 'grab',
              transform: isDragging === index ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: disabled ? 0.5 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
              left: getThumbPosition(val),
              top: '50%',
              marginTop: '-14px',
            }}
            onPointerDown={handlePointerDown(index)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={val}
            aria-disabled={disabled}
            onMouseEnter={(e) => {
              if (!disabled && isDragging !== index) {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && isDragging !== index) {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }
            }}
          />
        ))}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
