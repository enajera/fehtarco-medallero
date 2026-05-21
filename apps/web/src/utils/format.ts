export function formatDistance(distance?: string | null) {
  if (!distance) return '—';
  switch (distance) {
    case 'SEVENTY_METERS':
      return '70 m';
    case 'FIFTY_METERS':
      return '50 m';
    case 'THIRTY_METERS':
      return '30 m';
    case 'TEN_METERS':
      return '10 m';
    case 'FIVE_METERS':
      return '5 m';
    case 'INDOOR':
      return 'Indoor';
    default:
      return distance;
  }
}