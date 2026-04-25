"use client"

interface PrintTemplateProps {
  reimbursement: any
}

const P = "#7030a0"
const BLK = "#000000"

export function SingleDocumentPasteTemplate({ reimbursement }: PrintTemplateProps) {
  const profile = reimbursement.profiles || {}
  const items = reimbursement.reimbursement_items || []

  const d = new Date(reimbursement.created_at)
  const month = d.getMonth() + 1
  const day = d.getDate()

  const itemDescriptions = items.map((item: any) => item.description).join(", ")
  const costReasons = `${profile.full_name?.toUpperCase() || ''} REIMB PAID DUAN LONGCHANG BIAYA PEMBELIAN ${itemDescriptions.toUpperCase()} UNTUK SERVICE CENTER VIVO PURWOKERTO Rp${reimbursement.total_amount?.toLocaleString('id-ID') || '0'},-`

  const bc = `1px solid ${P}`
  const bc2 = `2px solid ${P}`

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: landscape; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin-top: 0; margin-bottom: 0; }
          html { margin: 0; }
        }
      `}} />
      <div style={{ width: '287mm', margin: '0 auto', background: '#fff', fontFamily: 'Arial, sans-serif', paddingTop: '50mm' }} className="print:block hidden">
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '20px', letterSpacing: '6px', color: P, margin: 0 }}>单据粘贴单</h2>
          <h3 style={{ fontSize: '14px', color: P, margin: '4px 0 0 0' }}>Single document paste</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: bc2 }}>
          <tbody>
            {/* Header row 1 */}
            <tr>
              <td rowSpan={2} style={{ border: bc, padding: '12px', width: '15%' }}></td>
              <td colSpan={2} style={{ border: bc, padding: '8px', textAlign: 'center', color: P, fontSize: '13px', width: '15%' }}>
                date/日期
              </td>
              <td rowSpan={2} style={{ border: bc, padding: '16px', textAlign: 'center', color: P, fontSize: '14px', fontStyle: 'italic', width: '70%' }}>
                <div>Cost reasons and completion</div>
                <div style={{ fontStyle: 'normal' }}>费用支出原因及完成情况</div>
              </td>
            </tr>
            {/* Header row 2 */}
            <tr>
              <td style={{ border: bc, padding: '8px', textAlign: 'center', color: P, fontSize: '9px', width: '7.5%' }}>
                <div>month</div><div>月</div>
              </td>
              <td style={{ border: bc, padding: '8px', textAlign: 'center', color: P, fontSize: '9px', width: '7.5%' }}>
                <div>day</div><div>日</div>
              </td>
            </tr>
            {/* Data row */}
            <tr>
              <td style={{ border: bc, padding: '16px', height: '100px' }}></td>
              <td style={{ border: bc, padding: '12px', textAlign: 'center', fontSize: '9px', color: BLK }}>
                {month}
              </td>
              <td style={{ border: bc, padding: '12px', textAlign: 'center', fontSize: '9px', color: BLK }}>
                {day}
              </td>
              <td style={{ border: bc, padding: '16px', textAlign: 'center', color: BLK, fontSize: '9px', verticalAlign: 'middle', lineHeight: '1.6' }}>
                {costReasons}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
