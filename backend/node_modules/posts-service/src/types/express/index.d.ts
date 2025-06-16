import { Multer } from 'multer';
import { UserRole } from '../../types/user';
import { Server as SocketIOServer } from 'socket.io';

declare global {
  namespace Express {
    export interface Request {
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[];
      file?: Express.Multer.File;
      user?: {
        id: string;
        role: UserRole;
      } | null;
      io?: SocketIOServer;
    }
  }
}

export {};
