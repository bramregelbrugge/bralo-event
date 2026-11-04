export interface EventDoc {
  id: string;
  name: string;
  date: string;
  location: string;
  createdAt: number;
  createdBy: string;
}

export type NewEvent = Omit<EventDoc, 'id' | 'createdAt' | 'createdBy'>;
