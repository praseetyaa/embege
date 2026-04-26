"use client"
interface PrintTemplateProps {
  reimbursement: any
}
const CATEGORY_MAP: Record<string, string> = {
  "office rent": "办公租赁", "warehouse rent": "仓库租赁", "electricity&water": "水电费",
  "property management": "物业管理费", "office supplies": "办公用品", "service maintenance": "维修费",
  "tools & spare part": "工具配件", "drinking water": "纯净水", "legal&professional fee": "法律咨询费",
  "personnel recruitment": "人事招聘", "document expense": "证件办理费", "telephone&fax": "电话传真",
  "internet": "网络", "supplies": "低值易耗品", "Tax Reklame": "广告税",
  "vehicle": "车辆", "computer": "电脑", "printer": "打印机", "projector": "投影仪",
  "office furniture": "办公家具", "office appliances": "办公家电", "exhibitions": "展会/展位",
  "space branding rent": "广告位租赁", "operating rental": "经营租金",
  "vehicle rent": "车辆租赁",
  "asset insurance": "资产保险", "mobil insurance": "汽车保险费",
  "car rental": "租车费", "delivery": "运输费", "express": "快递费", "gasoline": "加油费",
  "parking": "停车费", "toll": "过路费", "repairing": "维修费",
  "social insurance": "社保费", "medical insurance": "医疗保险", "accident insurance": "意外保险",
  "welfare": "福利费", "training expenses": "培训费", "Service fee": "劳务费",
  "allowance": "补贴（天数）集补贴", "Transportation": "交通费", "hotel": "住宿费",
  "taxi": "市内交通费", "Bonus": "奖励",
  "advertising/promotion": "广告宣传/促销活动", "Marketing Fee": "市场管理服务",
  "claim price protection": "调价补差", "Adv. Production/installation": "广告制作/安装",
  "Adv. Material": "广告物料", "public relation activity": "公关活动",
  "BNS entertain-meals": "业务招待费-餐饮", "BNS entertain-entertainment": "业务招待费-娱乐",
  "BNS entertain-hotel expense": "业务招待费-住宿", "BNS entertain-Transportation": "业务招待费-交通费",
  "BNS entertain-gift": "业务招待费-礼品", "meeting-meals": "会务费-餐饮",
  "meeting-accommodation": "会务费-住宿", "meeting-rental": "会务费-租赁", "meeting-gift": "会务费-礼品"
}

function terbilang(angka: number): string {
  const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]
  if (angka < 12) return huruf[angka]
  if (angka < 20) return terbilang(angka - 10) + " Belas"
  if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10)
  if (angka < 200) return "Seratus " + terbilang(angka - 100)
  if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100)
  if (angka < 2000) return "Seribu " + terbilang(angka - 1000)
  if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000)
  if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000)
  return ""
}

const P = "#7030a0"
const BG = "#ccecff"
const BLK = "#000000"

