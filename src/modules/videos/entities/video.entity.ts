// TODO (Dev C): define Video entity/interface once models are added to Prisma schema
export interface VideoEntity {
  id: string;
  roomId: string;
  url: string;
  title: string;
  addedById: string;
  createdAt: Date;
}
