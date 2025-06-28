export interface UserJourney {
  id: string;
  title: string;
  description?: string;
  order: number;
  userSteps: UserStep[];
}

export interface UserStep {
  id: string;
  title: string;
  description?: string;
  journeyId: string;
  order: number;
  assignedIssues: string[]; // Issue IDs
}
