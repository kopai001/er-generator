import {
  AppContext,
  StampableEntity,
  WithStampable,
} from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SalaryDocTemplateTypeEnum } from 'src/enums/salary-doc-template-type-enum';
import { SalaryDocTemplateItem } from './salary-doc-template-item.entity';
import { Expose } from 'class-transformer';
import { SalaryDocTemplateService } from 'src/services/salary-doc-template.service';
import { IsEnum, IsNumber } from 'class-validator';

export class SalaryDocTemplateBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: SalaryDocTemplateTypeEnum,
    unique: true,
  })
  @IsEnum(SalaryDocTemplateTypeEnum)
  templateType: SalaryDocTemplateTypeEnum;

  @Column({ type: 'integer' })
  @IsNumber()
  startRow: number;

  @OneToMany(
    () => SalaryDocTemplateItem,
    (salaryDocTemplateItem) => salaryDocTemplateItem.salaryDocTemplate,
    {
      cascade: true,
    },
  )
  itemList: SalaryDocTemplateItem[];

  @Expose({ toPlainOnly: true })
  get displayText() {
    const salaryDocTemplateService = AppContext.ref(SalaryDocTemplateService);
    return salaryDocTemplateService.translateSalaryDocTemplateType(
      this.templateType,
    );
  }
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class SalaryDocTemplate extends mixin(
  SalaryDocTemplateBase,
  StampableEntity,
) {}
