import { PhaseName, EventScope, TechnicalLevel } from '@prisma/client';

// ============================================
// MEDAL TYPES
// ============================================

export type Medal = 'GOLD' | 'SILVER' | 'BRONZE' | null;

// ============================================
// MEDAL DERIVATION LOGIC
// ============================================

/**
 * Derive medal from phase and position
 * Medals are NOT stored in DB - they are calculated at runtime
 * 
 * Rules:
 * - FINAL + position 1 → GOLD
 * - FINAL + position 2 → SILVER
 * - BRONZE_MATCH + position 1 → BRONZE (winner of bronze match)
 * - QUALIFICATION + position 1 → GOLD (winner)
 * - QUALIFICATION + position 2 → SILVER (runner-up)
 * - QUALIFICATION + position 3 → BRONZE (3rd place)
 */
export function deriveMedal(phase: PhaseName, position: number): Medal {
  if (phase === 'FINAL') {
    if (position === 1) return 'GOLD';
    if (position === 2) return 'SILVER';
    return null;
  }
  
  if (phase === 'BRONZE_MATCH') {
    // Convention: position 1 = winner of bronze match = BRONZE medal
    if (position === 1) return 'BRONZE';
    return null;
  }
  
  if (phase === 'QUALIFICATION') {
    // In QUALIFICATION: positions 1-3 also produce medals
    if (position === 1) return 'GOLD';
    if (position === 2) return 'SILVER';
    if (position === 3) return 'BRONZE';
    return null;
  }
  
  return null;
}

// ============================================
// MEDAL POINTS (WEIGHTING)
// ============================================

/**
 * Base points per medal type
 */
export function medalPoints(medal: Medal): number {
  switch (medal) {
    case 'GOLD': return 3;
    case 'SILVER': return 2;
    case 'BRONZE': return 1;
    default: return 0;
  }
}

/**
 * Multiplier based on event scope
 */
export function scopeMultiplier(scope: EventScope): number {
  switch (scope) {
    case 'NATIONAL_FEDERATION': return 1.0;
    case 'NATIONAL_INTERNATIONALIZED': return 1.1;
    case 'INTERNATIONAL_NATIONAL_TEAM': return 1.3;
    default: return 1.0;
  }
}

/**
 * Multiplier based on technical level
 * Note: REDUCED and DEVELOPMENT don't count for official club medals
 */
export function technicalMultiplier(level: TechnicalLevel): number {
  switch (level) {
    case 'WA_STANDARD': return 1.0;
    case 'INDOOR_STANDARD': return 1.0;
    case 'REDUCED': return 0.0; // Not counted in official medallero
    case 'DEVELOPMENT': return 0.0; // Not counted in official medallero
    default: return 0.0;
  }
}

/**
 * Calculate total weighted points for a medal
 */
export type Distance = 'THIRTY_METERS' | 'FIFTY_METERS' | 'SEVENTY_METERS' | 'INDOOR' | null;
export type BowTypeStr = 'RECURVE' | 'COMPOUND' | 'BAREBOW' | null;

/**
 * Multiplier by event distance — these are reasonable defaults.
 * Assumption: 70m is the reference (1.0). 50m slightly lower, 30m significantly lower, indoor lower too.
 */
export function distanceMultiplier(distance: Distance): number {
  switch (distance) {
    case 'SEVENTY_METERS': return 1.0;
    case 'FIFTY_METERS': return 0.9;
    case 'INDOOR': return 0.85;
    case 'THIRTY_METERS': return 0.6;
    default: return 0.9; // If unknown/null, treat as near-50m (conservative)
  }
}

/**
 * Multiplier by bow type. Barebow is considered non-official / lower value.
 */
export function bowTypeMultiplier(bowType: BowTypeStr): number {
  switch (bowType) {
    case 'RECURVE': return 1.0;
    case 'COMPOUND': return 1.0;
    case 'BAREBOW': return 0.5; // Barebow medals are informational / lower weight
    default: return 1.0;
  }
}

/**
 * Calculate total weighted points for a medal.
 * Now factors: base medal points * scope * technical level * distance * bowType
 * Assumptions: If distance or bowType is missing, we apply conservative defaults.
 */
export function calculateWeightedPoints(
  medal: Medal,
  scope: EventScope,
  level: TechnicalLevel,
  distance?: Distance,
  bowType?: BowTypeStr
): number {
  const basePoints = medalPoints(medal);
  const scopeMult = scopeMultiplier(scope);
  const techMult = technicalMultiplier(level);
  const distMult = distanceMultiplier(distance ?? null);
  const bowMult = bowTypeMultiplier(bowType ?? null);

  return basePoints * scopeMult * techMult * distMult * bowMult;
}

/**
 * Check if technical level qualifies for official club medallero
 */
export function isOfficialTechnicalLevel(level: TechnicalLevel): boolean {
  return level === 'WA_STANDARD' || level === 'INDOOR_STANDARD';
}
