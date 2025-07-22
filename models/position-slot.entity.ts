import mixin from 'ts-mixin-extended';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { Employee } from './employee.entity';
import { OrgUnit } from './org-unit.entity';
import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { Position } from './position.entity';
import { PositionSlotTxn } from './position-slot-txn.entity';

export class PositionSlotBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string; // หัวหน้าสำนักปลัด

  @Column({ nullable: true })
  positionNo: string; // เลขตำแหน่ง 08-1-xx-xxxx-xxx

  @Column({ nullable: true })
  code: string; // เลขตำแหน่ง xxxx-xxx

  @Column({ type: 'boolean', default: false })
  isTransfer: boolean; // ถ่ายโอนไหม

  @Column({ type: 'boolean', default: false })
  isActive: boolean; // ใช้งานไหม

  @Column({ type: 'simple-array', nullable: true })
  levelList: string[]; // ระดับตำแหน่ง

  @ManyToOne(() => Position, (position) => position.positionSlotList)
  @JoinColumn()
  position: Position;

  @OneToOne(() => Employee, (employee) => employee.positionSlot, {
    nullable: true,
  })
  @JoinColumn()
  employee: Employee | null;

  @OneToOne(() => OrgUnit, (orgUnit) => orgUnit.positionSlot)
  @JoinColumn()
  orgUnit: OrgUnit;

  @OneToMany(
    () => PositionSlotTxn,
    (positionSlotTxn) => positionSlotTxn.positionSlot,
  )
  positionSlotTxnList: PositionSlotTxn[];

  @Expose({ toPlainOnly: true })
  get displayText() {
    return this.positionNo;
  }
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class PositionSlot extends mixin(PositionSlotBase, StampableEntity) {}
