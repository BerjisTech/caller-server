export interface IRoomMessage {
  id: string;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  roomId: string;
  profileId: string;
  replyToId?: number;
  quotedMessageId?: number;
  createdAt: Date;
  updatedAt: Date;
}