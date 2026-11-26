import { Response } from 'express';
import * as ExcelJS from 'exceljs';

export interface SheetSpec {
  name: string;
  columns: { header: string; key: string; width?: number; numFmt?: string }[];
  rows: Record<string, unknown>[];
}

/** Streams an .xlsx file with one or more sheets (header row styled in brand green). */
export async function sendExcel(res: Response, filename: string, sheets: SheetSpec[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NUTRIO Admin';
  wb.created = new Date();
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name.slice(0, 31));
    ws.columns = s.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18, style: c.numFmt ? { numFmt: c.numFmt } : undefined }));
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5D3A' } };
    ws.addRows(s.rows);
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

export const VND = '#,##0" ₫"';
