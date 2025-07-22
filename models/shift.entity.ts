import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { ShiftTypeEnum } from 'src/enums/shift-type.enum';
import mixin from 'ts-mixin-extended';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EmployeeShift } from './employee-shift.entity';

export class ShiftBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({
    nullable: false,
    type: 'enum',
    enum: ShiftTypeEnum,
  })
  type: ShiftTypeEnum;

  @Column({ nullable: false })
  startWorkingTime: string;

  @Column({ nullable: false })
  endWorkingTime: string;

  @Column({ nullable: false })
  lateWorkingTime: string;

  @OneToMany(() => EmployeeShift, (employeeShift) => employeeShift.shift)
  employeeShiftList: EmployeeShift[];
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class Shift extends mixin(ShiftBase, StampableEntity) {}
