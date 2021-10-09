import { BaseEntity, Column, Entity, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class WatchList extends BaseEntity {

  @Column({ unique: true, primary: true })
  path: string;
  
  @ManyToOne(() => User, (us) => us.ID) 
  user: User;
}