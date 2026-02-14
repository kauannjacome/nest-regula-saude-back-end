import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Core
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

// CRUD Modules
import { UnitsModule } from './modules/units/units.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { FoldersModule } from './modules/folders/folders.module';
import { CareModule } from './modules/care/care.module';
import { CareGroupsModule } from './modules/care-groups/care-groups.module';
import { GroupsModule } from './modules/groups/groups.module';
import { CitizensModule } from './modules/citizens/citizens.module';
import { UsersModule } from './modules/users/users.module';
import { RegulationsModule } from './modules/regulations/regulations.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { EmploymentsModule } from './modules/employments/employments.module';
import { RolesModule } from './modules/roles/roles.module';
import { ImagesModule } from './modules/images/images.module';

// Specialized Modules
import { AdminModule } from './modules/admin/admin.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { UploadModule } from './modules/upload/upload.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { MunicipalModule } from './modules/municipal/municipal.module';
import { SupportModule } from './modules/support/support.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ListsModule } from './modules/lists/lists.module';
import { StatsModule } from './modules/stats/stats.module';
import { MiscModule } from './modules/misc/misc.module';

@Module({
  imports: [
    // Infrastructure
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),

    // Auth
    AuthModule,

    // CRUD Modules
    UnitsModule,
    SuppliersModule,
    FoldersModule,
    CareModule,
    CareGroupsModule,
    GroupsModule,
    CitizensModule,
    UsersModule,
    RegulationsModule,
    SchedulesModule,
    NotificationsModule,
    DocumentsModule,
    ReportsModule,
    ProfessionalsModule,
    EmploymentsModule,
    RolesModule,
    ImagesModule,

    // Specialized Modules
    AdminModule,
    WhatsappModule,
    UploadModule,
    TenantModule,
    MunicipalModule,
    SupportModule,
    OnboardingModule,
    AuditModule,
    HealthModule,
    TemplatesModule,
    ListsModule,
    StatsModule,
    MiscModule,
  ],
})
export class AppModule {}
