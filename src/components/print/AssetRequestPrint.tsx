"use client"

import { AssetRequest, Profile } from "@/lib/types"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface AssetRequestPrintProps {
  request: AssetRequest & { profiles?: Profile };
}

export function AssetRequestPrint({ request }: AssetRequestPrintProps) {
  const items = request.asset_request_items || []

  return (
    <div className="w-full bg-white print:bg-white text-black font-sans print:m-0 p-8 print:p-0">
      {/* VIVO Logo */}
      <div className="mb-2">
        <img
          src="/logo-vivo.png"
          alt="VIVO"
          className="h-7"
          onError={(e) => {
            // Fallback if logo-vivo.png doesn't exist
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* If no logo image, we can just use styled text as fallback, but assuming it exists or we just hide it */}
      </div>

      <table className="w-full border-collapse border border-black text-sm">
        <tbody>
          {/* Header */}
          <tr>
            <td colSpan={4} className="bg-black text-white text-center py-2 border border-black print:bg-black print:text-white" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <div className="font-bold text-base">FORM PERMINTAAN PERBAIKAN FIXED ASSET - ATK</div>
              <div className="font-bold text-sm mt-0.5">(固定资产 / 办公文具)</div>
            </td>
          </tr>

          {/* Reg Form Row */}
          <tr>
            <td colSpan={3} className="border border-black p-1"></td>
            <td className="border border-black p-1 text-right pr-2">
              Reg.Form : {request.reg_form_no || 'GA01'}
            </td>
          </tr>

          {/* Info Rows */}
          <tr>
            <td colSpan={2} className="border border-black p-1.5 w-1/2">
              Nama Pemohon (申请人的姓名)
            </td>
            <td colSpan={2} className="border border-black p-1.5 w-1/2">
              : {request.profiles?.full_name || '-'}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-black p-1.5">
              Tanggal (日期)
            </td>
            <td colSpan={2} className="border border-black p-1.5">
              : {format(new Date(request.request_date), "dd/MM/yyyy")}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-black p-1.5">
              Department / Divisi (部门) / AREA (区域)
            </td>
            <td colSpan={2} className="border border-black p-1.5">
              : {request.department || '-'} / {request.area || '-'}
            </td>
          </tr>

          {/* Table Headers */}
          <tr className="text-center">
            <td className="border border-black p-2 w-[5%]">No.</td>
            <td className="border border-black p-2 w-[35%]">Item Barang (商品)</td>
            <td className="border border-black p-2 w-[40%]">Spesifikasi 规格</td>
            <td className="border border-black p-2 w-[20%]">
              <div>Qty Permintaan</div>
              <div>需求数量</div>
            </td>
          </tr>

          {/* Items & Images */}
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Item Details Row */}
              <tr className="text-center">
                <td className="border border-black p-2 align-top">{index + 1}</td>
                <td className="border border-black p-2 align-top">{item.item_name}</td>
                <td className="border border-black p-2 align-top">{item.specification || '-'}</td>
                <td className="border border-black p-2 align-top">{item.quantity} unit</td>
              </tr>

              {/* Image Row (if exists) */}
              {item.image_url && (
                <tr>
                  <td className="border border-black"></td>
                  <td colSpan={2} className="border border-black p-4">
                    <div className="flex justify-center">
                      <img
                        src={item.image_url}
                        alt={item.item_name}
                        className="max-h-[400px] object-contain"
                      />
                    </div>
                  </td>
                  <td className="border border-black"></td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {/* Fill empty space if items are few, to ensure layout looks like a full form */}
          {items.length === 0 && (
            <tr>
              <td className="border border-black p-6"></td>
              <td className="border border-black p-6"></td>
              <td className="border border-black p-6"></td>
              <td className="border border-black p-6"></td>
            </tr>
          )}

          {/* Signature Section */}
          <tr className="text-center text-xs">
            <td className="border border-black p-2 w-1/4">Manager Terkait ( 相关经理 )</td>
            <td className="border border-black p-2 w-1/4">GA MANAGER 行政中心经理</td>
            <td className="border border-black p-2 w-1/4">Karyawan Terkait (员工)</td>
            <td className="border border-black p-2 w-1/4">FINANCE MANAGER (财务经理)</td>
          </tr>
          <tr>
            <td className="border border-black h-24 align-bottom text-center">
              {/* Space for signature */}
            </td>
            <td className="border border-black h-24 align-bottom text-center">
              {/* Space for signature */}
            </td>
            <td className="border border-black h-24 relative overflow-hidden align-bottom text-center">
              {request.profiles?.signature_url ? (
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <img
                    src={request.profiles.signature_url}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : null}
            </td>
            <td className="border border-black h-24 align-bottom text-center">
              {/* Space for signature */}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Add React import at the top
import React from "react";
