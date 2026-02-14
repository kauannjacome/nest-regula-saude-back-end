import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

// ── Constants ────────────────────────────────────────────────────────

type ImportType = 'CITIZENS' | 'PROFESSIONALS' | 'UNITS';

const IMPORT_TAB_CONFIG: Record<ImportType, { label: string; templateFileName: string }> = {
  CITIZENS: { label: 'Cidadaos', templateFileName: 'template_cidadaos.xlsx' },
  PROFESSIONALS: { label: 'Profissionais', templateFileName: 'template_profissionais.xlsx' },
  UNITS: { label: 'Unidades', templateFileName: 'template_unidades.xlsx' },
};

const IMPORT_COLUMNS: Record<ImportType, string[]> = {
  CITIZENS: ['nome', 'cpf', 'data_nascimento', 'sexo', 'telefone', 'email', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'nome_mae'],
  PROFESSIONALS: ['nome', 'cpf', 'email', 'telefone', 'cargo', 'conselho', 'numero_conselho', 'uf_conselho'],
  UNITS: ['nome', 'tipo', 'cnes', 'telefone', 'email', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado'],
};

const COLUMN_NAMES: Record<string, string> = {
  nome: 'Nome *', cpf: 'CPF *', data_nascimento: 'Data Nascimento *', sexo: 'Sexo *',
  telefone: 'Telefone', email: 'E-mail', cep: 'CEP', logradouro: 'Logradouro',
  numero: 'Numero', complemento: 'Complemento', bairro: 'Bairro', cidade: 'Cidade',
  estado: 'Estado', nome_mae: 'Nome da Mae', cargo: 'Cargo', conselho: 'Conselho',
  numero_conselho: 'Numero Conselho', uf_conselho: 'UF Conselho', tipo: 'Tipo', cnes: 'CNES',
};

const COLUMN_WIDTHS: Record<string, number> = {
  nome: 35, cpf: 18, data_nascimento: 18, sexo: 12, telefone: 18, email: 30,
  cep: 12, logradouro: 40, numero: 10, complemento: 20, bairro: 20, cidade: 20,
  estado: 10, nome_mae: 35, cargo: 20, conselho: 12, numero_conselho: 18,
  uf_conselho: 12, tipo: 15, cnes: 15,
};

const COLUMN_ALIASES: Record<string, string[]> = {
  nome: ['nome', 'name', 'nome_completo', 'razao_social'],
  cpf: ['cpf', 'documento', 'cpf_cnpj'],
  data_nascimento: ['data_nascimento', 'nascimento', 'dt_nascimento', 'birth_date'],
  sexo: ['sexo', 'genero', 'sex', 'gender'],
  telefone: ['telefone', 'phone', 'tel', 'celular', 'fone'],
  email: ['email', 'e_mail', 'e-mail'],
  cep: ['cep', 'codigo_postal', 'zip', 'postal_code'],
  logradouro: ['logradouro', 'endereco', 'rua', 'address', 'street'],
  numero: ['numero', 'num', 'number', 'nro'],
  complemento: ['complemento', 'compl', 'complement'],
  bairro: ['bairro', 'neighborhood'],
  cidade: ['cidade', 'municipio', 'city'],
  estado: ['estado', 'uf', 'state'],
  nome_mae: ['nome_mae', 'mae', 'mother', 'nome_da_mae'],
  cargo: ['cargo', 'funcao', 'position', 'role'],
  conselho: ['conselho', 'council', 'tipo_conselho'],
  numero_conselho: ['numero_conselho', 'registro', 'crm', 'coren', 'crf'],
  uf_conselho: ['uf_conselho', 'uf_registro', 'estado_conselho'],
  tipo: ['tipo', 'type', 'categoria'],
  cnes: ['cnes', 'codigo_cnes'],
};

// ── Helpers ──────────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function normalizeSex(value: string): string {
  const n = value.toUpperCase();
  if (['M', 'MASCULINO', 'MALE'].includes(n)) return 'MALE';
  if (['F', 'FEMININO', 'FEMALE'].includes(n)) return 'FEMALE';
  return 'NOT_INFORMED';
}

