import { Injectable } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfmake = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const vfsFonts = require('pdfmake/build/vfs_fonts');

// Load fonts into pdfmake's virtual file system (run once at module load)
Object.keys(vfsFonts).forEach((key: string) => {
  pdfmake.virtualfs.writeFileSync(key, Buffer.from(vfsFonts[key], 'base64'));
});

pdfmake.addFonts({
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
});

@Injectable()
export class PdfService {
  async generate(docDefinition: any): Promise<Buffer> {
    const doc = pdfmake.createPdf({
      ...docDefinition,
      defaultStyle: { font: 'Roboto', ...(docDefinition.defaultStyle ?? {}) },
    });
    return doc.getBuffer();
  }

  formatIDR(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  headerStyle() {
    return { fontSize: 10, bold: true, fillColor: '#1e40af', color: '#ffffff', margin: [4, 4, 4, 4] };
  }

  cellStyle() {
    return { fontSize: 9, margin: [4, 3, 4, 3] };
  }

  pageMargins(): [number, number, number, number] {
    return [40, 40, 40, 60];
  }

  footerFn(companyName = 'DEC') {
    return (currentPage: number, pageCount: number) => ({
      text: `${companyName} — Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      margin: [0, 10, 0, 0],
      color: '#6b7280',
    });
  }
}
