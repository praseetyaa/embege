import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils';

export function generateReimbursementExcel(reimbursement: any) {
  const profile = reimbursement.profiles;
  const items = reimbursement.reimbursement_items || [];

  // 1. Create Data Array for the main header info
  const headerData = [
    ["FORMULIR PENGAJUAN REIMBURSEMENT"],
    [""],
    ["ID Pengajuan", `#${reimbursement.id.substring(0, 8).toUpperCase()}`],
    ["Nama Karyawan", profile?.full_name || '-'],
    ["Departemen", profile?.department || '-'],
    ["Email", profile?.email || '-'],
    ["Periode", reimbursement.period],
    ["Tanggal Pengajuan", new Date(reimbursement.created_at).toLocaleDateString('id-ID')],
    ["Status", reimbursement.status.toUpperCase()],
    ["Rekening Bank", `${profile?.bank_name || '-'} - ${profile?.bank_account || '-'}`],
    ["Catatan", reimbursement.notes || '-'],
    [""],
    ["RINCIAN PENGELUARAN"],
  ];

  // 2. Create Data Array for items
  const itemsHeader = ["No", "Tanggal", "Kategori", "Vendor", "Keterangan", "Nominal"];
  const itemsData = items.map((item: any, index: number) => [
    index + 1,
    new Date(item.date).toLocaleDateString('id-ID'),
    item.categories?.name || 'Lain-lain',
    item.vendor || '-',
    item.description,
    item.amount // Keeping as number for Excel summation
  ]);

  // 3. Create Footer Data
  const footerData = [
    ["", "", "", "", "TOTAL", reimbursement.total_amount]
  ];

  // 4. Combine all data
  const finalData = [
    ...headerData,
    itemsHeader,
    ...itemsData,
    ...footerData
  ];

  // 5. Create Worksheet
  const ws = XLSX.utils.aoa_to_sheet(finalData);

  // Styling & Column Widths
  ws['!cols'] = [
    { wch: 5 },  // A (No)
    { wch: 15 }, // B (Tanggal / Headers)
    { wch: 20 }, // C (Kategori / Values)
    { wch: 20 }, // D (Vendor)
    { wch: 40 }, // E (Keterangan)
    { wch: 15 }  // F (Nominal)
  ];

  // Create Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reimbursement");

  // Generate filename
  const fileName = `Reimbursement_${profile?.full_name?.replace(/\s+/g, '_') || 'Karyawan'}_${reimbursement.period.replace(/\s+/g, '')}.xlsx`;

  // Trigger Download (only works in browser)
  XLSX.writeFile(wb, fileName);
}
