import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

type WorkOrderStatus = 'DRAFT' | 'OPEN' | 'FILLED' | 'PARTIAL' | 'CANCELLED' | 'COMPLETED';

export class UpdateWorkOrderDto {
  @Transform(({ value }) => (value === null || value === undefined || value === '' ? undefined : Number(value)))
  @IsOptional()
  @IsNumber()
  @IsPositive()
  orgId?: number;

  @Transform(({ value }) => (value === null || value === undefined || value === '' ? undefined : Number(value)))
  @IsOptional()
  @IsNumber()
  @IsPositive()
  siteId?: number;

  @IsOptional()
  @IsEnum(['maid','driver','telecaller','carpenter'] as any)
  roleName?: 'maid' | 'driver' | 'telecaller' | 'carpenter';

  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  headcount?: number;

  @IsOptional()
  @IsDateString()
  start?: string;

  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  durationMins?: number;

  @IsOptional()
  @IsNotEmpty()
  recurringRule?: string;

  @IsOptional()
  @IsNotEmpty()
  budget?: string | number;

  // NEW
  @IsOptional()
  @IsEnum(['DRAFT','OPEN','FILLED','PARTIAL','CANCELLED','COMPLETED'] as any)
  status?: WorkOrderStatus;
}