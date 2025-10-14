import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

type RateUnit = 'HOUR' | 'DAY' | 'FIXED';
type RoleName = 'maid' | 'driver' | 'telecaller' | 'carpenter';

export class UpdateWorkerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return value;
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n)) return n.toFixed(2);
    return String(value);
  })
  @IsString()
  baseRate?: string;

  @IsOptional()
  @IsEnum(['HOUR', 'DAY', 'FIXED'] as any)
  rateUnit?: RateUnit;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsNumber()
  radiusKm?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsNumber()
  expYears?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  strikes?: number;

  // NEW: arrays
  @IsOptional()
  @IsArray()
  @IsEnum(['maid', 'driver', 'telecaller', 'carpenter'] as any, { each: true })
  skills?: RoleName[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  langs?: string[];
}