function parseBirthDate(dateStr: string): Date {
  // DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const d = new Date(parseInt(brMatch[3]), parseInt(brMatch[2]) - 1, parseInt(brMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }
  // YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }
  throw new Error('Data invalida');
}

function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned.charAt(i)) * (10 - i);
  let remainder = 11 - (sum % 11);
  if (remainder >= 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned.charAt(i)) * (11 - i);
  remainder = 11 - (sum % 11);
  if (remainder >= 10) remainder = 0;
  return remainder === parseInt(cleaned.charAt(10));
}

export interface RowValidationResult {
  rowIndex: number;
  isValid: boolean;
  data?: Record<string, any>;
  errors?: Array<{ field: string; message: string }>;
}

function validateImportRows(rows: Record<string, any>[], type: ImportType) {
  const results: RowValidationResult[] = [];
  let validRows = 0;
  let invalidRows = 0;

  rows.forEach((row, index) => {
    const errors: Array<{ field: string; message: string }> = [];
    const data: Record<string, any> = {};

    // Common: nome
    const nome = String(row.nome || '').trim();
    if (nome.length < 3) errors.push({ field: 'nome', message: 'Nome deve ter no minimo 3 caracteres' });
    else data.nome = nome;

    if (type === 'CITIZENS' || type === 'PROFESSIONALS') {
      // CPF validation
      const cpf = String(row.cpf || '').replace(/\D/g, '');
      if (cpf.length !== 11) errors.push({ field: 'cpf', message: 'CPF deve ter 11 digitos' });
      else if (!validateCPF(cpf)) errors.push({ field: 'cpf', message: 'CPF invalido' });
      else data.cpf = cpf;
    }

    if (type === 'CITIZENS') {
      // Birth date
      const birthStr = String(row.data_nascimento || '');
      try { data.data_nascimento = parseBirthDate(birthStr); } catch { errors.push({ field: 'data_nascimento', message: 'Data de nascimento invalida' }); }

      // Sex
      const sexo = String(row.sexo || '').toUpperCase();
      if (!['M', 'F', 'MASCULINO', 'FEMININO', 'MALE', 'FEMALE'].includes(sexo)) {
        errors.push({ field: 'sexo', message: 'Sexo invalido' });
      } else {
        data.sexo = sexo;
      }
    }

    if (type === 'PROFESSIONALS') {
      const email = String(row.email || '');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ field: 'email', message: 'Email invalido' });
      } else {
        data.email = email;
      }
    }

    // Copy optional fields
    const optionalFields = ['telefone', 'email', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'nome_mae', 'cargo', 'conselho', 'numero_conselho', 'uf_conselho', 'tipo', 'cnes'];
    for (const field of optionalFields) {
      if (row[field] !== undefined && !data[field]) {
        data[field] = String(row[field] || '');
      }
    }

    if (errors.length > 0) {
      invalidRows++;
      results.push({ rowIndex: index + 1, isValid: false, errors });
    } else {
      validRows++;
      results.push({ rowIndex: index + 1, isValid: true, data });
    }
  });

  return { isValid: invalidRows === 0, totalRows: rows.length, validRows, invalidRows, results };
}

function mapColumns(headers: string[], expectedColumns: string[]): Record<string, number> {
  const columnMap: Record<string, number> = {};
  for (const col of expectedColumns) {
    const possibleNames = COLUMN_ALIASES[col] || [col];
    let foundIndex = -1;
    for (const name of possibleNames) {
      const idx = headers.findIndex(h => h === name || h.includes(name));
      if (idx !== -1) { foundIndex = idx; break; }
    }
    columnMap[col] = foundIndex;
  }
  return columnMap;
}

