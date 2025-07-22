import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { IsString } from 'class-validator';
import { FaceScanRequestStatusEnum } from 'src/enums/face-scan-request-status.enum';
import mixin from 'ts-mixin-extended';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { TimeAttendanceBase } from './time-attendance.entity';

export class FaceScanRequestBase extends TimeAttendanceBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: FaceScanRequestStatusEnum,
    default: FaceScanRequestStatusEnum.REQUEST,
  })
  status: FaceScanRequestStatusEnum;

  @Column({ nullable: false })
  @IsString()
  remark: string;

  @ManyToOne(() => Employee, (employee) => employee.faceScanRequestList)
  employee: Employee;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class FaceScanRequest extends mixin(
  FaceScanRequestBase,
  StampableEntity,
) {}
