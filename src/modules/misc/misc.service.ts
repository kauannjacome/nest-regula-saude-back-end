import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MiscService {
  async printPdf(html: string, templateName?: string) {
    if (!html) {
      throw new BadRequestException('HTML e obrigatorio');
    }

    // Return the HTML with styling for client-side PDF generation
    // Server-side PDF generation via puppeteer requires browser binaries
    // which may not be available in all deployment environments
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 1.5cm; }
  body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #333; }
  h1 { font-size: 18px; margin-bottom: 8px; }
  h2 { font-size: 16px; margin-bottom: 6px; }
  h3 { font-size: 14px; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 11px; }
  th { background: #f5f5f5; font-weight: 600; }
  img { max-width: 100%; height: auto; }
  .page-break { page-break-after: always; }
  ul, ol { padding-left: 20px; }
</style>
</head>
<body>${html}</body>
</html>`;

    return {
      html: fullHtml,
      templateName: templateName || 'documento',
    };
  }

  async importDocx(file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('Arquivo e obrigatorio');
    }

    const fileName = file.originalname?.toLowerCase() || '';

    if (fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
      throw new BadRequestException('Formato .doc nao suportado. Converta para .docx');
    }

    if (!fileName.endsWith('.docx')) {
      throw new BadRequestException('Apenas arquivos .docx sao suportados');
    }

    // Validate ZIP magic bytes (DOCX is a ZIP archive)
    const buffer = file.buffer;
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      throw new BadRequestException('Arquivo DOCX invalido');
    }

    try {
      // Dynamic import of mammoth for DOCX conversion
      const mammoth = await import('mammoth');
      const result = await mammoth.convertToHtml(
        { buffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "b => strong",
            "i => em",
            "table => table.docx-table",
          ],
        },
      );

      return {
        success: true,
        data: {
          html: result.value,
          messages: result.messages,
        },
      };
    } catch (err: any) {
      throw new BadRequestException(`Erro ao converter DOCX: ${err?.message || 'erro desconhecido'}`);
    }
  }
}
