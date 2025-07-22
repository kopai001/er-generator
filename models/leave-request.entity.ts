import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import {
  FileEntry,
  FileEntryColumn,
  WithFileLinkable,
} from '@bmk/nest-lib/bmk-file';
import { SetMetadata } from '@nestjs/common';
import { IsString } from 'class-validator';
import { LeaveStatusEnum } from 'src/enums/leave-status.enum';
import { LeaveTypeEnum } from 'src/enums/leave-type.enum';
import { LEAVE_REQUEST_RULE_NAME } from 'src/services/ruler/ruler';
import mixin from 'ts-mixin-extended';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { LeaveDayTxn } from './leave-day-txn.entity';

export class LeaveRequestBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  leaveNo: string; //เลขที่ใบลา

  @Column({ nullable: false })
  startDate: Date;

  @Column({ nullable: false })
  endDate: Date;

  @Column({
    nullable: false,
    type: 'enum',
    enum: LeaveTypeEnum,
  })
  type: LeaveTypeEnum;

  @Column({
    type: 'enum',
    enum: LeaveStatusEnum,
    default: LeaveStatusEnum.REQUEST,
  })
  status: LeaveStatusEnum;

  @Column({ nullable: true, length: 255 })
  @IsString()
  remark: string;

  @ManyToOne(() => Employee, (employee) => employee.leaveRequestList)
  employee: Employee;

  @OneToMany(() => LeaveDayTxn, (leaveDayTxn) => leaveDayTxn.leaveRequest)
  leaveDayTxnList: LeaveDayTxn[];
}

@Entity()
@Reflect.metadata(WithStampable, true)
@SetMetadata(WithFileLinkable, true)
export class LeaveRequest extends mixin(LeaveRequestBase, StampableEntity) {
  @FileEntryColumn({
    nullable: true,
    grantRule: LEAVE_REQUEST_RULE_NAME,
  })
  attachFileList: FileEntry[];
}
