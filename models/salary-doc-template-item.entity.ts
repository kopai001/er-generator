import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SalaryDocTemplate } from './salary-doc-template.entity';
import { ColumnTopic } from './column-topic.entity';
import { IsString } from 'class-validator';

export class SalaryDocTemplateItemBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  columnName: string; // ชื่อ index ของคอลัมน์ A, B, ... AA, AB

  @ManyToOne(
    () => SalaryDocTemplate,
    (salaryDocTemplate) => salaryDocTemplate.itemList,
    {
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  salaryDocTemplate: SalaryDocTemplate;

  @ManyToOne(() => ColumnTopic)
  columnTopic: ColumnTopic;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class SalaryDocTemplateItem extends mixin(
  SalaryDocTemplateItemBase,
  StampableEntity,
) {}
