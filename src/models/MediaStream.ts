import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./Profile";

@Entity()
export class MediaStream {
  @PrimaryGeneratedColumn("uuid")
  id: string = '';

  @Column("text")
  streamData: string = '';

  @ManyToOne(() => Profile, profile => profile.mediaStreams)
  profile!: Profile;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}