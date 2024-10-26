export interface IRoomMember {
  id: string;
  isAdmin: boolean;
  roomId: string;
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
}