import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";
import { Room } from "./Room";

@Entity()
export class RoomMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  content!: string;

  @Column()
  isEdited!: boolean;

  @Column()
  isDeleted!: boolean;

  @ManyToOne(() => Room, room => room.roomMessages)
  room!: Room | null;

  @ManyToOne(() => Profile, profile => profile.roomMessages)
  profile!: Profile | null;

  @Column({ nullable: true })
  replyToId!: string;

  @Column({ nullable: true })
  quotedMessageId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}