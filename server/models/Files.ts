import { BaseEntity, Column, Entity } from "typeorm";

@Entity()
export class File extends BaseEntity {

  @Column({ unique: true, primary: true})
  path: string;
  
  @Column("datetime")
  lastModified: Date;

  @Column()
  isDir: boolean
}