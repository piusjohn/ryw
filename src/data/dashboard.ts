// Phase 1 fixtures. No network or persistence is required to render the app.
export const dashboard = {
  dailyPages: 12, dailyTarget: 20, streak: 7, weeklyPages: 124, finishedBooks: 3,
  book: { title: 'Atomic Habits', author: 'James Clear', page: 84, totalPages: 320 },
  week: [true, true, true, true, true, true, false],
} as const;
