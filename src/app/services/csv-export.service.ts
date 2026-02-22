import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface CsvColumn {
    header: string;
    key: string;
    transform?: (value: any, row: any) => string;
}

@Injectable({
    providedIn: 'root'
})
export class CsvExportService {

    /**
     * Export data to CSV file
     * @param data - Array of data objects
     * @param columns - Column definitions with headers and keys
     * @param fileName - Name of the exported file (without extension)
     */
    exportToCSV(data: any[], columns: CsvColumn[], fileName: string): void {
        if (!data || data.length === 0) {
            alert('ไม่มีข้อมูลสำหรับ Export');
            return;
        }

        // Map data to export format
        const exportData = data.map(row => {
            const obj: any = {};
            columns.forEach(col => {
                if (col.transform) {
                    obj[col.header] = col.transform(row[col.key], row);
                } else {
                    obj[col.header] = row[col.key] ?? '-';
                }
            });
            return obj;
        });

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // Generate filename with date
        const date = new Date();
        const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        const fullFileName = `${fileName}_${dateStr}.csv`;

        // Write file with BOM for Thai language support
        XLSX.writeFile(workbook, fullFileName, { bookType: 'csv' });
    }
}
