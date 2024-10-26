export interface IRoomMessageReaction {
  id: string;
  reaction: string;
  roomMessageId: string;
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
}