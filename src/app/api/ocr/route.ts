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
    const mimeType = file.type

    // Upload to Supabase Storage first
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`
    const { data: uploadData, error: uploadError } = await supabase.storage
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
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Ekstrak informasi dari struk/nota ini dalam format JSON. Ekstrak data sebagai sebuah array bernama 'items'. Jika ada banyak barang yang dibeli di dalam satu nota, buatkan setiap barang menjadi satu objek di dalam array 'items'.\n\nUntuk setiap item ekstrak:\n1. date (format YYYY-MM-DD, jika tidak ada gunakan tanggal hari ini, samakan untuk semua item di nota yang sama)\n2. description (nama barang yang dibeli atau keperluan)\n3. category (pilih salah satu: 'ATK', 'Air Minum', 'Transportasi', 'Konsumsi', atau 'Lain-lain')\n4. vendor (nama toko/merchant, samakan untuk semua item di nota yang sama)\n5. amount (harga total untuk item tersebut dalam angka saja tanpa pemisah ribuan)\n\nKembalikan HANYA JSON raw dengan format:\n{\n  \"items\": [\n    { \"date\": \"...\", \"description\": \"...\", \"category\": \"...\", \"vendor\": \"...\", \"amount\": ... }\n  ]\n}"
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
        max_tokens: 1024,
      })

      const content = response.choices[0]?.message?.content || "{}"
      
      // Clean up the JSON if it has markdown formatting
      const cleanedContent = content.replace(/```json/g, "").replace(/```/g, "").trim()
      
      let parsedData;
      try {
        parsedData = JSON.parse(cleanedContent)
        // Ensure it has items array
        if (!parsedData.items || !Array.isArray(parsedData.items)) {
           // If the AI returned a single object, wrap it in items
           if (parsedData.description || parsedData.amount) {
             parsedData = { items: [parsedData] }
           } else {
             throw new Error("Invalid format")
           }
        }
      } catch (e) {
        console.error("Failed to parse JSON:", content)
        // Fallback generic data
        parsedData = {
          items: [{
            date: new Date().toISOString().split('T')[0],
            description: "Struk Pembelian",
            category: "Lain-lain",
            vendor: "Vendor",
            amount: 0
          }]
        }
      }

      return NextResponse.json({
        items: parsedData.items,
        receipt_url: publicUrl
      })

    } catch (visionError) {
      console.error("Vision API Error:", visionError)
      // Return the uploaded URL anyway so user can manually input
      return NextResponse.json({ 
        items: [{
          date: new Date().toISOString().split('T')[0],
          description: "",
          category: "Lain-lain",
          vendor: "",
          amount: 0,
        }],
        receipt_url: publicUrl,
        error: "OCR failed, please input manually"
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
