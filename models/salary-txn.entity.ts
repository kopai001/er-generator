import mixin from 'ts-mixin-extended';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { EmployeeCache } from 'src/embedded/employee.embedded';
import { ActionTxn } from './action-txn.entity';
import { TxnStatusEnum } from 'src/enums/txn-status.enum';

export class SalaryTxnBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  actionDate: Date;

  @Column({ nullable: true, type: 'decimal' })
  salaryAmount: number; // เงินเดือน

  @Column({ nullable: true, type: 'decimal' })
  positionAllowanceAmount: number; // เงินประจำตำแหน่ง

  @Column({ nullable: true, type: 'decimal' })
  compensationAmount: number; // เงินประจำตำแหน่ง

  @Column(() => EmployeeCache)
  employeeCache: EmployeeCache;

  @Column({ nullable: true })
  remark: string; // หมายเหตุ

  @ManyToOne(() => ActionTxn, (actionTxn) => actionTxn.positionTxnList)
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
export class SalaryTxn extends mixin(SalaryTxnBase, StampableEntity) {}
