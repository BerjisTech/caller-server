export interface IRoom {
  id: string;
  name: string;
  description: string;
  seats: number;
  isPrivate: boolean;
  password: string;
  isActive: boolean;
  tags: string[];
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
}