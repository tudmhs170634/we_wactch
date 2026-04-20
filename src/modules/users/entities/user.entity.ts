// TODO (Dev A): define User entity/interface once models are added to Prisma schema
export interface UserEntity {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}
