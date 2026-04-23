import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils';
import { formatTerbilangRupiah } from '../terbilang';

export function generateReimbursementExcel(reimbursement: any) {
  const profile = reimbursement.profiles;
  const items = reimbursement.reimbursement_items || [];

  // --- SHEET 1: REKAP REIMBURSEMENT ---
  
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
    ["Catatan User", reimbursement.notes || '-'],
    ["Catatan Admin", reimbursement.admin_notes || '-'],
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
    item.amount
  ]);

  // 3. Create Footer Data
  const footerData = [
    ["", "", "", "", "TOTAL", reimbursement.total_amount],
    ["Terbilang:", formatTerbilangRupiah(reimbursement.total_amount)],
    [""],
    [""],
    ["Tanda Tangan Pengaju", "", "", "Tanda Tangan Approver"],
    [""],
    [""],
    ["( " + (profile?.full_name || "Karyawan") + " )", "", "", "( ____________________ )"]
  ];

  // 4. Combine all data for Sheet 1
  const finalDataSheet1 = [
    ...headerData,
    itemsHeader,
    ...itemsData,
    ...footerData
  ];

  // --- SHEET 2: SUMMARY PER KATEGORI ---
  
  const categorySummary: Record<string, number> = {};
  items.forEach((item: any) => {
    const catName = item.categories?.name || 'Lain-lain';
    categorySummary[catName] = (categorySummary[catName] || 0) + (Number(item.amount) || 0);
  });

  const summaryHeader = ["Kategori", "Total (IDR)", "% Dari Total"];
  const summaryData = Object.entries(categorySummary).map(([cat, total]) => [
    cat,
    total,
    ((total / reimbursement.total_amount) * 100).toFixed(2) + "%"
  ]);

  const finalDataSheet2 = [
    ["SUMMARY PENGELUARAN PER KATEGORI"],
    ["Periode:", reimbursement.period],
    [""],
    summaryHeader,
    ...summaryData,
    [""],
    ["GRAND TOTAL", reimbursement.total_amount, "100%"]
  ];

  // 5. Create Worksheet & Workbook
  const wb = XLSX.utils.book_new();
  
  const ws1 = XLSX.utils.aoa_to_sheet(finalDataSheet1);
  const ws2 = XLSX.utils.aoa_to_sheet(finalDataSheet2);

  // Styling & Column Widths for Sheet 1
  ws1['!cols'] = [
    { wch: 5 },  // A (No)
    { wch: 15 }, // B
    { wch: 20 }, // C
    { wch: 20 }, // D
    { wch: 40 }, // E
    { wch: 15 }  // F
  ];

  // Column Widths for Sheet 2
  ws2['!cols'] = [
    { wch: 25 }, // A (Kategori)
    { wch: 20 }, // B (Total)
    { wch: 15 }  // C (%)
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Rekap Reimbursement");
  XLSX.utils.book_append_sheet(wb, ws2, "Summary Kategori");

  // Generate filename
  const fileName = `Reimbursement_${profile?.full_name?.replace(/\s+/g, '_') || 'Karyawan'}_${reimbursement.period.replace(/\s+/g, '')}.xlsx`;

  // Trigger Download
  XLSX.writeFile(wb, fileName);
}
