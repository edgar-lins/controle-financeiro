interface BrotoLogoProps {
  size?: number;
  color?: string;
  withWordmark?: boolean;
  className?: string;
}

export function BrotoLogo({ size = 22, color = '#7FE0A0', withWordmark = false, className = '' }: BrotoLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 22 V11" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 13 C7 13 4 10 4 6 C8 6 11 9 12 13 Z" fill={color} opacity="0.85"/>
        <path d="M12 11 C16.5 11 20 8 20 4 C16 4 13 6.5 12 11 Z" fill={color}/>
      </svg>
      {withWordmark && (
        <span style={{ fontWeight: 600, letterSpacing: 0.5, fontSize: size * 0.78, color: '#F1F4F0' }}>
          broto
        </span>
      )}
    </span>
  );
}
