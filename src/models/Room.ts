import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";
import { RoomMember } from "./RoomMember";
import { RoomMessage } from "./RoomMessage";

@Entity()
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column("text")
  description!: string;

  @Column()
  seats!: number;

  @Column()
  isPrivate!: boolean;

  @Column()
  password!: string;

  @Column()
  isActive!: boolean;

  @Column("text", { array: true, default: [] })
  tags!: string[];

  @ManyToOne(() => Profile, profile => profile.rooms)
  profile!: Profile | null;

  @OneToMany(() => RoomMember, roomMember => roomMember.room)
  roomMembers!: RoomMember[];

  @OneToMany(() => RoomMessage, roomMessage => roomMessage.room)
  roomMessages!: RoomMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}