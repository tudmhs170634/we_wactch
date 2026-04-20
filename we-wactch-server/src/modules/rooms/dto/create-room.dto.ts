import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
