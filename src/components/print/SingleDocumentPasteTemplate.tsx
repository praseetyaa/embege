"use client"

import { formatCurrency } from "@/lib/utils"

interface PrintTemplateProps {
  reimbursement: any
}

export function SingleDocumentPasteTemplate({ reimbursement }: PrintTemplateProps) {
  const profile = reimbursement.profiles || {}
  const items = reimbursement.reimbursement_items || []
  
  const d = new Date(reimbursement.created_at)
  const month = d.getMonth() + 1
  const day = d.getDate()
  
  const description = `${profile.full_name?.toUpperCase()} REIMB PAID DUAN LONGCHANG BIAYA ${reimbursement.title.toUpperCase()} ${reimbursement.notes ? '- ' + reimbursement.notes : ''} ${formatCurrency(reimbursement.total_amount)}`

  return (
    <div className="w-[297mm] h-[210mm] overflow-hidden bg-white print:block hidden text-purple-900 mx-auto mt-[50mm]" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold tracking-widest">单据粘贴单</h2>
        <h3 className="text-md font-bold">Single document paste</h3>
      </div>
      
      <table className="w-full border-collapse border-2 border-purple-900 text-sm">
        <tbody>
          <tr>
            <td className="border border-purple-800 p-4 w-[20%]" rowSpan={2}></td>
            <td className="border border-purple-800 p-2 text-center w-[15%]" colSpan={2}>
              <div>date/日期</div>
            </td>
            <td className="border border-purple-800 p-4 text-center w-[65%]" rowSpan={2}>
              <div className="text-purple-600/80 mb-1">Cost reasons and completion</div>
              <div className="text-purple-600/80">费用支出原因及完成情况</div>
            </td>
          </tr>
          <tr>
            <td className="border border-purple-800 p-2 text-center w-[7.5%]">
              <div>month</div>
              <div>月</div>
            </td>
            <td className="border border-purple-800 p-2 text-center w-[7.5%]">
              <div>day</div>
              <div>日</div>
            </td>
          </tr>
          <tr>
            <td className="border border-purple-800 p-4 h-[100px]"></td>
            <td className="border border-purple-800 p-4 text-center font-bold text-lg">
              {month}
            </td>
            <td className="border border-purple-800 p-4 text-center font-bold text-lg">
              {day}
            </td>
            <td className="border border-purple-800 p-4 text-center font-bold align-middle">
              {description}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
