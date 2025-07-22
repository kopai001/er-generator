import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SalaryDocTemplateTypeEnum } from 'src/enums/salary-doc-template-type-enum';
import { PaySlipGroupStatusEnum } from 'src/enums/pay-slip-group-status.enum';
import { PaySlip } from './pay-slip.entity';
import { IsString } from 'class-validator';

export class PaySlipGroupBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roundDate: Date; // รอบเงินเดือน

  @Column()
  transferDate: Date; // วันที่ชำระเงิน

  @Column({
    type: 'enum',
    enum: PaySlipGroupStatusEnum,
    default: PaySlipGroupStatusEnum.WAITING_REVIEW,
  })
  status: PaySlipGroupStatusEnum;

  @Column({
    type: 'enum',
    enum: SalaryDocTemplateTypeEnum,
  })
  templateType: SalaryDocTemplateTypeEnum; // เทมเพลตที่ใช้อัปโหลด

  @Column()
  uploadDateTime: Date; // วันที่อัปโหลด

  @Column()
  @IsString()
  documentName: string; // ชื่อเอกสารที่อัปโหลด

  @Column({ type: 'integer', default: 0 })
  totalSuccessRecord: number; // จำนวน record จากการอัปโหลดครั้งก่อนหน้าที่ระบุพนักงานสำเร็จ

  @Column({ type: 'integer', default: 0 })
  totalRecord: number; // จำนวน record ทั้งหมดจากการอัปโหลดครั้งก่อนหน้า

  @OneToMany(() => PaySlip, (paySlip) => paySlip.paySlipGroup)
  paySlipList: PaySlip[];
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class PaySlipGroup extends mixin(PaySlipGroupBase, StampableEntity) {}
