import mixin from 'ts-mixin-extended';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsString } from 'class-validator';
import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import {
  FileEntry,
  FileEntryColumn,
  WithFileLinkable,
} from '@bmk/nest-lib/bmk-file';
import { SetMetadata } from '@nestjs/common';
import { ACTION_TXN_RULE_NAME } from 'src/services/ruler/ruler';
import { PositionTxn } from './position-txn.entity';
import { TemporaryAssignmentTxn } from './temporary-assignment-txn.entity';
import { SalaryTxn } from './salary-txn.entity';
import { PositionSlotTxn } from './position-slot-txn.entity';

export class ActionTxnBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  actionDate: Date;

  @OneToMany(() => PositionTxn, (positionTxn) => positionTxn.actionTxn)
  positionTxnList: PositionTxn[];

  @OneToMany(
    () => PositionSlotTxn,
    (positionSlotTxn) => positionSlotTxn.actionTxn,
  )
  positionSlotTxnList: PositionSlotTxn[];

  @OneToMany(
    () => TemporaryAssignmentTxn,
    (temporaryAssignmentTxn) => temporaryAssignmentTxn.actionTxn,
  )
  temporaryAssignmentTxnList: TemporaryAssignmentTxn[];

  @OneToMany(() => SalaryTxn, (salaryTxn) => salaryTxn.actionTxn)
  salaryTxnList: SalaryTxn[];

  @Column({ nullable: true })
  referenceNo: string; // หมายเลขเอกสารอ้างอิง
}

@Entity()
@Reflect.metadata(WithStampable, true)
@SetMetadata(WithFileLinkable, true)
export class ActionTxn extends mixin(ActionTxnBase, StampableEntity) {
  @FileEntryColumn({
    nullable: true,
    grantRule: ACTION_TXN_RULE_NAME,
  })
  referenceFile: FileEntry;
}
