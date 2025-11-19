export function calculatePointsForTap(currentTaps: number): number {
  const newTapNumber = currentTaps + 1;

  if (newTapNumber % 11 === 0) {
    return 10;
  }

  return 1;
}
