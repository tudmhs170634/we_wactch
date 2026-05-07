import {
    IsString, IsOptional, IsEnum, IsInt, IsUUID, Min, Max, MinLength,
} from 'class-validator';
import { RoomType } from '@prisma/client';

export class CreateRoomDto {
    @IsString()
    @MinLength(2)
    title: string;

    @IsEnum(RoomType)
    @IsOptional()
    type?: RoomType = RoomType.public;

    @IsUUID()
    @IsOptional()
    videoId?: string;

    @IsString()
    @IsOptional()
    password?: string;

    @IsInt()
    @Min(2)
    @Max(50)
    @IsOptional()
    maxUsers?: number = 5;
}
