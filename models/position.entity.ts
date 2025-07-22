import mixin from 'ts-mixin-extended';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { PositionType } from './position-type.entity';
import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { EmployeeTypeEnum } from 'src/enums/employee-type.enum';
import { PositionSlot } from './position-slot.entity';

export class PositionBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  code: string; // รหัสตำแหน่ง

  @Column({ unique: true })
  @IsString()
  name: string;

  @Column()
  @IsString()
  type: string; // ชื่อประเภทตำแหน่ง

  @ManyToOne(() => PositionType, (positionType) => positionType.positionList)
  @JoinColumn({ name: 'positionTypeId' })
  positionType: PositionType;

  @Column()
  positionTypeId: number;

  @Column({ type: 'enum', enum: EmployeeTypeEnum })
  employeeType: EmployeeTypeEnum;

  @OneToMany(() => PositionSlot, (slot) => slot.position)
  positionSlotList: PositionSlot[];

  @Expose({ toPlainOnly: true })
  get displayText() {
    return this.name;
  }
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class Position extends mixin(PositionBase, StampableEntity) {}
