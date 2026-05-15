import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ cors: true })
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(NotificationGateway.name);
  private clients = new Map<string, string>(); // userId -> socketId

  constructor(private readonly auth: AuthService) {}

  handleConnection(client: Socket) {
    this.logger.log('Socket connected: ' + client.id);
    // client should authenticate by sending { event: 'authenticate', token }
    client.on('authenticate', (data: any) => {
      try {
        const token = data?.token;
        const decoded = this.auth.verifyJwt(token);
        if (decoded?.sub) {
          const userId = decoded.sub;
          this.clients.set(userId, client.id);
          client.data.userId = userId;
          this.logger.log(`Socket ${client.id} authenticated as ${userId}`);
        }
      } catch (e) {
        this.logger.debug('socket auth failed: ' + String(e));
      }
    });

    // subscribe/unsubscribe to named rooms (topics)
    client.on('subscribe', (data: any) => {
      const room = data?.room;
      if (!room) return;
      client.join(room);
      this.logger.log(`Socket ${client.id} joined room ${room}`);
    });

    client.on('unsubscribe', (data: any) => {
      const room = data?.room;
      if (!room) return;
      client.leave(room);
      this.logger.log(`Socket ${client.id} left room ${room}`);
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log('Socket disconnected: ' + client.id);
    // remove mapping if present
    for (const [uid, sid] of this.clients.entries()) {
      if (sid === client.id) this.clients.delete(uid);
    }
  }

  sendToUser(userId: string, event: string, payload: any) {
    const sid = this.clients.get(userId);
    if (!sid) return false;
    try {
      this.server.to(sid).emit(event, payload);
      return true;
    } catch (e) {
      this.logger.warn('sendToUser failed: ' + String(e));
      return false;
    }
  }

  sendToRoom(room: string, event: string, payload: any) {
    try {
      this.server.to(room).emit(event, payload);
      return true;
    } catch (e) {
      this.logger.warn('sendToRoom failed: ' + String(e));
      return false;
    }
  }
}
