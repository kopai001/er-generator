import mixin from 'ts-mixin-extended';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaySlip } from './pay-slip.entity';
import { ColumnTopicCache } from 'src/embedded/column-topic.embedded';
import { PaySlipItemTypeEnum } from 'src/enums/pay-slip-item-type-enum';

export class PaySlipItemBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(() => ColumnTopicCache)
  topicCache: ColumnTopicCache;

  @Column({ type: 'enum', enum: PaySlipItemTypeEnum })
  type: PaySlipItemTypeEnum;

  @Column({ type: 'decimal', default: 0 })
  amount: number;

  @ManyToOne(() => PaySlip, (paySlip) => paySlip.itemList, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  paySlip: PaySlip;
}

@Entity()
export class PaySlipItem extends mixin(PaySlipItemBase) {}
