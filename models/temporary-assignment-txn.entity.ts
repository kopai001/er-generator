import mixin from 'ts-mixin-extended';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { TemporaryAssignmentTypeEnum } from 'src/enums/temporary-assignment-type.enum';
import { PositionCache } from 'src/embedded/position.embedded';
import { OrgUnitCache } from 'src/embedded/org-unit.embedded copy';
import { ActionTxn } from './action-txn.entity';
import { EmployeeCache } from 'src/embedded/employee.embedded';
import { TxnStatusEnum } from 'src/enums/txn-status.enum';

export class TemporaryAssignmentTxnBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  actionDate: Date;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true, type: 'enum', enum: TemporaryAssignmentTypeEnum })
  type: TemporaryAssignmentTypeEnum;

  @Column(() => EmployeeCache)
  employeeCache: EmployeeCache;

  @Column(() => PositionCache)
  positionCache: PositionCache | null;

  @Column(() => OrgUnitCache)
  orgUnitCache: OrgUnitCache;

  @Column({ nullable: true })
  remark: string; // หมายเหตุ

  @ManyToOne(
    () => ActionTxn,
    (actionTxn) => actionTxn.temporaryAssignmentTxnList,
  )
  actionTxn: ActionTxn;

  @Column({
    type: 'enum',
    enum: TxnStatusEnum,
    default: TxnStatusEnum.WAITING_APPROVE,
  })
  status: TxnStatusEnum;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class TemporaryAssignmentTxn extends mixin(
  TemporaryAssignmentTxnBase,
  StampableEntity,
) {}
