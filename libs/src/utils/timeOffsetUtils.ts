/**
 * Time offset utilities for scrobbling
 * Handles conversion and formatting of time offsets for past/future scrobbles
 */

// --- Constants for Time Formatting ---
export const TimeUnit = {
  DAY: 'd',
  HOUR: 'h',
  MINUTE: 'm',
} as const;

type TimeUnitValue = typeof TimeUnit[keyof typeof TimeUnit];

// --- Time Offset Limits ---
export const MAX_PAST_SECONDS = 31 * 24 * 3600; // ~1 month
export const MAX_FUTURE_SECONDS = 3600; // 1 hour

/**
 * Breaks down a total number of seconds into the largest reasonable whole unit.
 * E.g., 7200 -> { value: 2, unit: 'h' }, -90 -> { value: -2, unit: 'm' } (rounded)
 */
export function decomposeTimeOffset(seconds: number): { value: number; unit: TimeUnitValue } {
  if (seconds === 0) return { value: 0, unit: TimeUnit.MINUTE };

  const absSeconds = Math.abs(seconds);

  // Prefer days if it's a near-exact multiple (within a minute)
  if (absSeconds >= 24 * 3600 && absSeconds % (24 * 3600) < 60) {
    return { value: Math.round(seconds / (24 * 3600)), unit: TimeUnit.DAY };
  }
  // Prefer hours if it's a near-exact multiple (within a minute)
  if (absSeconds >= 3600 && absSeconds % 3600 < 60) {
    return { value: Math.round(seconds / 3600), unit: TimeUnit.HOUR };
  }
  // Default to minutes
  return { value: Math.round(seconds / 60), unit: TimeUnit.MINUTE };
}

/**
 * Formats a total number of seconds into a clean string like "+2h" or "-15m".
 */
export function formatTimeOffset(seconds: number): string {
  if (seconds === 0) return `0${TimeUnit.MINUTE}`;

  const { value, unit } = decomposeTimeOffset(seconds);

  // Handle the case where rounding results in zero
  if (value === 0) return `0${TimeUnit.MINUTE}`;

  const sign = seconds > 0 ? '+' : ''; // Negative sign is part of the value
  return `${sign}${value}${unit}`;
}

// Preset time offset values for the slider UI
export const TIME_OFFSETS: { value: number }[] = [
  { value: 3600 }, { value: 1800 }, { value: 900 },
  { value: 0 },
  { value: -900 }, { value: -1800 }, { value: -3600 },
  { value: -7200 }, { value: -21600 }, { value: -43200 },
  { value: -86400 }, { value: -172800 }, { value: -604800 },
  { value: -1296000 }, { value: -2678400 },
].sort((a, b) => b.value - a.value);
