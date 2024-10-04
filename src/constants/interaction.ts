export enum InteractionStatus {
  NEW = 10,
  // Scheduling
  SCHEDULED = 20,
  RESCHEDULED = 22,
  // Interaction
  WAITING = 30, // offline only
  ON_HANDLING = 35, // offline only
  HANDLING_DONE = 39,
  // End
  CANCELED = 90,
  COMPLETED = 99,
}
