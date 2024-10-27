import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";
import { Room } from "./Room";

@Entity()
export class RoomMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  isAdmin!: boolean;

  @ManyToOne(() => Room, room => room.roomMembers)
  room!: Room | null;

  @ManyToOne(() => Profile, profile => profile.roomMembers)
  profile!: Profile | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}