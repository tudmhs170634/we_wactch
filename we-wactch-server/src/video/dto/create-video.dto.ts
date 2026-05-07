import { IsString, IsNumber, IsOptional, IsUrl, Min } from 'class-validator';

export class CreateVideoDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsUrl()
    videoUrl: string;

    @IsString()
    videoKey: string;       

    @IsOptional()
    @IsUrl()
    thumbnailUrl?: string;

    @IsNumber()
    @Min(0)
    duration: number;        

    @IsNumber()
    @Min(0)
    size: number;            
}
