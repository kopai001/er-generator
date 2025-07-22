import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Checkpoint } from './checkpoint.entity';

export class EmployeeCheckpointBase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Employee, (employee) => employee.employeeCheckpointList)
  employee: Employee;

  @ManyToOne(
    () => Checkpoint,
    (checkpoint) => checkpoint.employeeCheckpointList,
  )
  checkpoint: Checkpoint;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class EmployeeCheckpoint extends mixin(
  EmployeeCheckpointBase,
  StampableEntity,
) {}
