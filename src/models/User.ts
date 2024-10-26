import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string = '';

  @Column({ unique: true })
  email: string = '';

  @Column()
  encryptedPassword: string = '';

  @Column({ nullable: true })
  resetPasswordToken: string = '';

  @Column({ nullable: true })
  resetPasswordSentAt: Date = new Date();

  @Column({ nullable: true })
  rememberCreatedAt: Date = new Date();

  @Column({ unique: true })
  jti: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
}