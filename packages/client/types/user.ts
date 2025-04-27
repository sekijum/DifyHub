import type { IThread } from '~/types/thread';
import type { IThreadComment } from '~/types/thread-comment';
import type { ICollection } from '~/types/collection';

export interface IUser {
  id: number;
  name: string;
  role: string;
  email: string;
  profileLink: string;
  createdAt: string;
  updatedAt: string;
  threads: ICollection<IThread>;
  comments: ICollection<IThreadComment>;
}
