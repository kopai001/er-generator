import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LeaveRequest } from './leave-request.entity';

export class LeaveDayTxnBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  actionDate: Date;

  @Column({ nullable: false, default: false })
  isHalf: boolean;

  @ManyToOne(() => LeaveRequest, (leaveRequest) => leaveRequest.leaveDayTxnList)
  leaveRequest: LeaveRequest;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class LeaveDayTxn extends mixin(LeaveDayTxnBase, StampableEntity) {}
