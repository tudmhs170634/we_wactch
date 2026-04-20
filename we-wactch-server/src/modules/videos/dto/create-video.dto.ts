import { IsString, IsUrl, MinLength, IsUUID } from 'class-validator';

export class CreateVideoDto {
  @IsUrl()
  url!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsUUID()
  roomId!: string;
}
