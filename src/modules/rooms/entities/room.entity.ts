// TODO (Dev B): define Room entity/interface once models are added to Prisma schema
export interface RoomEntity {
  id: string;
  name: string;
  hostId: string;
  createdAt: Date;
  updatedAt: Date;
}
