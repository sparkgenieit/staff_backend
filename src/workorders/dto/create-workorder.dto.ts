import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

type WorkOrderStatus = 'DRAFT' | 'OPEN' | 'FILLED' | 'PARTIAL' | 'CANCELLED' | 'COMPLETED';

export class CreateWorkOrderDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  orgId!: number;

  @Transform(({ value }) => (value === null || value === undefined || value === '' ? undefined : Number(value)))
  @IsOptional()
  @IsNumber()
  @IsPositive()
  siteId?: number;

  @IsEnum(['maid','driver','telecaller','carpenter'] as any)
  roleName!: 'maid' | 'driver' | 'telecaller' | 'carpenter';

  @IsInt()
  headcount!: number;

  @IsDateString()
  start!: string;

  @IsInt()
  durationMins!: number;

  @IsOptional()
  recurringRule?: string;

  @IsNotEmpty()
  budget!: string | number;

  @IsOptional()
  @IsEnum(['DRAFT','OPEN','FILLED','PARTIAL','CANCELLED','COMPLETED'] as any)
  status?: WorkOrderStatus;
}