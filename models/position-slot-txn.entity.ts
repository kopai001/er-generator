import mixin from 'ts-mixin-extended';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { PositionSlot } from './position-slot.entity';
import { PositionSlotHistoryTypeEnum } from 'src/enums/position-slot-history-type.enum';
import { ActionTxn } from './action-txn.entity';
import { PositionSlotCache } from 'src/embedded/position-slot.embedded';

export class PositionSlotTxnBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  actionDate: Date;

  @Column({
    type: 'enum',
    enum: PositionSlotHistoryTypeEnum,
    default: PositionSlotHistoryTypeEnum.CREATE,
  })
  type: PositionSlotHistoryTypeEnum;

  @ManyToOne(
    () => PositionSlot,
    (positionSlot) => positionSlot.positionSlotTxnList,
  )
  @JoinColumn()
  positionSlot: PositionSlot;

  @Column({ nullable: true })
  remark: string; // หมายเหตุ

  @ManyToOne(() => ActionTxn, (actionTxn) => actionTxn.positionSlotTxnList)
  actionTxn: ActionTxn;

  @Column(() => PositionSlotCache)
  positionSlotCache: PositionSlotCache;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class PositionSlotTxn extends mixin(
  PositionSlotTxnBase,
  StampableEntity,
) {}
