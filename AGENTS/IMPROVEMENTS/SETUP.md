# Setup: Excel Template-Based Download

Pendekatan baru: aplikasi mengisi template `FORM_REMBESAN.xlsx` asli
(bukan generate Excel dari nol), sehingga output **100% identik** dengan
yang diterima Finance.

---

## Struktur File

```
embege/
├── templates/
│   └── FORM_REMBESAN.xlsx        ← taruh di sini (template kosong, format asli)
├── src/
│   ├── lib/
│   │   └── terbilang.ts          ← BARU  (copy dari folder ini)
│   ├── app/
│   │   └── api/reimbursements/[id]/
│   │       └── download-xlsx/
│   │           └── route.ts      ← BARU  (copy dari download-xlsx-route.ts)
│   └── components/ui/
│       └── download-excel-button.tsx ← GANTI dengan versi baru
```

---

## Langkah Setup

### 1. Pasang library `xlsx-populate`

```bash
npm install xlsx-populate
npm install --save-dev @types/xlsx-populate   # opsional, jika ada
```

> `xlsx-populate` dipilih karena mempertahankan **semua** formatting Excel
> (border, warna, font, merged cells, number format) dari template asli.
> Library lain seperti `exceljs` kadang merusak formatting saat re-save.

### 2. Siapkan template

Ambil file `FORM_REMBESAN.xlsx` yang **kosong** (hanya kerangka, tanpa data):
- Hapus nilai di sel: `A3, A5, A7, A9, A11, A13, H3, H5, G3:G21, B18, B21, B22, C22, E23`
- Simpan ke: `templates/FORM_REMBESAN.xlsx` (folder `templates/` di root project, sejajar dengan `src/`)

### 3. Copy file

| File di folder ini           | Tujuan di project                                                    |
|------------------------------|----------------------------------------------------------------------|
| `terbilang.ts`               | `src/lib/terbilang.ts`                                              |
| `download-xlsx-route.ts`     | `src/app/api/reimbursements/[id]/download-xlsx/route.ts`            |
| `download-excel-button.tsx`  | `src/components/ui/download-excel-button.tsx` (ganti yang lama)    |

### 4. Deploy ke server

Pastikan folder `templates/` ikut ter-upload ke server:

```bash
# Jika pakai git, tambahkan ke .gitignore BUKAN templates/
git add templates/FORM_REMBESAN.xlsx
git commit -m "add excel template"
git push
```

Lalu di server:
```bash
cd /path/to/embege
git pull
npm install       # install xlsx-populate
pm2 restart embege
```

---

## Cell yang Diisi Otomatis

| Cell   | Isi                                                              |
|--------|------------------------------------------------------------------|
| `A3`   | Tanggal (format `DD.MM.YYYY`, misal `01.07.2026`)               |
| `A5`   | Nama karyawan (uppercase)                                        |
| `A7`   | Departemen (uppercase)                                           |
| `A9`   | `DUAN LONGCHANG` (nama rekening cabang — tetap)                  |
| `A11`  | Bank karyawan (misal `BCA`)                                      |
| `A13`  | Nomor rekening (misal `358 0567 966`)                            |
| `H3`   | `DUAN LONGCHANG` (nama rekening pusat — tetap)                   |
| `H5`   | Bank + nomor rekening (misal `BCA  358 0567 966`)                |
| `G3–G20` | Nominal per kategori sesuai baris yang tepat                   |
| `G21`  | Grand total                                                      |
| `B18`  | Kalimat cost reasons (otomatis dari kategori + periode)          |
| `B21`  | Terbilang (misal `…ENAM RATUS… RIBU… RUPIAH`)                   |
| `B22`  | `Excluding VAT\nRP: [total]`                                     |
| `C22`  | `入账金额：amount AC\nRP: [total]`                               |
| `E23`  | `实付金额ACTUAL PAYMENT\nRP: [total]`                            |

---

## Cara Pakai di Halaman

Tombol `DownloadExcelButton` sudah ter-update dan langsung bisa dipakai
di halaman `history/[id]` dan `admin/submissions/[id]` yang sudah ada — tidak perlu ubah halaman tersebut karena komponen dan prop-nya sama persis.

---

## Notes

- **PDF**: Setelah user download Excel, buka di Excel/LibreOffice → Print → Save as PDF. Ini cara yang paling aman untuk format 100% identik.
- **PDF langsung dari server** (opsional): Bisa gunakan LibreOffice headless di server jika ada:
  ```bash
  # Install LibreOffice di server Ubuntu
  sudo apt install libreoffice
  # Konversi via shell dari dalam route.ts:
  exec(`libreoffice --headless --convert-to pdf file.xlsx --outdir /tmp`)
  ```
  Tapi untuk kebutuhan sekarang, download Excel sudah cukup.
