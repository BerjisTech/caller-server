export interface IProfile {
  id: string;
  userId: string;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isSuperuser: boolean;
  isStaff: boolean;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}