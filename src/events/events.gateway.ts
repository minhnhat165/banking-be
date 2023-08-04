import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { UserPermissionsService } from 'src/user-permissions/user-permissions.service';

@WebSocketGateway({ cors: '*' })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    // private readonly userService: UserService,
    private readonly userPermissionService: UserPermissionsService,
  ) {}
  @WebSocketServer()
  public server: Server;
  afterInit(server: Server) {
    console.log('socket ', server?.engine?.clientsCount);
    // console.log('socket ', server?.engine?.clientsCount);
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    // console.log('socket ', client?.id);
  }
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // console.log('socket ', client?.id);
  }

  @SubscribeMessage('client.join')
  joinAdminRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ) {
    client.join(userId.toString());
  }

  @OnEvent('permission.update')
  async permissionUpdate(userId: number) {
    const filter = { userId };
    const permissions = await this.userPermissionService.findAll(filter);
    this.server
      .to(userId.toString())
      .emit('server.permission.update', permissions.items);
  }
}
