import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EmployeeShift } from './employee-shift.entity';

export class EmployeeShiftPlanBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @OneToMany(
    () => EmployeeShift,
    (employeeShift) => employeeShift.employeeShiftPlan,
  )
  employeeShiftList: EmployeeShift[];
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class EmployeeShiftPlan extends mixin(
  EmployeeShiftPlanBase,
  StampableEntity,
) {}
