import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";
import { RoomMessage } from "./RoomMessage";

@Entity()
export class RoomMessageReaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  reaction!: string;

  @ManyToOne(() => RoomMessage, roomMessage => roomMessage.id)
  roomMessage!: RoomMessage | null;

  @ManyToOne(() => Profile, profile => profile.roomMessageReactions)
  profile!: Profile | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}