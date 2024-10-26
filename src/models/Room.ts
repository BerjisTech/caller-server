import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";
import { RoomMember } from "./RoomMember";
import { RoomMessage } from "./RoomMessage";

@Entity()
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id: string = '';

  @Column()
  name: string = '';

  @Column("text")
  description: string = '';

  @Column()
  seats: number = 2;

  @Column()
  isPrivate: boolean = false;

  @Column()
  password: string = '';

  @Column()
  isActive: boolean = true;

  @Column("text", { array: true, default: [] })
  tags: string[] = [];

  @ManyToOne(() => Profile, profile => profile.rooms)
  profile: Profile | null = null;

  @OneToMany(() => RoomMember, roomMember => roomMember.room)
  roomMembers: RoomMember[] = [];

  @OneToMany(() => RoomMessage, roomMessage => roomMessage.room)
  roomMessages: RoomMessage[] = [];

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}