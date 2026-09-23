function buzz(p: number | number[]) {
  try {
    navigator.vibrate?.(p);
  } catch {
    /* unsupported: silent */
  }
}
export const haptics = {
  tap: () => buzz(8),
  error: () => buzz([20, 40, 20]),
  success: () => buzz([30, 40, 30, 40, 80]),
};
