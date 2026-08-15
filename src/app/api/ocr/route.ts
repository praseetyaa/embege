import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Groq from "groq-sdk"

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file as base64
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64Image = buffer.toString("base64")
    const mimeType = file.type || "image/jpeg"

    // Upload to Supabase Storage first
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file, {
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName)

    // Call Groq Vision API
    try {
      const promptText = `Anda adalah asisten OCR struk/nota pengeluaran/reimbursement berbahasa Indonesia.
Tugas Anda adalah membaca dan mengekstrak semua rincian barang/biaya dari gambar struk/nota ini ke dalam format JSON yang valid.

Aturan Ekstraksi:
1. 'items': Array berisi setiap barang atau biaya yang dibeli.
2. Jika ini adalah nota multi-toko / belanja online (seperti Shopee/Tokopedia/Grab/GoFood dengan beberapa toko):
   - Ekstrak setiap barang dari masing-masing toko.
   - 'vendor': Gunakan nama toko spesifik barang tersebut (misal: "WINGS OFFICIAL SHOP", "TOKO BISMI") atau nama merchant utama.
3. Untuk setiap item:
   - 'date': Format YYYY-MM-DD (jika tidak tertera tanggal di nota, gunakan tanggal hari ini: ${new Date().toISOString().split("T")[0]}).
   - 'description': Nama spesifik produk/barang yang dibeli (sertakan varian/ukuran jika ada).
   - 'category': Pilih satu kategori yang paling tepat dari: 'Konsumsi' (makanan, minuman, kopi, teh, gula, snack), 'Air Minum' (galon, air mineral), 'ATK' (kertas, pulpen, lakban, alat tulis kantor), 'Transportasi' (bensin, parkir, tol, ojek), atau 'Lain-lain'.
   - 'vendor': Nama toko / merchant.
   - 'amount': Total harga untuk barang tersebut (kuantitas x harga satuan) dalam format integer (hanya angka bulat, tanpa tanda titik/koma/Rp).
4. Biaya Layanan / Ongkir Tambahan:
   - Jika ada biaya layanan (misal "Biaya Layanan Rp 1.000") atau ongkos kirim bersih (setelah diskon) yang bernilai lebih dari 0, masukkan juga sebagai item dengan kategori 'Lain-lain' atau 'Transportasi'.
   - Jangan masukkan diskon sebagai item tersendiri.

Wajib mengembalikan JSON murni dengan format persis:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "description": "Nama Barang",
      "category": "Konsumsi",
      "vendor": "Nama Toko",
      "amount": 23400
    }
  ]
}`

      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        reasoning_format: "parsed",
        temperature: 0.1,
        max_completion_tokens: 4096,
      } as any)

      const rawContent = response.choices[0]?.message?.content || "{}"
      console.log("Groq raw response length:", rawContent.length)

      // Strip <think>...</think> tags if present (Qwen thinking mode fallback)
      let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
      // Strip markdown code fences
      cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "").trim()

      // If still not starting with {, try to extract first { ... } block
      if (!cleaned.startsWith("{")) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleaned = jsonMatch[0]
        }
      }

      console.log("Cleaned content to parse:", cleaned.substring(0, 200))

      let parsedData: { items: any[] }
      try {
        parsedData = JSON.parse(cleaned)

        // Ensure it has items array
        if (!parsedData.items || !Array.isArray(parsedData.items)) {
          // If the AI returned a single object, wrap it
          const obj = parsedData as any
          if (obj.description || obj.amount) {
            parsedData = { items: [obj] }
          } else {
            throw new Error("Invalid format: no items array")
          }
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", cleaned.substring(0, 500))
        // Fallback: return empty item so user can fill manually
        parsedData = {
          items: [{
            date: new Date().toISOString().split("T")[0],
            description: "Struk Pembelian",
            category: "Lain-lain",
            vendor: "",
            amount: 0,
          }]
        }
      }

      return NextResponse.json({
        items: parsedData.items,
        receipt_url: publicUrl,
      })

    } catch (visionError: any) {
      console.error("Vision API Error message:", visionError?.message)
      console.error("Vision API Error status:", visionError?.status)
      console.error("Vision API Error detail:", JSON.stringify(visionError?.error ?? {}, null, 2))

      return NextResponse.json({
        items: [{
          date: new Date().toISOString().split("T")[0],
          description: "",
          category: "Lain-lain",
          vendor: "",
          amount: 0,
        }],
        receipt_url: publicUrl,
        error: `OCR failed: ${visionError?.message || "please input manually"}`,
      })
    }

  } catch (error: any) {
    console.error("OCR Route Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
