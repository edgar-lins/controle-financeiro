interface IconProps {
  name: string;
  size?: number;
  filled?: boolean;
  color?: string;
  className?: string;
}

export function Icon({ name, size = 22, filled = false, color = 'currentColor', className = '' }: IconProps) {
  return (
    <span
      className={`msr select-none ${className}`}
      style={{
        fontSize: size,
        color,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1,
      }}
    >
      {name}
    </span>
  );
}
