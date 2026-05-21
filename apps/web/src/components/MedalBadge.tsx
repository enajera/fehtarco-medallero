interface MedalBadgeProps {
  type: 'gold' | 'silver' | 'bronze';
  count?: number;
}

export default function MedalBadge({ type, count }: MedalBadgeProps) {
  const emoji = type === 'gold' ? '🥇' : type === 'silver' ? '🥈' : '🥉';
  
  if (count !== undefined) {
    return (
      <span className={`medal-badge ${type}`} title={type.toUpperCase()}>
        {count}
      </span>
    );
  }

  return <span title={type.toUpperCase()}>{emoji}</span>;
}
