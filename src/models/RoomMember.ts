import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";
import { Room } from "./Room";

@Entity()
export class RoomMember {
  @PrimaryGeneratedColumn("uuid")
  id: string = '';

  @Column()
  isAdmin: boolean = false;

  @ManyToOne(() => Room, room => room.roomMembers)
  room: Room | null = null;

  @ManyToOne(() => Profile, profile => profile.roomMembers)
  profile: Profile | null = null;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}