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
      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Ekstrak informasi dari struk/nota ini dalam format JSON.
Ekstrak data sebagai sebuah array bernama 'items'.
Jika ada banyak barang dalam satu nota, buatkan setiap barang menjadi satu objek di dalam array 'items'.

Untuk setiap item ekstrak:
1. date (format YYYY-MM-DD, jika tidak ada gunakan tanggal hari ini, samakan untuk semua item di nota yang sama)
2. description (nama barang yang dibeli atau keperluan)
3. category (pilih salah satu: 'ATK', 'Air Minum', 'Transportasi', 'Konsumsi', atau 'Lain-lain')
4. vendor (nama toko/merchant, samakan untuk semua item di nota yang sama)
5. amount (harga total untuk item tersebut dalam angka saja tanpa pemisah ribuan)

Format output HANYA JSON seperti ini:
{
  "items": [
    { "date": "2024-01-01", "description": "...", "category": "...", "vendor": "...", "amount": 10000 }
  ]
}`
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
        temperature: 0.1,
        max_completion_tokens: 2048,
      })

      const rawContent = response.choices[0]?.message?.content || "{}"
      console.log("Groq raw response length:", rawContent.length)

      // Strip <think>...</think> tags if present (Qwen thinking mode)
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