export function ExpenseFormTemplate({ reimbursement }: PrintTemplateProps) {
  const profile = reimbursement.profiles || {}
  const items = reimbursement.reimbursement_items || []

  // Map Indonesian DB categories to English template keys
  const DB_TO_TEMPLATE: Record<string, string> = {
    "ATK": "office supplies",
    "Konsumsi": "meeting-meals",
    "Air Minum": "drinking water",
    "Transportasi": "Transportation",
    "Lain-lain": "supplies",
  }

  const amountsByCategory: Record<string, number> = {}
  items.forEach((item: any) => {
    let cat = item.category || item.categories?.name || ""
    cat = DB_TO_TEMPLATE[cat] || cat // Apply mapping
    if (!amountsByCategory[cat]) amountsByCategory[cat] = 0
    amountsByCategory[cat] += Number(item.amount)
  })

  const itemDescriptions = items.map((item: any) => item.description).join(", ")
  const costReasons = `${profile.full_name?.toUpperCase() || ''} REIMB PAID DUAN LONGCHANG BIAYA PEMBELIAN ${itemDescriptions.toUpperCase()} UNTUK SERVICE CENTER VIVO PURWOKERTO Rp${reimbursement.total_amount?.toLocaleString('id-ID') || '0'},-`
  const totalInWords = terbilang(reimbursement.total_amount || 0).trim().toUpperCase() + " RUPIAH"

  const d = new Date(reimbursement.created_at)
  const dateStr = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`

  const bc = `1px solid ${P}`
  const bc2 = `2px solid ${P}`

  const catCell = (key: string, rs = 1) => {
    const has = (amountsByCategory[key] || 0) > 0
    return (
      <td rowSpan={rs} style={{ border: bc, padding: '2px 3px', textAlign: 'center', verticalAlign: 'middle', background: has ? BG : 'transparent', color: P, fontSize: '9px', lineHeight: '1.2' }}>
        <div>{CATEGORY_MAP[key] || ''}</div>
        <div style={{ fontSize: '8px' }}>{key}</div>
      </td>
    )
  }

  const amtCell = (cats: string[], rs = 1) => {
    const sum = cats.reduce((a, c) => a + (amountsByCategory[c] || 0), 0)
    return (
      <td rowSpan={rs} style={{ border: bc, padding: '2px 4px', textAlign: 'right', verticalAlign: 'bottom', color: BLK, fontSize: '10px', backgroundColor: sum > 0 ? BG : 'transparent' }}>
        {sum > 0 ? sum.toLocaleString('id-ID') : ''}
      </td>
    )
  }

  const labelCell = (zh: string, en: string, rs = 1, cs = 1) => (
    <td rowSpan={rs} colSpan={cs} style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', lineHeight: '1.3' }}>
      <div>{zh}</div><div>{en}</div>
    </td>
  )

  const dataCell = (val: string, rs = 1, cs = 1, extra?: React.CSSProperties) => (
    <td rowSpan={rs} colSpan={cs} style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: BLK, fontSize: '10px', ...extra }}>
      {val}
    </td>
  )

  const emptyCell = (rs = 1, cs = 1) => (
    <td rowSpan={rs} colSpan={cs} style={{ border: bc, padding: '2px' }}></td>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: landscape; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin-middle: 0; margin-bottom: 0; }
          html { margin: 0; }
        }
      `}} />
      <div style={{ width: '287mm', margin: '0 auto', background: '#fff', fontFamily: 'Arial, sans-serif', padding: '4mm 2mm', fontSize: '10px' }} className="print:block hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse', border: bc2, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={5} style={{ border: bc, padding: '4px', textAlign: 'center', color: P }}>
                <div style={{ fontSize: '16px' }}>费用报销单- 中爪哇西南</div>
                <div style={{ fontSize: '11px' }}>EXPENSES REIMBURSEMENT- JATENG BARAT SELATAN</div>
              </th>
              <th style={{ border: bc, padding: '4px', textAlign: 'left', verticalAlign: 'middle', color: P, fontSize: '9px' }}>
                <div>部门编码</div><div>DP NO. 613</div>
              </th>
              <th style={{ border: bc, padding: '4px', textAlign: 'left', verticalAlign: 'middle', color: P, fontSize: '9px' }}>
                <div>凭证编号</div><div>KODE U8 .</div>
              </th>
              <th style={{ border: bc, padding: '4px', textAlign: 'left', verticalAlign: 'middle', color: P, fontSize: '9px' }}>
                <div>查询编码：</div><div>KODE CABANG</div>
              </th>
            </tr>
            <tr>
              <th style={{ border: bc, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>填写日期</div><div>Fill in the date</div>
              </th>
              <th style={{ border: bc, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>办公费用报销单</div><div style={{ fontSize: '8px' }}>OFFICE EXPENSES</div>
              </th>
              <th style={{ border: bc, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>固定资产和待摊费用</div><div style={{ fontSize: '8px' }}>FIXED ASSETS&PREPAID EXPENSES</div>
              </th>
              <th style={{ border: bc, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>物流、车辆费用报销单</div><div style={{ fontSize: '8px' }}>LOGISTICS & CAR EXPENSES</div>
              </th>
              <th style={{ border: bc, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>人员费用报销单</div><div style={{ fontSize: '8px' }}>EMPLOYEE EXPENSES</div>
              </th>
              <th style={{ border: bc, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>销售费用报销单</div><div style={{ fontSize: '8px' }}>MARKETING EXPENSES</div>
              </th>
              <th style={{ border: bc, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>金额</div><div>amount</div>
              </th>
              <th style={{ border: bc, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>总部付款-账户名称</div><div style={{ fontSize: '8px' }}>Head-account name</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1 */}
            <tr>
              {dataCell(dateStr)}
              {catCell("office rent")}
              {catCell("vehicle")}
              {catCell("car rental")}
              {catCell("social insurance")}
              {catCell("exhibitions")}
              {amtCell(["office rent", "vehicle", "car rental", "social insurance", "exhibitions"])}
              {dataCell("DUAN LONGCHANG")}
            </tr>
            {/* Row 2 */}
            <tr>
              {labelCell("员工姓名", "Employee name")}
              {catCell("warehouse rent")}
              {catCell("computer")}
              {catCell("delivery")}
              {catCell("medical insurance")}
              {catCell("space branding rent")}
              {amtCell(["warehouse rent", "computer", "delivery", "medical insurance", "space branding rent"])}
              <td style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>总部付款-开户银行及账号</div><div style={{ fontSize: '8px' }}>Head-Bank & Account Number</div>
              </td>
            </tr>
            {/* Row 3 */}
            <tr>
              {dataCell(profile.full_name?.toUpperCase() || '')}
              {catCell("electricity&water")}
              {catCell("printer")}
              {catCell("express")}
              {catCell("accident insurance")}
              {catCell("operating rental")}
              {amtCell(["electricity&water", "printer", "express", "accident insurance", "operating rental"])}
              <td rowSpan={2} style={{ border: bc, padding: '4px', textAlign: 'center', color: BLK, fontSize: '11px' }}>
                {profile.bank_name || 'BCA'} {profile.bank_account || '358-0567-966'}
              </td>
            </tr>
            {/* Row 4 */}
            <tr>
              {labelCell("员工部门", "Department")}
              {catCell("property management")}
              {catCell("projector")}
              {catCell("gasoline")}
              {catCell("welfare")}
              {catCell("advertising/promotion")}
              {amtCell(["property management", "projector", "gasoline", "welfare", "advertising/promotion"])}
            </tr>
            {/* Row 5 */}
            <tr>
              {dataCell(profile.department?.toUpperCase() || 'SC VIVO PURWOKERTO')}
              {catCell("office supplies")}
              {catCell("office furniture")}
              {catCell("parking")}
              {catCell("training expenses")}
              {catCell("Marketing Fee")}
              {amtCell(["office supplies", "office furniture", "parking", "training expenses", "Marketing Fee"])}
              <td style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>总部费用部审核</div><div style={{ fontSize: '8px' }}>Head-finance approval</div>
              </td>
            </tr>
            {/* Row 6 */}
            <tr>
              {labelCell("分公司付款-账户名称", "Branch-account name")}
              {catCell("service maintenance")}
              {catCell("office appliances")}
              {catCell("toll")}
              {catCell("Service fee")}
              {catCell("claim price protection")}
              {emptyCell(1)}
              {amtCell(["service maintenance", "office appliances", "toll", "Service fee", "claim price protection"])}
            </tr>
            {/* Row 7 */}
            <tr>
              {dataCell(profile.full_name?.toUpperCase() || '')}
              {catCell("tools & spare part")}
              {catCell("exhibitions")}
              {catCell("repairing")}
              {emptyCell(1)}
              {catCell("Adv. Production/installation")}
              {emptyCell(1)}
              {amtCell(["tools & spare part", "exhibitions", "repairing", "Adv. Production/installation"])}
            </tr>
            {/* Row 8 */}
            <tr>
              {labelCell("分公司付款-开户银行", "Branch-Opening bank")}
              {catCell("drinking water")}
              {catCell("space branding rent")}
              {emptyCell(1)}
              {emptyCell(1)}
              {catCell("Adv. Material")}
              {amtCell(["drinking water", "space branding rent", "Transportation", "Adv. Material"])}
              <td rowSpan={1} style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>区财务经理签字</div><div style={{ fontSize: '8px' }}>Finance Manager Cabang</div>
              </td>
            </tr>
            {/* Row 9 */}
            <tr>
              {dataCell(profile.bank_name?.toUpperCase() || 'BCA')}
              {catCell("legal&professional fee")}
              {catCell("operating rental")}
              {emptyCell(1)}
              {catCell("allowance")}
              {catCell("public relation activity")}
              {emptyCell(1)}
              {amtCell(["legal&professional fee", "operating rental", "allowance", "Hotel", "public relation activity"])}
            </tr>
            {/* Row 10 */}
            <tr>
              {labelCell("分公司-银行账号", "Branch-Account number")}
              {catCell("personnel recruitment")}
              {catCell("office rent")}
              {emptyCell(1)}
              {catCell("Transportation")}
              {catCell("BNS entertain-meals")}
              {amtCell(["personnel recruitment", "office rent", "Transportation", "BNS entertain-meals"])}
              <td rowSpan={1} style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>总部财务经理签字</div><div style={{ fontSize: '8px' }}>Finance Manager Pusat</div>
              </td>
            </tr>
            {/* Row 11 */}
            <tr>
              {dataCell(profile.bank_account || '358-0567-966')}
              {catCell("document expense")}
              {catCell("warehouse rent")}
              {emptyCell(1)}
              {catCell("hotel")}
              {catCell("BNS entertain-entertainment")}
              {emptyCell(1)}
              {amtCell(["document expense", "warehouse rent", "hotel", "BNS entertain-entertainment"])}
            </tr>
            {/* Row 12 */}
            <tr>
              {labelCell("分公司部门审批", "Branch-Department")}
              {catCell("telephone&fax")}
              {catCell("property management")}
              {emptyCell(1)}
              {catCell("taxi")}
              {catCell("BNS entertain-hotel expense")}
              {emptyCell(1)}
              {amtCell(["telephone&fax", "property management", "taxi", "BNS entertain-hotel expense"])}
            </tr>
            {/* Row 13 */}
            <tr>
              <td rowSpan={1} style={{ border: bc, padding: '2px', position: 'relative' }}>
                {profile.signature_url && (
                  <img src={profile.signature_url} alt="Signature" style={{ width: '30%', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                )}
              </td>
              {catCell("internet")}
              {catCell("vehicle rent")}
              {emptyCell(1)}
              {catCell("Bonus")}
              {catCell("BNS entertain-gift")}
              {amtCell(["internet", "vehicle rent", "Bonus", "BNS entertain-gift"])}
              <td rowSpan={1} style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>总部总经理审批</div><div style={{ fontSize: '8px' }}>The General Manager</div>
              </td>
            </tr>
            {/* Row 14 */}
            <tr>
              {labelCell("分公司费用专员审核", "Branch-finance approval")}
              {catCell("supplies")}
              {catCell("asset insurance")}
              {emptyCell(1)}
              {emptyCell(1)}
              {catCell("BNS entertain-Transportation")}
              {emptyCell(1)}
              {amtCell(["supplies", "asset insurance", "BNS entertain-Transportation"])}
            </tr>
            {/* Row 15 */}
            <tr>
              {emptyCell(1)}
              {catCell("Tax Reklame")}
              {catCell("mobil insurance")}
              {emptyCell(1)}
              {emptyCell(1)}
              {catCell("meeting-meals")}
              {amtCell(["Tax Reklame", "mobil insurance", "meeting-meals"])}
            </tr>
            {/* Row 16 - Cost reasons */}
            <tr>
              {emptyCell(1)}
              <td colSpan={4} rowSpan={3} style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>Cost reasons and completion</div>
                <div>费用支出原因及完成情况</div>
                <div style={{ color: BLK }}>{costReasons}</div>
              </td>
              {catCell("meeting-accommodation")}
              {amtCell(["meeting-accommodation"])}
              <td rowSpan={1} style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>总部出纳员签字</div><div style={{ fontSize: '8px' }}>Cashier signature</div>
              </td>
            </tr>
            {/* Row 17 */}
            <tr>
              <td style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', position: 'relative' }}>
                <div>分公司总经理审批</div><div style={{ fontSize: '8px' }}>The general manager</div>
              </td>
              {catCell("meeting-rental")}
              {amtCell(["meeting-rental"])}
            </tr>
            {/* Row 18 - extra row for meeting-gift */}
            <tr>
              {emptyCell()}
              {catCell("meeting-gift")}
              {amtCell(["meeting-gift"])}
              <td style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>记账签字</div><div style={{ fontSize: '8px' }}>Ledger signature</div>
              </td>
            </tr>
            {/* Row 19 - Total */}
            <tr>
              {emptyCell()}
              <td colSpan={4} style={{ border: bc, padding: '3px 6px', color: P, fontSize: '10px' }}>
                合计（大写）total (words)：<span style={{ color: BLK }}>{totalInWords}</span>
              </td>
              <td style={{ border: bc, padding: '3px', color: P, fontSize: '9px', textAlign: 'center' }}>
                合计（小写）total（figures)
              </td>
              <td colSpan={1} style={{ border: bc, padding: '3px 8px', textAlign: 'right', color: BLK, fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><div>Rp</div><div>{reimbursement.total_amount?.toLocaleString('id-ID')}</div></div>
              </td>
            </tr>
            {/* Row 20 */}
            <tr>
              <td style={{ border: bc, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>分公司付款签字</div><div style={{ fontSize: '8px' }}>Cashier signature</div>
              </td>
              <td style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>Excluding VAT</div><div>RP:</div>
              </td>
              <td style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>入账金额：amount AC</div><div>RP:</div>
              </td>
              <td style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>代扣税PPH 【 】</div><div>RP: -</div>
              </td>
              <td colSpan={2} style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>已付金额ADVANCE PAYMENT</div><div>RP: -</div>
              </td>
              <td colSpan={2} style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>□冲减借款Reduce borrowing</div>
                <div>□冲减预付款Reduce DP</div>
                <div>□冲减往来Reduce C A</div>
              </td>
            </tr>
            {/* Row 21 */}
            <tr>
              <td></td>
              <td style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>VAT</div><div>RP: -</div>
              </td>
              <td style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>其他others</div><div>RP: -</div>
              </td>
              <td style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>扣款debit</div><div>RP:</div>
              </td>
              <td colSpan={2} style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>实付金额ACTUAL PAYMENT</div><div>RP:</div>
              </td>
              <td colSpan={2} style={{ border: bc, padding: '3px', color: P, fontSize: '9px' }}>
                <div>□ Bank-BCA  □ Bank-Mandiri  □ Cash</div>
                <div>□ BOC      □ Others</div>
              </td>
            </tr>
          </tbody>
        </table >
      </div >
    </>
  )
}
