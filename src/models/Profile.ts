import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { MediaStream } from "./MediaStream";
import { Room } from "./Room";
import { RoomMember } from "./RoomMember";
import { RoomMessage } from "./RoomMessage";
import { RoomMessageReaction } from "./RoomMessageReaction";

@Entity()
export class Profile {
  @PrimaryGeneratedColumn("uuid")
  id: string = '';

  @Column()
  userId: string = '';

  @Column()
  isAnonymous: boolean = false;

  @Column()
  isAuthenticated: boolean = false;

  @Column()
  isSuperuser: boolean = false;

  @Column()
  isStaff: boolean = false;

  @Column()
  username: string = '';

  @Column()
  email: string = '';

  @Column()
  firstName: string = '';

  @Column()
  lastName: string = '';

  @Column()
  fullName: string = '';

  @Column()
  avatar: string = '';

  @OneToMany(() => MediaStream, mediaStream => mediaStream.profile)
  mediaStreams: MediaStream[] = [];

  @OneToMany(() => Room, room => room.profile)
  rooms: Room[] = [];

  @OneToMany(() => RoomMember, roomMember => roomMember.profile)
  roomMembers: RoomMember[] = [];

  @OneToMany(() => RoomMessage, roomMessage => roomMessage.profile)
  roomMessages: RoomMessage[] = [];

  @OneToMany(() => RoomMessageReaction, roomMessageReaction => roomMessageReaction.profile)
  roomMessageReactions: RoomMessageReaction[] = [];

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}