import { Test, TestingModule } from '@nestjs/testing';
import { UserPermissionsController } from './user-permissions.controller';

describe('UserPermissionsController', () => {
  let controller: UserPermissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPermissionsController],
    }).compile();

    controller = module.get<UserPermissionsController>(UserPermissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
