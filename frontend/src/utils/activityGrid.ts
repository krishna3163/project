/**
 * Shared utility for generating correct activity grid dates to prevent off-by-one errors.
 */
export function generateActivityGridDates(totalDays: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize today to midnight
  const dates: Date[] = [];
  
  for (let i = 0; i < totalDays; i++) {
    const current = new Date(today);
    current.setDate(today.getDate() - totalDays + 1 + i);
    dates.push(current);
  }
  
  return dates;
}
