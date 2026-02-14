import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { seedTenantPermissionsAndRoles } from '../lib/tenant/seed-tenant'
import { seedGlobalGroups } from '../lib/seeds/seed-global-groups'
import * as fs from 'fs'
import * as path from 'path'

// =============================================================================
// HELPERS
// =============================================================================

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateCPF(): string {
  const n = () => Math.floor(Math.random() * 10)
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`
}

function generateCNS(): string {
  return Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('')
}

function generatePhone(ddd: string): string {
  const n = () => Math.floor(Math.random() * 10)
  return `(${ddd}) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`
}

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// =============================================================================
// DATA
// =============================================================================

const FIRST_NAMES_MALE = [
  'João', 'Pedro', 'Carlos', 'José', 'Antônio', 'Francisco', 'Paulo', 'Lucas',
  'Marcos', 'Rafael', 'Gabriel', 'Daniel', 'Bruno', 'Eduardo', 'Felipe',
  'Gustavo', 'Leonardo', 'Matheus', 'Ricardo', 'Rodrigo', 'André', 'Thiago',
  'Fernando', 'Marcelo', 'Alexandre', 'Diego', 'Henrique', 'Victor', 'Fábio',
  'Vinícius', 'Leandro', 'Roberto', 'Sérgio', 'Cláudio', 'Adriano', 'Márcio',
]

const FIRST_NAMES_FEMALE = [
  'Maria', 'Ana', 'Juliana', 'Fernanda', 'Patricia', 'Aline', 'Camila',
  'Amanda', 'Bruna', 'Carla', 'Daniela', 'Letícia', 'Mariana', 'Beatriz',
  'Larissa', 'Vanessa', 'Luciana', 'Roberta', 'Adriana', 'Cristiane',
  'Renata', 'Sandra', 'Paula', 'Tatiana', 'Carolina', 'Gabriela', 'Rafaela',
  'Natália', 'Isabela', 'Laura', 'Bianca', 'Vitória', 'Heloísa', 'Júlia',
]

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa',
  'Rodrigues', 'Almeida', 'Nascimento', 'Ferreira', 'Carvalho', 'Araújo',
  'Gomes', 'Martins', 'Ribeiro', 'Barbosa', 'Rocha', 'Correia', 'Dias',
  'Moraes', 'Castro', 'Freitas', 'Vieira', 'Cardoso', 'Monteiro', 'Pinto',
  'Campos', 'Teixeira', 'Moreira', 'Barros', 'Mendes', 'Andrade', 'Fernandes',
]

const NEIGHBORHOODS = [
  'Centro', 'Jardins', 'Vila Nova', 'Boa Vista', 'Santa Cruz', 'São José',
  'Alto da Boa Vista', 'Parque das Flores', 'Vila Mariana', 'Consolação',
  'Liberdade', 'Mooca', 'Ipiranga', 'Bela Vista', 'Pinheiros', 'Butantã',
]

const STREETS = [
  'Rua das Flores', 'Av. Brasil', 'Rua São Paulo', 'Av. Paulista', 'Rua 7 de Setembro',
  'Rua XV de Novembro', 'Av. República', 'Rua do Comércio', 'Rua Principal',
  'Av. Central', 'Rua das Palmeiras', 'Rua do Sol', 'Av. Independência',
]

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const MARITAL_STATUS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']
const RACES = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena']

// =============================================================================
// SUBSCRIBERS - Cidades internacionais
// =============================================================================

const CITIES = [
  {
    name: 'Orlando',
    stateName: 'Florida',
    stateAcronym: 'FL',
    ddd: '40',
    cnpj: '46.523.239/0001-47',
    postalCode: '32801-000',
    city: 'Orlando',
    users: [
      { name: 'Lucas Martins', email: 'admin.orlando@nextsaude.test', sex: 'MALE' as const, role: 'admin', position: 'Administrador Municipal' },
      { name: 'Dr. Rafael Costa', email: 'medico1.orlando@nextsaude.test', sex: 'MALE' as const, role: 'doctor', position: 'Médico Regulador', registry: 'CRM', registryNumber: '12345' },
      { name: 'Dra. Mariana Oliveira', email: 'medico2.orlando@nextsaude.test', sex: 'FEMALE' as const, role: 'doctor', position: 'Médica Reguladora', registry: 'CRM', registryNumber: '23456' },
      { name: 'Amanda Souza', email: 'digitador1.orlando@nextsaude.test', sex: 'FEMALE' as const, role: 'typist', position: 'Digitadora' },
      { name: 'Pedro Ferreira', email: 'digitador2.orlando@nextsaude.test', sex: 'MALE' as const, role: 'typist', position: 'Digitador' },
    ],
  },
  {
    name: 'Londres',
    stateName: 'England',
    stateAcronym: 'EN',
    ddd: '44',
    cnpj: '08.241.832/0001-96',
    postalCode: 'SW1A-1AA',
    city: 'Londres',
    users: [
      { name: 'Gabriel Almeida', email: 'admin.londres@nextsaude.test', sex: 'MALE' as const, role: 'admin', position: 'Administrador Municipal' },
      { name: 'Dr. Carlos Nascimento', email: 'medico1.londres@nextsaude.test', sex: 'MALE' as const, role: 'doctor', position: 'Médico Regulador', registry: 'CRM', registryNumber: '34567' },
      { name: 'Dra. Juliana Ribeiro', email: 'medico2.londres@nextsaude.test', sex: 'FEMALE' as const, role: 'doctor', position: 'Médica Reguladora', registry: 'CRM', registryNumber: '45678' },
      { name: 'Fernanda Gomes', email: 'digitador1.londres@nextsaude.test', sex: 'FEMALE' as const, role: 'typist', position: 'Digitadora' },
      { name: 'Thiago Barbosa', email: 'digitador2.londres@nextsaude.test', sex: 'MALE' as const, role: 'typist', position: 'Digitador' },
    ],
  },
  {
    name: 'Roma',
    stateName: 'Lazio',
    stateAcronym: 'RM',
    ddd: '06',
    cnpj: '08.348.971/0001-39',
    postalCode: '00100-000',
    city: 'Roma',
    users: [
      { name: 'Leonardo Cardoso', email: 'admin.roma@nextsaude.test', sex: 'MALE' as const, role: 'admin', position: 'Administrador Municipal' },
      { name: 'Dr. Eduardo Freitas', email: 'medico1.roma@nextsaude.test', sex: 'MALE' as const, role: 'doctor', position: 'Médico Regulador', registry: 'CRM', registryNumber: '56789' },
      { name: 'Dra. Beatriz Monteiro', email: 'medico2.roma@nextsaude.test', sex: 'FEMALE' as const, role: 'doctor', position: 'Médica Reguladora', registry: 'CRM', registryNumber: '67890' },
      { name: 'Camila Araújo', email: 'digitador1.roma@nextsaude.test', sex: 'FEMALE' as const, role: 'typist', position: 'Digitadora' },
      { name: 'Bruno Teixeira', email: 'digitador2.roma@nextsaude.test', sex: 'MALE' as const, role: 'typist', position: 'Digitador' },
    ],
  },
]

// Care categories with procedures
const CARE_CATEGORIES = {
  'Exames de Imagem': [
    { name: 'Raio-X de Tórax', acronym: 'RX-TORAX', value: 50, days: 30 },
    { name: 'Raio-X de Coluna', acronym: 'RX-COL', value: 60, days: 30 },
    { name: 'Raio-X de Abdomen', acronym: 'RX-ABD', value: 55, days: 30 },
    { name: 'Tomografia de Crânio', acronym: 'TC-CRANIO', value: 350, days: 15 },
    { name: 'Tomografia de Tórax', acronym: 'TC-TORAX', value: 380, days: 15 },
    { name: 'Tomografia de Abdomen', acronym: 'TC-ABD', value: 400, days: 15 },
    { name: 'Ressonância Magnética de Crânio', acronym: 'RM-CRANIO', value: 800, days: 45 },
    { name: 'Ressonância Magnética de Coluna', acronym: 'RM-COL', value: 850, days: 45 },
    { name: 'Ressonância Magnética de Joelho', acronym: 'RM-JOELHO', value: 750, days: 45 },
    { name: 'Ultrassonografia Abdomen Total', acronym: 'USG-ABD', value: 120, days: 20 },
    { name: 'Ultrassonografia Pélvica', acronym: 'USG-PELV', value: 100, days: 20 },
    { name: 'Ultrassonografia de Tireoide', acronym: 'USG-TIR', value: 90, days: 20 },
    { name: 'Mamografia Bilateral', acronym: 'MMG', value: 85, days: 30 },
    { name: 'Densitometria Óssea', acronym: 'DEXA', value: 150, days: 60 },
  ],
  'Consultas Especializadas': [
    { name: 'Consulta Cardiologia', acronym: 'CONS-CARDIO', value: 150, days: 60 },
    { name: 'Consulta Neurologia', acronym: 'CONS-NEURO', value: 180, days: 90 },
    { name: 'Consulta Ortopedia', acronym: 'CONS-ORTO', value: 140, days: 45 },
    { name: 'Consulta Oftalmologia', acronym: 'CONS-OFTALMO', value: 120, days: 30 },
    { name: 'Consulta Dermatologia', acronym: 'CONS-DERMA', value: 130, days: 45 },
    { name: 'Consulta Gastroenterologia', acronym: 'CONS-GASTRO', value: 160, days: 60 },
    { name: 'Consulta Pneumologia', acronym: 'CONS-PNEUMO', value: 155, days: 45 },
    { name: 'Consulta Endocrinologia', acronym: 'CONS-ENDO', value: 170, days: 60 },
    { name: 'Consulta Urologia', acronym: 'CONS-URO', value: 145, days: 45 },
    { name: 'Consulta Ginecologia', acronym: 'CONS-GINECO', value: 130, days: 30 },
    { name: 'Consulta Psiquiatria', acronym: 'CONS-PSIQ', value: 200, days: 60 },
    { name: 'Consulta Oncologia', acronym: 'CONS-ONCO', value: 220, days: 30 },
  ],
  'Procedimentos Cirúrgicos': [
    { name: 'Cirurgia de Catarata', acronym: 'CIR-CAT', value: 2500, days: 120 },
    { name: 'Cirurgia de Hérnia Inguinal', acronym: 'CIR-HERN', value: 3500, days: 90 },
    { name: 'Colecistectomia', acronym: 'CIR-COLEC', value: 4500, days: 90 },
    { name: 'Artroscopia de Joelho', acronym: 'CIR-ARTRO', value: 5000, days: 90 },
    { name: 'Cirurgia de Varizes', acronym: 'CIR-VARIZ', value: 3000, days: 120 },
    { name: 'Amigdalectomia', acronym: 'CIR-AMIG', value: 2000, days: 60 },
    { name: 'Septoplastia', acronym: 'CIR-SEPTO', value: 3500, days: 90 },
    { name: 'Vasectomia', acronym: 'CIR-VASEC', value: 1200, days: 30 },
  ],
  'Exames Laboratoriais': [
    { name: 'Hemograma Completo', acronym: 'HMG', value: 25, days: 7 },
    { name: 'Glicemia em Jejum', acronym: 'GLIC', value: 15, days: 7 },
    { name: 'Colesterol Total e Frações', acronym: 'COL-TF', value: 45, days: 7 },
    { name: 'Triglicerídeos', acronym: 'TG', value: 20, days: 7 },
    { name: 'Ureia e Creatinina', acronym: 'UR-CREAT', value: 30, days: 7 },
    { name: 'TGO e TGP', acronym: 'TGO-TGP', value: 35, days: 7 },
    { name: 'TSH e T4 Livre', acronym: 'TSH-T4', value: 55, days: 10 },
    { name: 'PSA Total e Livre', acronym: 'PSA', value: 70, days: 10 },
    { name: 'Vitamina D', acronym: 'VIT-D', value: 80, days: 15 },
    { name: 'Parcial de Urina', acronym: 'EAS', value: 18, days: 5 },
  ],
  'Exames Cardiológicos': [
    { name: 'Eletrocardiograma', acronym: 'ECG', value: 60, days: 15 },
    { name: 'Ecocardiograma', acronym: 'ECO', value: 250, days: 30 },
    { name: 'Teste Ergométrico', acronym: 'TE', value: 180, days: 30 },
    { name: 'Holter 24 Horas', acronym: 'HOLTER', value: 200, days: 30 },
    { name: 'MAPA 24 Horas', acronym: 'MAPA', value: 180, days: 30 },
    { name: 'Doppler de Carótidas', acronym: 'DOPP-CAR', value: 220, days: 30 },
  ],
  'Terapias e Reabilitação': [
    { name: 'Fisioterapia - Sessão', acronym: 'FISIO', value: 45, days: 15 },
    { name: 'Fonoaudiologia - Sessão', acronym: 'FONO', value: 50, days: 15 },
    { name: 'Terapia Ocupacional - Sessão', acronym: 'TO', value: 50, days: 15 },
    { name: 'Psicoterapia - Sessão', acronym: 'PSICO', value: 80, days: 15 },
    { name: 'Nutrição - Consulta', acronym: 'NUTRI', value: 70, days: 30 },
    { name: 'Acupuntura - Sessão', acronym: 'ACUP', value: 60, days: 15 },
  ],
  'Procedimentos Odontológicos': [
    { name: 'Extração Dentária Simples', acronym: 'EXT-SIMP', value: 80, days: 15 },
    { name: 'Extração de Terceiro Molar', acronym: 'EXT-3M', value: 250, days: 30 },
    { name: 'Tratamento de Canal', acronym: 'ENDO', value: 350, days: 30 },
    { name: 'Restauração em Resina', acronym: 'REST-RES', value: 100, days: 15 },
    { name: 'Prótese Total', acronym: 'PROT-TOT', value: 800, days: 60 },
    { name: 'Limpeza e Profilaxia', acronym: 'PROFI', value: 60, days: 15 },
    { name: 'Implante Dentário', acronym: 'IMPLANTE', value: 2500, days: 90 },
  ],
}

const CIDS = [
  { code: 'J06', description: 'Infecção aguda das vias aéreas superiores' },
  { code: 'I10', description: 'Hipertensão essencial' },
  { code: 'E11', description: 'Diabetes mellitus tipo 2' },
  { code: 'M54', description: 'Dorsalgia' },
  { code: 'K29', description: 'Gastrite e duodenite' },
  { code: 'F32', description: 'Episódio depressivo' },
  { code: 'J45', description: 'Asma' },
  { code: 'N39', description: 'Outros transtornos do trato urinário' },
  { code: 'R10', description: 'Dor abdominal' },
  { code: 'R51', description: 'Cefaleia' },
  { code: 'H52', description: 'Transtornos da refração e da acomodação' },
  { code: 'K80', description: 'Colelitíase' },
  { code: 'I25', description: 'Doença isquêmica crônica do coração' },
  { code: 'M17', description: 'Gonartrose' },
  { code: 'E78', description: 'Distúrbios do metabolismo de lipoproteínas' },
]

// =============================================================================
// MAIN SEED
// =============================================================================

async function main() {
  console.log('🌱 Iniciando seed completo do banco de dados...\n')

  // ─── LIMPEZA COMPLETA ───
  console.log('🧹 Limpando dados existentes...')

  // Tabelas filho primeiro (ordem reversa de dependências)
  await prisma.systemRoutineExecution.deleteMany()
  await prisma.systemRoutine.deleteMany()
  await prisma.systemConfig.deleteMany()
  await prisma.backupHistory.deleteMany()
  await prisma.supportTicketMessage.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.subscriptionPayment.deleteMany()
  await prisma.onboardingImportLog.deleteMany()
  await prisma.userOnboarding.deleteMany()
  await prisma.generatedReport.deleteMany()
  await prisma.termsOfUse.deleteMany()
  await prisma.notificationConfig.deleteMany()
  await prisma.whatsAppNotificationPreference.deleteMany()
  await prisma.notificationRule.deleteMany()
  await prisma.whatsAppProgrammed.deleteMany()
  await prisma.whatsAppConfig.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.regulationUser.deleteMany()
  await prisma.careRegulation.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.uploadAccessLog.deleteMany()
  await prisma.generatedDocument.deleteMany()
  await prisma.documentAccessLog.deleteMany()
  await prisma.citizenDocument.deleteMany()
  await prisma.userDocument.deleteMany()
  await prisma.regulation.deleteMany()
  await prisma.care.deleteMany()
  await prisma.folder.deleteMany()
  await prisma.subGroup.deleteMany()
  await prisma.group.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.citizen.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.protocolCounter.deleteMany()
  await prisma.documentUploadToken.deleteMany()
  await prisma.documentTemplate.deleteMany()
  await prisma.qrcodeSmartAction.deleteMany()
  await prisma.batchAction.deleteMany()
  await prisma.upload.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.tenantRolePermission.deleteMany()
  await prisma.tenantRole.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.userEmployment.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.subscriber.deleteMany()
  console.log('✅ Banco limpo\n')

  // ─── GROUPS GLOBAIS SIGTAP ───
  console.log('📁 Criando grupos/subgrupos SIGTAP globais...')
  const globalGroupsResult = await seedGlobalGroups()
  console.log(`✅ ${globalGroupsResult.groupsCreated} grupos, ${globalGroupsResult.subGroupsCreated} subgrupos\n`)

  // ─── TERMOS DE USO ───
  console.log('📜 Criando Termos de Uso...')
  await prisma.termsOfUse.create({
    data: {
      version: '1.0',
      title: 'Termos de Uso - NextSaude',
      content: 'Ao utilizar o sistema NextSaude, você concorda com os termos de uso da plataforma de regulação de saúde. Este sistema é destinado exclusivamente para gestão de regulações, agendamentos e acompanhamento de pacientes. O uso indevido dos dados é de responsabilidade do usuário. Todos os dados são protegidos pela LGPD.',
      isActive: true,
    },
  })
  console.log('✅ Termos de Uso criados\n')

  // ─── SYSTEM CONFIG ───
  console.log('⚙️  Criando configurações do sistema...')
  await prisma.systemConfig.createMany({
    data: [
      { key: 'backup_enabled', value: JSON.stringify(true), updatedBy: null },
      { key: 'backup_retention_days', value: JSON.stringify(30), updatedBy: null },
      { key: 'maintenance_mode', value: JSON.stringify(false), updatedBy: null },
      { key: 'max_upload_size_mb', value: JSON.stringify(10), updatedBy: null },
      { key: 'session_timeout_minutes', value: JSON.stringify(60), updatedBy: null },
      { key: 'default_report_expiry_days', value: JSON.stringify(30), updatedBy: null },
      { key: 'whatsapp_global_enabled', value: JSON.stringify(false), updatedBy: null },
      { key: 'citizen_portal_enabled', value: JSON.stringify(true), updatedBy: null },
    ],
  })
  console.log('✅ 8 configurações criadas\n')

  // ─── SYSTEM ROUTINES ───
  console.log('🔄 Criando rotinas do sistema...')
  const routineCleanup = await prisma.systemRoutine.create({
    data: {
      name: 'reports-cleanup',
      displayName: 'Limpeza de Relatórios Expirados',
      description: 'Remove relatórios gerados com mais de 30 dias',
      cronExpr: '0 3 * * *',
      isEnabled: true,
      lastRunAt: new Date('2026-02-09T03:00:00'),
      nextRunAt: new Date('2026-02-10T03:00:00'),
    },
  })
  const routineBackup = await prisma.systemRoutine.create({
    data: {
      name: 'daily-backup',
      displayName: 'Backup Diário',
      description: 'Executa backup completo do banco de dados',
      cronExpr: '0 2 * * *',
      isEnabled: true,
      lastRunAt: new Date('2026-02-09T02:00:00'),
      nextRunAt: new Date('2026-02-10T02:00:00'),
    },
  })
  await prisma.systemRoutine.create({
    data: {
      name: 'notification-digest',
      displayName: 'Resumo de Notificações',
      description: 'Envia resumo diário de notificações pendentes',
      cronExpr: '0 8 * * 1-5',
      isEnabled: true,
      lastRunAt: new Date('2026-02-07T08:00:00'),
      nextRunAt: new Date('2026-02-10T08:00:00'),
    },
  })

  // Execuções de rotina
  await prisma.systemRoutineExecution.createMany({
    data: [
      { routineId: routineCleanup.id, status: 'SUCCESS', startedAt: new Date('2026-02-09T03:00:00'), finishedAt: new Date('2026-02-09T03:00:12'), duration: 12000, result: 'Removed 3 expired reports' },
      { routineId: routineCleanup.id, status: 'SUCCESS', startedAt: new Date('2026-02-08T03:00:00'), finishedAt: new Date('2026-02-08T03:00:08'), duration: 8000, result: 'No expired reports found' },
      { routineId: routineBackup.id, status: 'SUCCESS', startedAt: new Date('2026-02-09T02:00:00'), finishedAt: new Date('2026-02-09T02:05:30'), duration: 330000, result: 'Backup completed: 45MB' },
      { routineId: routineBackup.id, status: 'FAILED', startedAt: new Date('2026-02-08T02:00:00'), finishedAt: new Date('2026-02-08T02:00:05'), duration: 5000, error: 'S3 connection timeout' },
    ],
  })
  console.log('✅ 3 rotinas + 4 execuções criadas\n')

  // ─── HASHES DE SENHA ───
  const passwordHash = await bcrypt.hash('senha123', 10)
  const systemManagerPassword = await bcrypt.hash('123456', 10)

  // ─── SYSTEM MANAGERS GLOBAIS ───
  console.log('👤 Criando system managers globais...')
  const kauann = await prisma.user.create({
    data: {
      cpf: '085.312.414-05',
      name: 'Kauann Jacome de Oliveira',
      email: 'kauannjacome@gmail.com',
      phoneNumber: '(84) 99993-0505',
      passwordHash: systemManagerPassword,
      isSystemManager: true,
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
      acceptedTermsVersion: '1.0',
    },
  })

  const adminBackup = await prisma.user.create({
    data: {
      cpf: '000.000.000-01',
      name: 'Admin NextSaude',
      email: 'admin@nextsaude.com',
      passwordHash,
      isSystemManager: true,
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
      acceptedTermsVersion: '1.0',
    },
  })

  // Onboarding para system managers
  await prisma.userOnboarding.create({
    data: { userId: kauann.id, isCompleted: true, completedAt: new Date(), currentStep: 'COMPLETED', welcomeCompletedAt: new Date(), profileCompletedAt: new Date(), skipImport: true, skipTour: true },
  })
  await prisma.userOnboarding.create({
    data: { userId: adminBackup.id, isCompleted: true, completedAt: new Date(), currentStep: 'COMPLETED', welcomeCompletedAt: new Date(), profileCompletedAt: new Date(), skipImport: true, skipTour: true },
  })
  console.log('✅ 2 system managers criados\n')

  // ─── Backup History ───
  console.log('💾 Criando histórico de backups...')
  await prisma.backupHistory.createMany({
    data: [
      { filename: 'backup-2026-02-09.sql.gz', s3Key: 'backups/2026/02/backup-2026-02-09.sql.gz', size: 47185920, type: 'DAILY', status: 'COMPLETED', startedAt: new Date('2026-02-09T02:00:00'), completedAt: new Date('2026-02-09T02:05:30'), createdById: kauann.id },
      { filename: 'backup-2026-02-08.sql.gz', s3Key: 'backups/2026/02/backup-2026-02-08.sql.gz', size: 46137344, type: 'DAILY', status: 'COMPLETED', startedAt: new Date('2026-02-08T02:00:00'), completedAt: new Date('2026-02-08T02:04:15'), createdById: kauann.id },
      { filename: 'backup-full-2026-02-01.sql.gz', s3Key: 'backups/2026/02/backup-full-2026-02-01.sql.gz', size: 104857600, type: 'FULL', status: 'COMPLETED', startedAt: new Date('2026-02-01T01:00:00'), completedAt: new Date('2026-02-01T01:12:00'), createdById: kauann.id },
      { filename: 'backup-manual-2026-01-15.sql.gz', s3Key: 'backups/2026/01/backup-manual-2026-01-15.sql.gz', size: 42991616, type: 'MANUAL', status: 'COMPLETED', startedAt: new Date('2026-01-15T14:00:00'), completedAt: new Date('2026-01-15T14:03:45'), createdById: kauann.id },
    ],
  })
  console.log('✅ 4 backups criados\n')

  // ─── Tracking para .txt de credenciais ───
  const credentialLines: string[] = [
    '='.repeat(60),
    '  NEXTSAUDE - CREDENCIAIS DE ACESSO (SEED)',
    `  Gerado em: ${new Date().toISOString()}`,
    '='.repeat(60),
    '',
    '─── SYSTEM MANAGERS (acesso global) ───',
    '',
    '  Kauann Jacome de Oliveira (DONO DO SISTEMA)',
    '    Email: kauannjacome@gmail.com',
    '    Senha: 123456',
    '',
    '  Admin NextSaude (backup)',
    '    Email: admin@nextsaude.com',
    '    Senha: senha123',
    '',
  ]

  // ==========================================================================
  // PER-SUBSCRIBER LOOP
  // ==========================================================================

  const allSubscribers: { id: number; name: string; city: string }[] = []

  for (const cityData of CITIES) {
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`📍 ASSINANTE: ${cityData.name}`)
    console.log('═'.repeat(60))

    // ─── Subscriber ───
    const subscriber = await prisma.subscriber.create({
      data: {
        name: `Secretaria de Saúde - ${cityData.name}`,
        municipalityName: cityData.name,
        email: `saude@${cityData.city.toLowerCase()}.nextsaude.test`,
        telephone: generatePhone(cityData.ddd),
        cnpj: cityData.cnpj,
        postalCode: cityData.postalCode,
        city: cityData.city,
        neighborhood: 'Centro',
        street: 'Av. Principal',
        number: '100',
        stateName: cityData.stateName,
        stateAcronym: cityData.stateAcronym,
        subscriptionStatus: 'ACTIVE',
      },
    })
    allSubscribers.push({ id: subscriber.id, name: subscriber.name, city: cityData.city })
    console.log(`   ✅ Subscriber: ${subscriber.name}`)

    // ─── Permissions & Roles ───
    const { permissions, roles } = await seedTenantPermissionsAndRoles(subscriber.id)
    const adminRole = roles.find(r => r.name === 'admin_municipal')
    const doctorRole = roles.find(r => r.name === 'doctor')
    const typistRole = roles.find(r => r.name === 'typist')
    console.log(`   ✅ ${permissions.length} permissões, ${roles.length} cargos`)

    // ─── Protocol Counter ───
    await prisma.protocolCounter.create({
      data: { subscriberId: subscriber.id, prefix: 'PROT', currentCount: 25, year: 2026 },
    })

    // ─── Users ───
    console.log('   👥 Criando 5 usuários...')
    const cityUsers: { id: string; name: string; email: string | null; role: string }[] = []

    credentialLines.push(`─── ASSINANTE: ${cityData.name} (${subscriber.name}) ───`)
    credentialLines.push('')

    for (const userData of cityData.users) {
      const user = await prisma.user.create({
        data: {
          cpf: generateCPF(),
          name: userData.name,
          nameNormalized: normalizeText(userData.name),
          email: userData.email,
          position: userData.position,
          sex: userData.sex,
          birthDate: randomDate(new Date('1970-01-01'), new Date('1995-12-31')),
          phoneNumber: generatePhone(cityData.ddd),
          cns: generateCNS(),
          registryType: userData.registry || null,
          registryNumber: userData.registryNumber || null,
          registryState: userData.registry ? cityData.stateAcronym : null,
          passwordHash,
          acceptedTerms: true,
          acceptedTermsAt: new Date(),
          acceptedTermsVersion: '1.0',
        },
      })

      let roleId = typistRole?.id
      if (userData.role === 'admin') roleId = adminRole?.id
      else if (userData.role === 'doctor') roleId = doctorRole?.id

      await prisma.userEmployment.create({
        data: { userId: user.id, subscriberId: subscriber.id, roleId, isActive: true, isPrimary: true, status: 'ACCEPTED' },
      })

      // Onboarding para admin
      if (userData.role === 'admin') {
        await prisma.userOnboarding.create({
          data: { userId: user.id, isCompleted: true, completedAt: new Date(), currentStep: 'COMPLETED', welcomeCompletedAt: new Date(), profileCompletedAt: new Date(), importCompletedAt: new Date(), tourCompletedAt: new Date() },
        })
      }

      cityUsers.push({ id: user.id, name: user.name!, email: user.email, role: userData.role })

      const roleLabel = userData.role === 'admin' ? 'Admin' : userData.role === 'doctor' ? 'Médico' : 'Digitador'
      credentialLines.push(`  ${userData.name} (${roleLabel})`)
      credentialLines.push(`    Email: ${userData.email}`)
      credentialLines.push(`    Senha: senha123`)
      credentialLines.push('')
    }
    console.log('   ✅ 5 usuários com vínculos')

    // ─── Units ───
    console.log('   🏥 Criando unidades...')
    const units = await Promise.all([
      prisma.unit.create({
        data: {
          subscriberId: subscriber.id,
          name: `Hospital Municipal de ${cityData.name}`,
          nameNormalized: normalizeText(`Hospital Municipal de ${cityData.name}`),
          type: 'Hospital',
          address: 'Av. da Saúde', number: '500', neighborhood: 'Centro', city: cityData.city, state: cityData.stateAcronym,
          postalCode: cityData.postalCode, phone: generatePhone(cityData.ddd), email: `hospital@${cityData.city.toLowerCase()}.nextsaude.test`,
          cnes: String(randomNumber(1000000, 9999999)),
          mondayOpen: '07:00', mondayClose: '19:00', tuesdayOpen: '07:00', tuesdayClose: '19:00',
          wednesdayOpen: '07:00', wednesdayClose: '19:00', thursdayOpen: '07:00', thursdayClose: '19:00',
          fridayOpen: '07:00', fridayClose: '19:00', saturdayOpen: '08:00', saturdayClose: '12:00',
        },
      }),
      prisma.unit.create({
        data: {
          subscriberId: subscriber.id, name: `UBS Centro - ${cityData.name}`, nameNormalized: normalizeText(`UBS Centro - ${cityData.name}`),
          type: 'UBS', address: 'Rua Central', number: '200', neighborhood: 'Centro', city: cityData.city, state: cityData.stateAcronym,
          phone: generatePhone(cityData.ddd), cnes: String(randomNumber(1000000, 9999999)),
          mondayOpen: '07:00', mondayClose: '17:00', tuesdayOpen: '07:00', tuesdayClose: '17:00',
          wednesdayOpen: '07:00', wednesdayClose: '17:00', thursdayOpen: '07:00', thursdayClose: '17:00',
          fridayOpen: '07:00', fridayClose: '17:00',
        },
      }),
      prisma.unit.create({
        data: {
          subscriberId: subscriber.id, name: `UBS Vila Nova - ${cityData.name}`, nameNormalized: normalizeText(`UBS Vila Nova - ${cityData.name}`),
          type: 'UBS', address: 'Rua das Flores', number: '80', neighborhood: 'Vila Nova', city: cityData.city, state: cityData.stateAcronym,
          phone: generatePhone(cityData.ddd), cnes: String(randomNumber(1000000, 9999999)),
          mondayOpen: '08:00', mondayClose: '16:00', tuesdayOpen: '08:00', tuesdayClose: '16:00',
          wednesdayOpen: '08:00', wednesdayClose: '16:00', thursdayOpen: '08:00', thursdayClose: '16:00',
          fridayOpen: '08:00', fridayClose: '16:00',
        },
      }),
      prisma.unit.create({
        data: {
          subscriberId: subscriber.id, name: `Clínica Especializada - ${cityData.name}`, nameNormalized: normalizeText(`Clínica Especializada - ${cityData.name}`),
          type: 'Clínica', address: 'Av. Especialidades', number: '300', neighborhood: 'Jardins', city: cityData.city, state: cityData.stateAcronym,
          phone: generatePhone(cityData.ddd), cnes: String(randomNumber(1000000, 9999999)),
          mondayOpen: '08:00', mondayClose: '18:00', tuesdayOpen: '08:00', tuesdayClose: '18:00',
          wednesdayOpen: '08:00', wednesdayClose: '18:00', thursdayOpen: '08:00', thursdayClose: '18:00',
          fridayOpen: '08:00', fridayClose: '18:00',
        },
      }),
    ])
    console.log(`   ✅ ${units.length} unidades`)

    // ─── Suppliers ───
    console.log('   📦 Criando fornecedores...')
    const suppliersList = await Promise.all([
      prisma.supplier.create({
        data: {
          subscriberId: subscriber.id, name: `MedSupply ${cityData.name}`, tradeName: 'MedSupply',
          cnpj: `${randomNumber(10, 99)}.${randomNumber(100, 999)}.${randomNumber(100, 999)}/0001-${randomNumber(10, 99)}`,
          city: cityData.city, state: cityData.stateAcronym, address: 'Rua dos Fornecedores', number: '50',
          neighborhood: 'Industrial', phone: generatePhone(cityData.ddd), email: `medsupply@${cityData.city.toLowerCase()}.test`,
        },
      }),
      prisma.supplier.create({
        data: {
          subscriberId: subscriber.id, name: `LabExame ${cityData.name}`, tradeName: 'LabExame',
          cnpj: `${randomNumber(10, 99)}.${randomNumber(100, 999)}.${randomNumber(100, 999)}/0001-${randomNumber(10, 99)}`,
          city: cityData.city, state: cityData.stateAcronym, address: 'Av. dos Laboratórios', number: '120',
          neighborhood: 'Centro', phone: generatePhone(cityData.ddd), email: `labexame@${cityData.city.toLowerCase()}.test`,
        },
      }),
      prisma.supplier.create({
        data: {
          subscriberId: subscriber.id, name: `Clínica Diagnóstica ${cityData.name}`, tradeName: 'DiagPlus',
          cnpj: `${randomNumber(10, 99)}.${randomNumber(100, 999)}.${randomNumber(100, 999)}/0001-${randomNumber(10, 99)}`,
          city: cityData.city, state: cityData.stateAcronym, address: 'Rua Diagnóstica', number: '75',
          neighborhood: 'Saúde', phone: generatePhone(cityData.ddd), email: `diagplus@${cityData.city.toLowerCase()}.test`,
        },
      }),
    ])
    console.log(`   ✅ ${suppliersList.length} fornecedores`)

    // ─── Groups & Cares ───
    console.log('   💊 Criando grupos e procedimentos...')
    const cares: { id: number; name: string }[] = []
    for (const [groupName, procedures] of Object.entries(CARE_CATEGORIES)) {
      let group = await prisma.group.findFirst({ where: { name: groupName, deletedAt: null } })
      if (!group) {
        group = await prisma.group.create({ data: { name: groupName, description: `Grupo de ${groupName.toLowerCase()}` } })
      }

      for (const proc of procedures) {
        const care = await prisma.care.create({
          data: {
            subscriberId: subscriber.id, name: proc.name, nameNormalized: normalizeText(proc.name), acronym: proc.acronym,
            description: `Procedimento: ${proc.name}`, status: 'ACTIVE',
            priority: proc.value > 500 ? 'URGENCY' : 'ELECTIVE', unitMeasure: 'UN',
            resourceOrigin: proc.value > 1000 ? 'STATE' : 'MUNICIPAL',
            value: proc.value, minDeadlineDays: proc.days, groupId: group.id,
            userId: cityUsers[0].id, supplierId: randomElement(suppliersList).id,
          },
        })
        cares.push({ id: care.id, name: care.name })
      }
    }
    console.log(`   ✅ ${cares.length} procedimentos`)

    // ─── Document Templates ───
    console.log('   📄 Criando modelos de documento...')
    const templates = await Promise.all([
      prisma.documentTemplate.create({
        data: {
          subscriberId: subscriber.id, name: 'Laudo Médico Padrão', nameNormalized: normalizeText('Laudo Médico Padrão'),
          description: 'Modelo padrão para laudos médicos de regulação', category: 'laudo', version: 1, status: 'ACTIVE',
          content: '<h1>LAUDO MÉDICO</h1><p>Paciente: {{cidadao.nome}}</p><p>CPF: {{cidadao.cpf}}</p><p>CID: {{regulacao.cid}}</p><p>Indicação Clínica: {{regulacao.indicacao_clinica}}</p>',
          createdBy: cityUsers[1].id,
        },
      }),
      prisma.documentTemplate.create({
        data: {
          subscriberId: subscriber.id, name: 'Encaminhamento', nameNormalized: normalizeText('Encaminhamento'),
          description: 'Modelo de encaminhamento para especialista', category: 'encaminhamento', version: 1, status: 'ACTIVE',
          content: '<h1>ENCAMINHAMENTO</h1><p>Encaminhamos o(a) paciente {{cidadao.nome}} para avaliação e conduta.</p>',
          createdBy: cityUsers[1].id,
        },
      }),
      prisma.documentTemplate.create({
        data: {
          subscriberId: subscriber.id, name: 'Guia de Agendamento', nameNormalized: normalizeText('Guia de Agendamento'),
          description: 'Guia para confirmação de agendamento', category: 'agendamento', version: 1, status: 'ACTIVE',
          content: '<h1>GUIA DE AGENDAMENTO</h1><p>Paciente: {{cidadao.nome}}</p><p>Data: {{agendamento.data}}</p><p>Profissional: {{agendamento.profissional}}</p>',
          createdBy: cityUsers[0].id,
        },
      }),
      prisma.documentTemplate.create({
        data: {
          subscriberId: subscriber.id, name: 'Receituário', nameNormalized: normalizeText('Receituário'),
          description: 'Modelo de receituário médico', category: 'receituario', version: 1, status: 'DRAFT',
          content: '<h1>RECEITUÁRIO</h1><p>Paciente: {{cidadao.nome}}</p>',
          createdBy: cityUsers[2].id,
        },
      }),
    ])
    console.log(`   ✅ ${templates.length} modelos de documento`)

    // ─── Citizens (150 per subscriber, com nome da cidade) ───
    console.log(`   🏥 Criando 150 cidadãos (${cityData.name})...`)
    const citizens: { id: number; name: string }[] = []

    for (let i = 0; i < 150; i++) {
      const isMale = Math.random() > 0.5
      const firstName = randomElement(isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE)
      const lastName1 = randomElement(LAST_NAMES)
      const lastName2 = randomElement(LAST_NAMES)
      const fullName = `${firstName} ${lastName1} ${lastName2}`
      const isComplete = Math.random() < 0.7

      const citizen = await prisma.citizen.create({
        data: {
          subscriberId: subscriber.id,
          cpf: generateCPF(),
          cns: isComplete ? generateCNS() : null,
          name: fullName,
          nameNormalized: normalizeText(fullName),
          socialName: Math.random() < 0.1 ? firstName : null,
          race: isComplete ? randomElement(RACES) : null,
          sex: isMale ? 'MALE' : 'FEMALE',
          birthDate: randomDate(new Date('1940-01-01'), new Date('2020-12-31')),
          motherName: `${randomElement(FIRST_NAMES_FEMALE)} ${lastName1}`,
          fatherName: isComplete ? `${randomElement(FIRST_NAMES_MALE)} ${lastName2}` : null,
          phone: generatePhone(cityData.ddd),
          email: isComplete ? `${firstName.toLowerCase()}.${lastName1.toLowerCase()}${randomNumber(1, 999)}@email.com` : null,
          postalCode: isComplete ? `${randomNumber(10000, 99999)}-${randomNumber(100, 999)}` : null,
          state: cityData.stateAcronym,
          city: cityData.city, // <-- nome da cidade do assinante
          address: randomElement(STREETS),
          number: String(randomNumber(1, 2000)),
          complement: isComplete && Math.random() < 0.3 ? `Apto ${randomNumber(1, 500)}` : null,
          neighborhood: randomElement(NEIGHBORHOODS),
          nationality: 'Brasileira',
          placeOfBirth: cityData.city, // <-- nascido na cidade do assinante
          maritalStatus: isComplete ? randomElement(MARITAL_STATUS) : null,
          bloodType: isComplete && Math.random() < 0.5 ? randomElement(BLOOD_TYPES) : null,
          rg: isComplete ? `${randomNumber(10, 99)}.${randomNumber(100, 999)}.${randomNumber(100, 999)}-${randomNumber(0, 9)}` : null,
          rgIssuer: isComplete ? 'SSP' : null,
          rgState: isComplete ? cityData.stateAcronym : null,
        },
      })
      citizens.push({ id: citizen.id, name: citizen.name })
    }
    console.log(`   ✅ ${citizens.length} cidadãos (cidade: ${cityData.city})`)

    // ─── Folders ───
    console.log('   📂 Criando pastas...')
    const folders = await Promise.all([
      prisma.folder.create({ data: { subscriberId: subscriber.id, name: `Regulações Janeiro 2026 - ${cityData.name}`, idCode: 'REG-2026-01', description: 'Regulações do mês de janeiro', responsibleId: cityUsers[0].id, startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'), color: '#3B82F6' } }),
      prisma.folder.create({ data: { subscriberId: subscriber.id, name: `Regulações Fevereiro 2026 - ${cityData.name}`, idCode: 'REG-2026-02', description: 'Regulações do mês de fevereiro', responsibleId: cityUsers[0].id, startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28'), color: '#10B981' } }),
      prisma.folder.create({ data: { subscriberId: subscriber.id, name: 'Urgências e Emergências', idCode: 'URG-EMERG', description: 'Casos urgentes e emergenciais', responsibleId: cityUsers[1].id, color: '#EF4444' } }),
      prisma.folder.create({ data: { subscriberId: subscriber.id, name: 'Cirurgias Eletivas', idCode: 'CIR-ELET', description: 'Procedimentos cirúrgicos eletivos', responsibleId: cityUsers[1].id, color: '#F59E0B' } }),
    ])
    console.log(`   ✅ ${folders.length} pastas`)

    // ─── Regulations (30 per subscriber) ───
    console.log('   📋 Criando 30 regulações...')
    const regulations: { id: number; status: string; citizenId: number }[] = []
    const statuses: string[] = ['PENDING', 'IN_PROGRESS', 'APPROVED', 'SCHEDULED', 'DENIED', 'RETURNED', 'CANCELLED']
    const careQuantities = [1, 1, 1, 5, 5, 5, 15, 15, 25, 25, 1, 1, 3, 5, 5, 10, 15, 20, 25, 1, 2, 3, 5, 5, 10, 10, 15, 15, 20, 25]

    for (let i = 0; i < 30; i++) {
      const citizen = randomElement(citizens)
      const cid = randomElement(CIDS)
      const status = i < 10 ? statuses[i % 5] : randomElement(statuses)

      const regulation = await prisma.regulation.create({
        data: {
          subscriberId: subscriber.id, citizenId: citizen.id,
          idCode: `PROT-2026-${String(i + 1).padStart(5, '0')}`,
          requestDate: randomDate(new Date('2026-01-01'), new Date('2026-02-09')),
          status: status as any, priority: randomElement(['ELECTIVE', 'URGENCY', 'EMERGENCY'] as const),
          notes: `Solicitação de procedimento para ${citizen.name} - Assinante: ${cityData.name}`,
          clinicalIndication: cid.description, cid: cid.code,
          folderId: randomElement(folders).id,
          requestingProfessional: cityUsers[randomNumber(1, 2)].name,
          creatorId: randomElement(cityUsers).id,
          analyzedId: ['APPROVED', 'DENIED', 'SCHEDULED'].includes(status) ? cityUsers[randomNumber(1, 2)].id : null,
          supplierId: randomElement(suppliersList).id,
          unit_id: randomElement(units).id,
        },
      })
      regulations.push({ id: regulation.id, status: regulation.status!, citizenId: citizen.id })

      // CareRegulations
      const numCares = careQuantities[i]
      const shuffled = [...cares].sort(() => Math.random() - 0.5).slice(0, Math.min(numCares, cares.length))
      for (const care of shuffled) {
        await prisma.careRegulation.create({
          data: { subscriberId: subscriber.id, careId: care.id, regulationId: regulation.id, quantity: randomNumber(1, 3) },
        })
      }

      // RegulationUser entries
      await prisma.regulationUser.create({
        data: { regulationId: regulation.id, userId: randomElement(cityUsers).id, action: 'CREATOR', details: { source: 'seed' } },
      })
      if (['APPROVED', 'DENIED', 'SCHEDULED'].includes(status)) {
        await prisma.regulationUser.create({
          data: { regulationId: regulation.id, userId: cityUsers[randomNumber(1, 2)].id, action: 'ANALYZER', details: { source: 'seed' } },
        })
      }
    }
    console.log(`   ✅ 30 regulações com procedimentos vinculados`)

    // ─── Schedules ───
    console.log('   📅 Criando agendamentos...')
    const schedulableRegs = regulations.filter(r => ['APPROVED', 'SCHEDULED'].includes(r.status))
    let scheduleCount = 0
    for (const reg of schedulableRegs) {
      const schedStatus = randomElement(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'WAITING'])
      await prisma.schedule.create({
        data: {
          subscriberId: subscriber.id, regulationId: reg.id,
          professionalId: cityUsers[randomNumber(1, 2)].id,
          status: schedStatus as any,
          scheduledDate: randomDate(new Date('2026-02-10'), new Date('2026-04-30')),
          notes: 'Agendamento criado pelo seed', recurrenceType: 'NONE',
        },
      })
      scheduleCount++
    }
    console.log(`   ✅ ${scheduleCount} agendamentos`)

    // ─── Notifications ───
    console.log('   🔔 Criando notificações...')
    const notificationTypes: string[] = ['PRAZO', 'PRIORIDADE', 'REGULATION_PENDING', 'SCHEDULE_REMINDER', 'AGENDAMENTO']
    for (let i = 0; i < 15; i++) {
      const reg = randomElement(regulations)
      const citizen = citizens.find(c => c.id === reg.citizenId)
      await prisma.notification.create({
        data: {
          subscriberId: subscriber.id,
          userId: randomElement(cityUsers).id,
          regulationId: reg.id,
          type: randomElement(notificationTypes) as any,
          title: `Regulação ${reg.status} - ${citizen?.name || 'Cidadão'}`,
          message: `A regulação PROT-2026 está com status ${reg.status}. Verifique.`,
          citizenName: citizen?.name,
          priority: randomElement(['ELECTIVE', 'URGENCY', 'EMERGENCY']),
          readAt: Math.random() > 0.5 ? randomDate(new Date('2026-02-01'), new Date()) : null,
        },
      })
    }
    console.log('   ✅ 15 notificações')

    // ─── WhatsApp Config ───
    await prisma.whatsAppConfig.create({
      data: {
        subscriberId: subscriber.id,
        instanceName: `nextsaude-${cityData.city.toLowerCase()}`,
        provider: 'evolution',
        isActive: false,
        apiUrl: 'https://api.evolution.test',
        instanceStatus: 'disconnected',
      },
    })

    // ─── WhatsApp Programmed Templates ───
    const whatsappTemplates = await Promise.all([
      prisma.whatsAppProgrammed.create({
        data: {
          subscriberId: subscriber.id, name: 'Status Aprovado', nameNormalized: normalizeText('Status Aprovado'),
          triggerType: 'STATUS_APPROVED', bodyText: 'Olá {{cidadao.nome}}, sua regulação foi APROVADA. Aguarde contato para agendamento.',
          headerText: 'NextSaude - Regulação Aprovada', footerText: 'Não responda esta mensagem.', isActive: true,
        },
      }),
      prisma.whatsAppProgrammed.create({
        data: {
          subscriberId: subscriber.id, name: 'Status Negado', nameNormalized: normalizeText('Status Negado'),
          triggerType: 'STATUS_DENIED', bodyText: 'Olá {{cidadao.nome}}, infelizmente sua regulação foi NEGADA. Entre em contato com a unidade para mais informações.',
          isActive: true,
        },
      }),
      prisma.whatsAppProgrammed.create({
        data: {
          subscriberId: subscriber.id, name: 'Lembrete 24h', nameNormalized: normalizeText('Lembrete 24h'),
          triggerType: 'SCHEDULE_REMINDER_24H', bodyText: 'Olá {{cidadao.nome}}, lembramos que seu agendamento é amanhã. Compareça com documentos.',
          isActive: true, delayMinutes: 0,
        },
      }),
      prisma.whatsAppProgrammed.create({
        data: {
          subscriberId: subscriber.id, name: 'Lembrete 2h', nameNormalized: normalizeText('Lembrete 2h'),
          triggerType: 'SCHEDULE_REMINDER_2H', bodyText: 'Olá {{cidadao.nome}}, seu agendamento é em 2 horas. Não se atrase!',
          isActive: true, delayMinutes: 0,
        },
      }),
    ])

    // Notification Rules
    for (const tmpl of whatsappTemplates) {
      await prisma.notificationRule.create({
        data: { subscriberId: subscriber.id, triggerEvent: tmpl.triggerType, isActive: true, whatsappProgrammedId: tmpl.id },
      })
    }

    // WhatsApp Notification Preferences
    await prisma.whatsAppNotificationPreference.createMany({
      data: [
        { subscriberId: subscriber.id, triggerType: 'STATUS_APPROVED', state: 'ON', templateId: whatsappTemplates[0].id },
        { subscriberId: subscriber.id, triggerType: 'STATUS_DENIED', state: 'ON', templateId: whatsappTemplates[1].id },
        { subscriberId: subscriber.id, triggerType: 'SCHEDULE_REMINDER_24H', state: 'ON', templateId: whatsappTemplates[2].id },
        { subscriberId: subscriber.id, triggerType: 'SCHEDULE_REMINDER_2H', state: 'ALWAYS_ASK', templateId: whatsappTemplates[3].id },
        { subscriberId: subscriber.id, triggerType: 'STATUS_PENDING', state: 'OFF' },
      ],
    })
    console.log('   ✅ WhatsApp config + 4 templates + regras + preferências')

    // ─── Notification Configs ───
    const eventTypes = [
      'REGULATION_CREATED', 'REGULATION_STATUS_APPROVED', 'REGULATION_STATUS_DENIED',
      'REGULATION_DEADLINE_WARNING', 'SCHEDULE_CREATED', 'SCHEDULE_REMINDER',
      'CITIZEN_CREATED', 'EMPLOYMENT_INVITED',
    ] as const
    for (const evt of eventTypes) {
      await prisma.notificationConfig.create({
        data: {
          subscriberId: subscriber.id, eventType: evt, isActive: true,
          sendInApp: true, sendEmail: evt.includes('DEADLINE') || evt.includes('APPROVED'),
          sendWhatsApp: evt.includes('APPROVED') || evt.includes('DENIED') || evt.includes('REMINDER'),
          inAppTitle: `Evento: ${evt}`,
          inAppMessage: `Notificação automática do evento ${evt}`,
          recipientType: evt.includes('EMPLOYMENT') ? 'ALL_ADMINS' : 'REGULATION_OWNER',
        },
      })
    }
    console.log('   ✅ 8 configurações de notificação')

    // ─── Subscription Payments ───
    await prisma.subscriptionPayment.createMany({
      data: [
        { subscriberId: subscriber.id, referenceMonth: new Date('2025-12-01'), dueDate: new Date('2025-12-10'), amount: 2500.00, paidAmount: 2500.00, paidAt: new Date('2025-12-08'), status: 'PAID' },
        { subscriberId: subscriber.id, referenceMonth: new Date('2026-01-01'), dueDate: new Date('2026-01-10'), amount: 2500.00, paidAmount: 2500.00, paidAt: new Date('2026-01-09'), status: 'PAID' },
        { subscriberId: subscriber.id, referenceMonth: new Date('2026-02-01'), dueDate: new Date('2026-02-10'), amount: 2500.00, status: 'PENDING' },
      ],
    })
    console.log('   ✅ 3 pagamentos (Dez, Jan pagos / Fev pendente)')

    // ─── Support Tickets ───
    console.log('   🎫 Criando tickets de suporte...')
    const ticket1 = await prisma.supportTicket.create({
      data: {
        subscriberId: subscriber.id, userId: cityUsers[0].id,
        ticketNumber: `TK-${cityData.stateAcronym}-${randomNumber(1000, 9999)}`,
        category: 'BUG', subject: 'Erro ao gerar relatório de regulações',
        description: 'Ao tentar gerar relatório PDF, o sistema apresenta erro 500.',
        status: 'RESOLVED', priority: 'HIGH', channel: 'WEB',
        contactEmail: cityUsers[0].email, contactName: cityUsers[0].name,
        resolvedAt: new Date('2026-02-05'), resolvedById: kauann.id,
        resolution: 'Corrigido bug na geração de PDF. Atualização aplicada.',
      },
    })
    await prisma.supportTicketMessage.createMany({
      data: [
        { ticketId: ticket1.id, userId: cityUsers[0].id, message: 'O relatório dá erro quando seleciono mais de 50 regulações.', isFromUser: true },
        { ticketId: ticket1.id, userId: kauann.id, message: 'Identificamos o problema. Estava relacionado ao limite de memória no servidor. Correção aplicada.', isFromUser: false, isInternal: false },
      ],
    })

    const ticket2 = await prisma.supportTicket.create({
      data: {
        subscriberId: subscriber.id, userId: cityUsers[3].id,
        ticketNumber: `TK-${cityData.stateAcronym}-${randomNumber(1000, 9999)}`,
        category: 'QUESTION', subject: 'Como cadastrar novo fornecedor?',
        description: 'Preciso adicionar um novo fornecedor de exames. Não encontro a opção.',
        status: 'OPEN', priority: 'NORMAL', channel: 'WEB',
        contactEmail: cityUsers[3].email, contactName: cityUsers[3].name,
      },
    })
    await prisma.supportTicketMessage.create({
      data: { ticketId: ticket2.id, userId: cityUsers[3].id, message: 'Já procurei no menu de configurações mas não achei.', isFromUser: true },
    })
    console.log('   ✅ 2 tickets com mensagens')

    // ─── Audit Logs ───
    console.log('   📝 Criando logs de auditoria...')
    const auditActions = [
      { action: 'LOGIN' as const, objectType: 'User', detail: { method: 'email_password' } },
      { action: 'CREATE' as const, objectType: 'Regulation', detail: { status: 'PENDING' } },
      { action: 'UPDATE' as const, objectType: 'Regulation', detail: { field: 'status', from: 'PENDING', to: 'APPROVED' } },
      { action: 'CREATE' as const, objectType: 'Citizen', detail: { source: 'manual' } },
      { action: 'PRINT' as const, objectType: 'Regulation', detail: { template: 'Laudo Médico Padrão' } },
      { action: 'EXPORT' as const, objectType: 'Report', detail: { type: 'REGULATIONS', format: 'PDF' } },
      { action: 'CREATE' as const, objectType: 'Schedule', detail: { status: 'SCHEDULED' } },
      { action: 'VIEW' as const, objectType: 'Citizen', detail: { section: 'profile' } },
    ]
    for (let i = 0; i < 20; i++) {
      const auditItem = randomElement(auditActions)
      await prisma.auditLog.create({
        data: {
          subscriberId: subscriber.id,
          actorId: randomElement(cityUsers).id,
          objectType: auditItem.objectType,
          objectId: randomNumber(1, 100),
          action: auditItem.action,
          detail: auditItem.detail,
          occurredAt: randomDate(new Date('2026-01-01'), new Date()),
        },
      })
    }
    console.log('   ✅ 20 logs de auditoria')
  }

  // ==========================================================================
  // RESUMO FINAL
  // ==========================================================================

  console.log('\n' + '='.repeat(60))
  console.log('✨ SEED COMPLETO!')
  console.log('='.repeat(60))
  console.log('\n📊 RESUMO:')
  console.log(`   📍 Assinantes: ${allSubscribers.length} (${allSubscribers.map(s => s.city).join(', ')})`)
  console.log(`   👤 System Managers: 2 (Kauann Jacome + Admin)`)
  console.log(`   👥 Usuários por assinante: 5 (1 admin, 2 médicos, 2 digitadores)`)
  console.log(`   🏥 Unidades por assinante: 4`)
  console.log(`   📦 Fornecedores por assinante: 3`)
  console.log(`   💊 Procedimentos por assinante: ~69`)
  console.log(`   🏥 Cidadãos por assinante: 150 (cidade = nome do assinante)`)
  console.log(`   📂 Pastas por assinante: 4`)
  console.log(`   📋 Regulações por assinante: 30`)
  console.log(`   📅 Agendamentos: variável (regulações aprovadas/agendadas)`)
  console.log(`   🔔 Notificações por assinante: 15`)
  console.log(`   📜 Termos de Uso: 1 (ativo)`)
  console.log(`   ⚙️  Configs do sistema: 8`)
  console.log(`   🔄 Rotinas: 3 + 4 execuções`)
  console.log(`   💾 Backups: 4`)
  console.log(`   📄 Modelos de documento: 4 por assinante`)
  console.log(`   💳 Pagamentos: 3 por assinante`)
  console.log(`   🎫 Tickets de suporte: 2 por assinante`)
  console.log(`   📝 Logs de auditoria: 20 por assinante`)
  console.log(`   📱 WhatsApp: config + 4 templates + regras por assinante`)
  console.log(`   🔧 Notif. configs: 8 por assinante`)

  // ─── Gerar arquivo .txt com credenciais ───
  credentialLines.push('='.repeat(60))
  credentialLines.push('')
  credentialLines.push('NOTA: Todas as senhas de usuários tenant são "senha123"')
  credentialLines.push('      A senha do system manager (Kauann) é "123456"')
  credentialLines.push('')
  credentialLines.push('─── ASSINANTES CRIADOS ───')
  credentialLines.push('')
  for (const sub of allSubscribers) {
    credentialLines.push(`  ID: ${sub.id} | ${sub.name} | Cidade: ${sub.city}`)
  }
  credentialLines.push('')
  credentialLines.push('='.repeat(60))

  const credentialsPath = path.join(process.cwd(), 'prisma', 'credenciais.txt')
  fs.writeFileSync(credentialsPath, credentialLines.join('\n'), 'utf-8')
  console.log(`\n📄 Credenciais salvas em: ${credentialsPath}`)

  console.log('\n🔐 Credenciais salvas no arquivo credenciais.txt')
  console.log('   Consulte o arquivo para detalhes de acesso')
  console.log('\n' + '='.repeat(60))
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
