import mixin from 'ts-mixin-extended';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { IsString } from 'class-validator';

export class EmployeeAliasBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsString()
  fullname: string;

  @ManyToOne(() => Employee, (employee) => employee.aliasList, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  employeeId: number;
}

@Entity()
export class EmployeeAlias extends mixin(EmployeeAliasBase) {}