function parseCSVContent(content: string, importType: ImportType): Record<string, any>[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h =>
    h.trim().toLowerCase().replace(/"/g, '').replace(/\s+/g, '_')
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  );

  const columnMap = mapColumns(headers, IMPORT_COLUMNS[importType]);
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], separator);
    if (values.length === 0) continue;
    const row: Record<string, any> = {};
    for (const [col, idx] of Object.entries(columnMap)) {
      row[col] = idx !== -1 && values[idx] !== undefined ? values[idx].replace(/"/g, '').trim() : '';
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === separator && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}

function parseExcelWorksheet(worksheet: ExcelJS.Worksheet, importType: ImportType): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value || '').trim().toLowerCase()
      .replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  });

  const columnMap = mapColumns(headers, IMPORT_COLUMNS[importType]);

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: Record<string, any> = {};
    for (const [col, idx] of Object.entries(columnMap)) {
      if (idx !== -1) {
        const cell = row.getCell(idx + 1);
        if (cell.value instanceof Date) {
          const d = cell.value;
          rowData[col] = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } else {
          rowData[col] = cell.value != null ? String(cell.value).trim() : '';
        }
      } else {
        rowData[col] = '';
      }
    }
    rows.push(rowData);
  });
  return rows;
}

// ── Service ──────────────────────────────────────────────────────────

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string) {
    return this.prisma.userOnboarding.findFirst({ where: { userId } });
  }

  async updateStep(userId: string, data: any) {
    const existing = await this.prisma.userOnboarding.findFirst({ where: { userId } });
    if (existing) {
      return this.prisma.userOnboarding.update({ where: { id: existing.id }, data });
    }
    return this.prisma.userOnboarding.create({ data: { ...data, userId } });
  }

  // ── Template Download ──────────────────────────────────────────────

  async generateTemplate(type: string): Promise<{ buffer: Buffer; fileName: string }> {
    const importType = type.toUpperCase() as ImportType;
    if (!['CITIZENS', 'PROFESSIONALS', 'UNITS'].includes(importType)) {
      throw new BadRequestException('Tipo de template invalido');
    }

    const config = IMPORT_TAB_CONFIG[importType];
    const columns = IMPORT_COLUMNS[importType];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NextSaude';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Dados');

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      },
    };

    const headerRow = worksheet.addRow(columns.map(c => COLUMN_NAMES[c] || c));
    headerRow.height = 25;
    headerRow.eachCell(cell => { cell.style = headerStyle; });

    // Example data
    const exampleData = this.getExampleData(importType);
    exampleData.forEach(row => {
      const dataRow = worksheet.addRow(columns.map(c => row[c] || ''));
      dataRow.eachCell(cell => {
        cell.style = {
          border: {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' },
          },
        };
      });
    });

    columns.forEach((col, idx) => {
      worksheet.getColumn(idx + 1).width = COLUMN_WIDTHS[col] || 15;
    });

    // Instructions sheet
    const instrSheet = workbook.addWorksheet('Instrucoes');
    instrSheet.addRow(['INSTRUCOES PARA PREENCHIMENTO']);
    instrSheet.getRow(1).font = { bold: true, size: 14 };
    instrSheet.addRow([]);
    instrSheet.addRow(['1. Nao altere o nome das colunas na planilha "Dados"']);
    instrSheet.addRow(['2. Preencha os dados a partir da linha 2']);
    instrSheet.addRow(['3. Campos obrigatorios estao marcados com *']);
    instrSheet.getColumn(1).width = 80;

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { buffer, fileName: config.templateFileName };
  }

  // ── Validate Import ────────────────────────────────────────────────

  async validateImport(file: Express.Multer.File, importType: string) {
    const type = importType.toUpperCase() as ImportType;
    if (!['CITIZENS', 'PROFESSIONALS', 'UNITS'].includes(type)) {
      throw new BadRequestException('Tipo de importacao invalido');
    }

    if (!file) {
      throw new BadRequestException('Arquivo e obrigatorio');
    }

    let rows: Record<string, any>[] = [];

    try {
      if (file.originalname.endsWith('.csv')) {
        const content = file.buffer.toString('utf-8');
        rows = parseCSVContent(content, type);
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer as any);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new BadRequestException('Planilha vazia ou invalida');
        rows = parseExcelWorksheet(worksheet, type);
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Erro ao ler arquivo: formato invalido');
    }

    if (rows.length === 0) {
      throw new BadRequestException('Arquivo sem dados para importar');
    }

    const validation = validateImportRows(rows, type);

    return {
      fileName: file.originalname,
      importType: type,
      totalRows: validation.totalRows,
      validRows: validation.validRows,
      invalidRows: validation.invalidRows,
      isValid: validation.isValid,
      preview: validation.results.slice(0, 10),
      errors: validation.results.filter(r => !r.isValid).slice(0, 50),
    };
  }

  // ── Process Import ─────────────────────────────────────────────────

  async processImport(file: Express.Multer.File, importType: string, subscriberId: number, userId: string) {
    const type = importType.toUpperCase() as ImportType;
    if (!['CITIZENS', 'PROFESSIONALS', 'UNITS'].includes(type)) {
      throw new BadRequestException('Tipo de importacao invalido');
    }

    if (!file) {
      throw new BadRequestException('Arquivo e obrigatorio');
    }

    let rows: Record<string, any>[] = [];

    try {
      if (file.originalname.endsWith('.csv')) {
        const content = file.buffer.toString('utf-8');
        rows = parseCSVContent(content, type);
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer as any);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new BadRequestException('Planilha vazia ou invalida');
        rows = parseExcelWorksheet(worksheet, type);
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Erro ao ler arquivo: formato invalido');
    }

    if (rows.length === 0) {
      throw new BadRequestException('Arquivo sem dados para importar');
    }

    const validation = validateImportRows(rows, type);
    const validRows = validation.results.filter(r => r.isValid && r.data);

    let successCount = 0;
    let errorCount = 0;
    const processingErrors: Array<{ row: number; error: string }> = [];

    for (const row of validRows) {
      try {
        if (!row.data) continue;
        switch (type) {
          case 'CITIZENS': await this.createCitizen(row.data, subscriberId); break;
          case 'PROFESSIONALS': await this.createProfessional(row.data, subscriberId); break;
          case 'UNITS': await this.createUnit(row.data, subscriberId); break;
        }
        successCount++;
      } catch (err) {
        errorCount++;
        processingErrors.push({
          row: row.rowIndex,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      }
    }

    // Log import
    await this.prisma.onboardingImportLog.create({
      data: {
        subscriberId,
        userId,
        importType: type,
        fileName: file.originalname,
        totalRows: validation.totalRows,
        successRows: successCount,
        errorRows: validation.invalidRows + errorCount,
        errors: {
          validation: validation.results.filter(r => !r.isValid).map(r => ({ row: r.rowIndex, errors: r.errors })),
          processing: processingErrors,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return {
      importType: type,
      fileName: file.originalname,
      totalRows: validation.totalRows,
      successRows: successCount,
      errorRows: validation.invalidRows + errorCount,
      validationErrors: validation.invalidRows,
      processingErrors: errorCount,
    };
  }

  // ── Create helpers ─────────────────────────────────────────────────

  private async createCitizen(data: Record<string, any>, subscriberId: number) {
    const cpf = String(data.cpf || '').replace(/\D/g, '');
    const existing = await this.prisma.citizen.findFirst({
      where: { subscriberId, cpf, deletedAt: null },
    });
    if (existing) throw new Error(`CPF ${cpf} ja cadastrado`);

    const name = String(data.nome || '');
    await this.prisma.citizen.create({
      data: {
        subscriberId,
        cpf,
        name,
        nameNormalized: normalizeName(name),
        birthDate: parseBirthDate(String(data.data_nascimento || '')),
        sex: normalizeSex(String(data.sexo || '')) as any,
        phone: String(data.telefone || '') || null,
        email: String(data.email || '') || null,
        postalCode: String(data.cep || '') || null,
        address: String(data.logradouro || '') || null,
        number: String(data.numero || '') || null,
        complement: String(data.complemento || '') || null,
        neighborhood: String(data.bairro || '') || null,
        city: String(data.cidade || '') || null,
        state: String(data.estado || '') || null,
        motherName: String(data.nome_mae || '') || null,
      },
    });
  }

  private async createProfessional(data: Record<string, any>, subscriberId: number) {
    const cpf = String(data.cpf || '').replace(/\D/g, '');
    const email = String(data.email || '');

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ cpf }, { email }], deletedAt: null },
    });

    if (existingUser) {
      const existingEmployment = await this.prisma.userEmployment.findFirst({
        where: { userId: existingUser.id, subscriberId },
      });
      if (existingEmployment) throw new Error(`Profissional com CPF ${cpf} ja vinculado`);

      await this.prisma.userEmployment.create({
        data: { userId: existingUser.id, subscriberId, isActive: true, isPrimary: false },
      });
      return;
    }

    const name = String(data.nome || '');
    const user = await this.prisma.user.create({
      data: {
        cpf,
        email,
        name,
        nameNormalized: normalizeName(name),
        phoneNumber: String(data.telefone || '') || null,
        position: String(data.cargo || '') || null,
        registryType: String(data.conselho || '') || null,
        registryNumber: String(data.numero_conselho || '') || null,
        registryState: String(data.uf_conselho || '') || null,
        isPasswordTemp: true,
      },
    });

    await this.prisma.userEmployment.create({
      data: { userId: user.id, subscriberId, isActive: true, isPrimary: true },
    });
  }

  private async createUnit(data: Record<string, any>, subscriberId: number) {
    const name = String(data.nome || '');
    const existing = await this.prisma.unit.findFirst({
      where: { subscriberId, nameNormalized: normalizeName(name), deletedAt: null },
    });
    if (existing) throw new Error(`Unidade "${name}" ja cadastrada`);

    await this.prisma.unit.create({
      data: {
        subscriberId,
        name,
        nameNormalized: normalizeName(name),
        type: String(data.tipo || 'Outro'),
        cnes: String(data.cnes || '') || null,
        phone: String(data.telefone || '') || null,
        email: String(data.email || '') || null,
        postalCode: String(data.cep || '') || null,
        address: String(data.logradouro || '') || null,
        number: String(data.numero || '') || null,
        complement: String(data.complemento || '') || null,
        neighborhood: String(data.bairro || '') || null,
        city: String(data.cidade || '') || null,
        state: String(data.estado || '') || null,
      },
    });
  }

  // ── Example Data ───────────────────────────────────────────────────

  private getExampleData(type: ImportType): Record<string, string>[] {
    switch (type) {
      case 'CITIZENS':
        return [
          { nome: 'Maria da Silva Santos', cpf: '123.456.789-00', data_nascimento: '15/03/1990', sexo: 'F', telefone: '(11) 99999-8888', email: 'maria@email.com', cep: '01310-100', logradouro: 'Avenida Paulista', numero: '1000', complemento: 'Apto 101', bairro: 'Bela Vista', cidade: 'Sao Paulo', estado: 'SP', nome_mae: 'Ana Maria da Silva' },
          { nome: 'Joao Pedro Oliveira', cpf: '987.654.321-00', data_nascimento: '22/07/1985', sexo: 'M', telefone: '(21) 98888-7777', email: 'joao@email.com', cep: '20040-020', logradouro: 'Rua do Ouvidor', numero: '50', complemento: '', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ', nome_mae: 'Teresa Oliveira' },
        ];
      case 'PROFESSIONALS':
        return [
          { nome: 'Dr. Carlos Eduardo Lima', cpf: '111.222.333-44', email: 'carlos@hospital.com', telefone: '(11) 99999-1111', cargo: 'Medico', conselho: 'CRM', numero_conselho: '123456', uf_conselho: 'SP' },
          { nome: 'Enf. Fernanda Costa', cpf: '555.666.777-88', email: 'fernanda@ubs.gov.br', telefone: '(21) 98888-2222', cargo: 'Enfermeira', conselho: 'COREN', numero_conselho: '789012', uf_conselho: 'RJ' },
        ];
      case 'UNITS':
        return [
          { nome: 'UBS Centro', tipo: 'UBS', cnes: '1234567', telefone: '(11) 3333-4444', email: 'ubs.centro@municipio.gov.br', cep: '01310-100', logradouro: 'Rua da Saude', numero: '100', complemento: '', bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP' },
          { nome: 'Hospital Municipal', tipo: 'Hospital', cnes: '7654321', telefone: '(11) 4444-5555', email: 'hospital@municipio.gov.br', cep: '01311-200', logradouro: 'Avenida Principal', numero: '500', complemento: '', bairro: 'Jardins', cidade: 'Sao Paulo', estado: 'SP' },
        ];
      default:
        return [];
    }
  }
}
