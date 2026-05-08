import {
    IsString, IsOptional, IsEnum, IsInt, IsUUID, Min, Max, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType } from '@prisma/client';

export class CreateRoomDto {
    @IsString()
    @MinLength(2)
    title: string;

    @IsEnum(RoomType)
    @IsOptional()
    type?: RoomType = RoomType.public;

    @IsString()
    @IsOptional()
    imageUrl?: string;

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
    @Type(() => Number)
    maxUsers?: number = 5;
}
