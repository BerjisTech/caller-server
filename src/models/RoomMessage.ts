import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";
import { Room } from "./Room";

@Entity()
export class RoomMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string = '';

  @Column("text")
  content: string = '';

  @Column()
  isEdited: boolean = false;

  @Column()
  isDeleted: boolean = false;

  @ManyToOne(() => Room, room => room.roomMessages)
  room: Room | null = null;

  @ManyToOne(() => Profile, profile => profile.roomMessages)
  profile: Profile | null = null;

  @Column({ nullable: true })
  replyToId: number | null = null;

  @Column({ nullable: true })
  quotedMessageId: number | null = null;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}