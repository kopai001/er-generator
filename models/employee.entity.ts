import { User } from '@bmk/nest-lib/bmk-auth';
import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import {
  FileEntry,
  FileEntryColumn,
  WithFileLinkable,
} from '@bmk/nest-lib/bmk-file';
import { SetMetadata } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { EMPLOYEE_RULE_NAME } from 'src/services/ruler/ruler';
import mixin from 'ts-mixin-extended';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Checkpoint } from './checkpoint.entity';
import { DHrUser } from './d-hr-user.entity';
import { EmployeeAlias } from './employee-alias.entity';
import { EmployeeShift } from './employee-shift.entity';
import { LeaveRequest } from './leave-request.entity';
import { PaySlip } from './pay-slip.entity';
import { PositionSlot } from './position-slot.entity';
import { TimeAttendance } from './time-attendance.entity';
import { FaceScanRequest } from './face-scan-request.entity';
import { EmployeeCheckpoint } from './employee-checkpoint.entity';

export class EmployeeBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  title: string; // คำนำหน้า

  @Column()
  @IsString()
  firstname: string;

  @Column()
  @IsString()
  lastname: string;

  @Column()
  @IsString()
  nationalId: string; // หมายเลขบัตรประชาชน

  @Column()
  @IsString()
  accountNumber: string; // หมายเลขบัญชี

  @Column()
  @IsString()
  rawType: string; // ประเภทพนักงาน

  @Column({ nullable: true })
  level: string; // ระดับตำแหน่ง

  @Column({ nullable: true })
  educationLevel: string; // คุณวุฒิการศึกษา

  @Column({ nullable: true })
  salaryAmount: number; // เงินเดือน

  @Column({ nullable: true })
  positionAllowanceAmount: number; // เงินประจำตำแหน่ง

  @Column({ nullable: true })
  compensationAmount: number; // เงินค่าตอบแทน

  @OneToMany(() => PaySlip, (paySlip) => paySlip.employee)
  paySlipList: PaySlip[];

  @OneToMany(() => EmployeeAlias, (employeeAlias) => employeeAlias.employee, {
    cascade: true,
  })
  aliasList: EmployeeAlias[];

  @OneToMany(
    () => FaceScanRequest,
    (faceScanRequest) => faceScanRequest.employee,
    {
      cascade: true,
    },
  )
  faceScanRequestList: FaceScanRequest[];

  @OneToMany(
    () => TimeAttendance,
    (timeAttendance) => timeAttendance.employee,
    {
      cascade: true,
    },
  )
  timeAttendanceList: TimeAttendance[];

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee, {
    cascade: true,
  })
  leaveRequestList: LeaveRequest[];

  @OneToMany(() => EmployeeShift, (employeeShift) => employeeShift.employee, {
    cascade: true,
  })
  employeeShiftList: EmployeeShift[];

  @OneToMany(
    () => EmployeeCheckpoint,
    (employeeCheckpoint) => employeeCheckpoint.employee,
  )
  employeeCheckpointList: EmployeeCheckpoint[];

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToOne(() => DHrUser, (dHrUser) => dHrUser.employee, {
    cascade: true,
  })
  @JoinColumn()
  dHrUser: DHrUser;

  @OneToOne(() => PositionSlot, (positionSlot) => positionSlot.employee, {
    nullable: true,
  })
  positionSlot: PositionSlot;

  @Expose({ toPlainOnly: true })
  get displayText() {
    return this.title + this.firstname + ' ' + this.lastname;
  }
}

@Entity()
@Reflect.metadata(WithStampable, true)
@SetMetadata(WithFileLinkable, true)
export class Employee extends mixin(EmployeeBase, StampableEntity) {
  @FileEntryColumn({ nullable: true, grantRule: EMPLOYEE_RULE_NAME })
  signatureFile: FileEntry;
}
