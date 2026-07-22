export function calculateFareSuggestion(
  distanceMeters: number,
  baseFare = 1500,
  perKm = 800,
): number {
  const km = distanceMeters / 1000;
  return Math.round(baseFare + km * perKm);
}
