export interface IUser {
  id: string;
  email: string;
  encryptedPassword: string;
  resetPasswordToken?: string;
  resetPasswordSentAt?: Date;
  rememberCreatedAt?: Date;
  jti: string;
  createdAt: Date;
  updatedAt: Date;
}