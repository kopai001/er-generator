import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Shift } from './shift.entity';
import { EmployeeShiftPlan } from './employee-shift-plan.entity';

export class EmployeeShiftBase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => EmployeeShiftPlan,
    (employeeShiftPlan) => employeeShiftPlan.employeeShiftList,
  )
  employeeShiftPlan: EmployeeShiftPlan;

  @ManyToOne(() => Shift, (shift) => shift.employeeShiftList)
  shift: Shift;

  @ManyToOne(() => Employee, (employee) => employee.employeeShiftList)
  employee: Employee;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class EmployeeShift extends mixin(EmployeeShiftBase, StampableEntity) {}
