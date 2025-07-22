import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeCache } from 'src/embedded/employee.embedded';
import { PaySlipStatusEnum } from 'src/enums/pay-slip-status.enum';
import { PaySlipItem } from './pay-slip-item.entity';
import { PaySlipGroup } from './pay-slip-group.entity';
import { FileEntry, FileEntryColumn } from '@bmk/nest-lib/bmk-file';
import { PAY_SLIP_RULE_NAME } from 'src/services/ruler/ruler';

export class PaySlipBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roundDate: Date; // รอบเงินเดือน

  @Column()
  transferDate: Date; // วันที่ชำระเงิน

  @Column({
    type: 'enum',
    enum: PaySlipStatusEnum,
  })
  status: PaySlipStatusEnum;

  @Column({ type: 'decimal', default: 0 })
  totalIncomeAmount: number; // รวมเงินได้

  @Column({ type: 'decimal', default: 0 })
  totalDeductionAmount: number; // รวมรายการหัก

  @Column({ type: 'decimal', default: 0 })
  grantTotalAmount: number; // เงินได้สุทธิ

  @ManyToOne(() => Employee, (employee) => employee.paySlipList)
  employee: Employee;

  @Column(() => EmployeeCache)
  employeeCache: EmployeeCache;

  @Column(() => EmployeeCache)
  payer: EmployeeCache; // ผู้จ่ายเงิน

  @OneToMany(() => PaySlipItem, (item) => item.paySlip, { cascade: true })
  itemList: PaySlipItem[];

  @ManyToOne(() => PaySlipGroup, (paySlipGroup) => paySlipGroup.paySlipList, {
    onDelete: 'SET NULL',
  })
  paySlipGroup: PaySlipGroup;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class PaySlip extends mixin(PaySlipBase, StampableEntity) {
  @FileEntryColumn({ nullable: true, grantRule: PAY_SLIP_RULE_NAME })
  payerSignatureFile: FileEntry;
}
