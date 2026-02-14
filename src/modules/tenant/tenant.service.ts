import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async getRoles(subscriberId: number) {
    return this.prisma.tenantRole.findMany({
      where: { subscriberId },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(subscriberId: number, data: any) {
    const { permissions: permissionIds, ...roleData } = data;
    const role = await this.prisma.tenantRole.create({
      data: { ...roleData, subscriberId },
    });
    if (permissionIds?.length) {
      await this.prisma.tenantRolePermission.createMany({
        data: permissionIds.map((pid: string) => ({ roleId: role.id, permissionId: pid })),
      });
    }
    return role;
  }

  async updateRole(id: string, data: any) {
    const { permissions: permissionIds, ...roleData } = data;
    const role = await this.prisma.tenantRole.update({ where: { id }, data: roleData });
    if (permissionIds !== undefined) {
      await this.prisma.tenantRolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds?.length) {
        await this.prisma.tenantRolePermission.createMany({
          data: permissionIds.map((pid: string) => ({ roleId: id, permissionId: pid })),
        });
      }
    }
    return role;
  }

  async deleteRole(id: string) {
    await this.prisma.tenantRolePermission.deleteMany({ where: { roleId: id } });
    return this.prisma.tenantRole.delete({ where: { id } });
  }

  async getPermissions() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  async getSettings(subscriberId: number) {
    return this.prisma.subscriber.findUnique({ where: { id: subscriberId } });
  }

  async updateSettings(subscriberId: number, data: any) {
    return this.prisma.subscriber.update({ where: { id: subscriberId }, data });
  }
}
