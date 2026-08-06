"use client"
import { terbilangRupiah, formatRupiah } from "@/lib/terbilang"
import { formatCostReasons } from "@/lib/reimbursement-helper"

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
  "allowance": "补贴（天数*单天补贴）", "Transportation": "交通费", "hotel": "住宿费",
  "taxi": "市内交通费", "Bonus": "奖励",
  "advertising/promotion": "广告宣传/促销活动", "Marketing Fee": "市场管理服务",
  "claim price protection": "调价补差", "Adv. Production/installation": "广告制作/安装",
  "Adv. Material": "广告物料", "public relation activity": "公关活动",
  "BNS entertain-meals": "业务招待费-餐饮", "BNS entertain-entertainment": "业务招待费-娱乐",
  "BNS entertain-hotel expense": "业务招待费-住宿", "BNS entertain-Transportation": "业务招待费-交通费",
  "BNS entertain-gift": "业务招待费-礼品", "meeting-meals": "会务费-餐饮",
  "meeting-accommodation": "会务费-住宿", "meeting-rental": "会务费-租赁", "meeting-gift": "会务费-礼品"
}

const CATEGORY_DISPLAY: Record<string, string> = {
  "office rent": "OFFICE RENT", "warehouse rent": "WAREHOUSE RENT", "electricity&water": "ELECTRICITY & WATER",
  "property management": "PROPERTY MANAGEMENT", "office supplies": "OFFICE SUPPLIES",
  "service maintenance": "SERVICE MAINTENANCE", "tools & spare part": "TOOLS & SPARE PART",
  "drinking water": "DRINKING WATER", "legal&professional fee": "LEGAL & PROFESSIONAL FEE",
  "personnel recruitment": "PERSONNEL RECRUITMENT", "document expense": "DOCUMENT EXPENSE",
  "telephone&fax": "TELEPHONE & FAX", "internet": "INTERNET", "supplies": "SUPPLIES",
  "Tax Reklame": "TAX REKLAME", "vehicle": "VEHICLE", "computer": "COMPUTER",
  "printer": "PRINTER", "projector": "PROJECTOR", "office furniture": "OFFICE FURNITURE",
  "office appliances": "OFFICE APPLIANCES", "exhibitions": "EXHIBITIONS",
  "space branding rent": "SPACE BRANDING RENT", "operating rental": "OPERATING RENTAL",
  "vehicle rent": "VEHICLE RENT", "asset insurance": "ASSET INSURANCE",
  "mobil insurance": "MOBIL INSURANCE", "car rental": "CAR RENTAL", "delivery": "DELIVERY",
  "express": "EXPRESS", "gasoline": "GASOLINE", "parking": "PARKING", "toll": "TOLL",
  "repairing": "REPAIRING", "social insurance": "SOCIAL INSURANCE",
  "medical insurance": "MEDICAL INSURANCE", "accident insurance": "ACCIDENT INSURANCE",
  "welfare": "WELFARE", "training expenses": "TRAINING EXPENSES", "Service fee": "SERVICE FEE",
  "allowance": "ALLOWANCE", "Transportation": "TRANSPORTATION", "hotel": "HOTEL",
  "taxi": "TAXI", "Bonus": "BONUS", "advertising/promotion": "ADVERTISING/PROMOTION",
  "Marketing Fee": "MARKETING FEE", "claim price protection": "CLAIM PRICE PROTECTION",
  "Adv. Production/installation": "ADV. PRODUCTION/INSTALLATION",
  "Adv. Material": "ADV. MATERIAL", "public relation activity": "PUBLIC RELATION ACTIVITY",
  "BNS entertain-meals": "BNS MEALS",
  "BNS entertain-entertainment": "BNS ENTERTAINMENT",
  "BNS entertain-hotel expense": "BNS HOTEL EXPENSE",
  "BNS entertain-Transportation": "BNS TRANSPORTATION",
  "BNS entertain-gift": "BNS GIFT",
  "meeting-meals": "MEETING MEALS", "meeting-accommodation": "MEETING ACCOMMODATION",
  "meeting-rental": "MEETING RENTAL", "meeting-gift": "MEETING GIFT",
}

const MONTH_NAMES = [
  "JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI",
  "JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"
]

const P = "#7030a0"
const BG = "#ccecff"
const BLK = "#000000"

export function ExpenseFormTemplate({ reimbursement }: PrintTemplateProps) {
  const profile = reimbursement.profiles || {}
  const items = reimbursement.reimbursement_items || []

  const DB_TO_TEMPLATE: Record<string, string> = {
    "ATK": "office supplies",
    "Konsumsi": "BNS entertain-meals",
    "Air Minum": "drinking water",
    "Transportasi": "Transportation",
    "Lain-lain": "supplies",
  }

  const amountsByCategory: Record<string, number> = {}
  items.forEach((item: any) => {
    let cat = item.category || item.categories?.name || ""
    cat = DB_TO_TEMPLATE[cat] || cat
    if (!amountsByCategory[cat]) amountsByCategory[cat] = 0
    amountsByCategory[cat] += Number(item.amount)
  })

  const mainCategory = items[0]?.category || items[0]?.categories?.name || ""
  const mappedCategory = DB_TO_TEMPLATE[mainCategory] || mainCategory
  const categoryDisplay = CATEGORY_DISPLAY[mappedCategory] || mappedCategory.toUpperCase()

  const periodeMonth = reimbursement.period
    ? MONTH_NAMES[parseInt(reimbursement.period.split('-')[1], 10) - 1] || ""
    : ""

  const totalFormatted = formatRupiah(reimbursement.total_amount || 0)
  const costReasons = formatCostReasons({
    fullName: profile.full_name,
    items: items,
    totalAmount: reimbursement.total_amount,
    department: profile.department,
  })
  const totalInWords = terbilangRupiah(reimbursement.total_amount || 0)

  const d = new Date(reimbursement.created_at)
  const dateStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`

  // Border styles: Medium 2px outer/headers, Thin 1px inner grid
  const borderThin = `1px solid ${P}`
  const borderMedium = `2px solid ${P}`

  const catCell = (key: string, rs = 1) => {
    const has = (amountsByCategory[key] || 0) > 0
    return (
      <td rowSpan={rs} style={{ border: borderThin, padding: '2px 3px', textAlign: 'center', verticalAlign: 'middle', background: has ? BG : 'transparent', color: P, fontSize: '9px', lineHeight: '1.2' }}>
        <div>{CATEGORY_MAP[key] || ''}</div>
        <div style={{ fontSize: '8px' }}>{key}</div>
      </td>
    )
  }

  const amtCell = (cats: string[], rs = 1) => {
    const sum = cats.reduce((a, c) => a + (amountsByCategory[c] || 0), 0)
    return (
      <td rowSpan={rs} style={{ border: borderThin, padding: '2px 4px', textAlign: 'right', verticalAlign: 'middle', color: BLK, fontSize: '7px' }}>
        {sum > 0 ? sum.toLocaleString('id-ID') : ''}
      </td>
    )
  }

  const labelCell = (zh: string, en: string, rs = 1, cs = 1, bold = false) => (
    <td rowSpan={rs} colSpan={cs} style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', lineHeight: '1.3', fontWeight: bold ? 'bold' : 'normal' }}>
      <div>{zh}</div><div>{en}</div>
    </td>
  )

  const dataCell = (val: string, rs = 1, cs = 1, extra?: React.CSSProperties) => (
    <td rowSpan={rs} colSpan={cs} style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: BLK, fontSize: '8px', ...extra }}>
      {val}
    </td>
  )

  const emptyCell = (rs = 1, cs = 1) => (
    <td rowSpan={rs} colSpan={cs} style={{ border: borderThin, padding: '2px' }}></td>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: landscape; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { height: 100%; margin: 0; }
        }
      `}} />
      <div style={{ width: '297mm', margin: '0 auto', background: '#fff', fontFamily: '"Calibri", "Microsoft YaHei", "SimSun", Arial, sans-serif', padding: '8mm 6mm', fontSize: '9px', boxSizing: 'border-box' }} className="print:block hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse', border: borderMedium, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '13.5%' }} />
            <col style={{ width: '11.9%' }} />
            <col style={{ width: '10.4%' }} />
            <col style={{ width: '12.4%' }} />
            <col style={{ width: '10.8%' }} />
            <col style={{ width: '14.3%' }} />
            <col style={{ width: '11.8%' }} />
            <col style={{ width: '15.2%' }} />
          </colgroup>
          <thead>
            {/* Row 1 - Header Title */}
            <tr style={{ height: '46px' }}>
              <th colSpan={5} style={{ border: borderMedium, padding: '4px', textAlign: 'center', color: P }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>费用报销单- 中爪哇西南</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold' }}>EXPENSES REIMBURSEMENT- JATENG BARAT SELATAN</div>
              </th>
              <th style={{ border: borderThin, padding: '4px', textAlign: 'left', verticalAlign: 'middle', color: P, fontSize: '9px' }}>
                <div>部门编码</div><div>DP   NO. 623</div>
              </th>
              <th style={{ border: borderThin, padding: '4px', textAlign: 'left', verticalAlign: 'middle', color: P, fontSize: '9px' }}>
                <div>凭证编号</div><div>KODE U8 .</div>
              </th>
              <th style={{ border: borderThin, padding: '4px', textAlign: 'left', verticalAlign: 'middle', color: P, fontSize: '9px' }}>
                <div>查询编码：</div><div>CABANG</div>
              </th>
            </tr>
            {/* Row 2 - Subheader Category Titles */}
            <tr style={{ height: '41px' }}>
              <th style={{ border: borderMedium, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>填写日期</div><div>Fill in the date</div>
              </th>
              <th style={{ border: borderMedium, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>办公费用报销单</div><div style={{ fontSize: '8px' }}>OFFICE EXPENSES</div>
              </th>
              <th style={{ border: borderMedium, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>固定资产和待摊费用</div><div style={{ fontSize: '8px' }}>FIXED ASSETS&PREPAID EXPENSES</div>
              </th>
              <th style={{ border: borderMedium, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>物流、车辆费用报销单</div><div style={{ fontSize: '8px' }}>LOGISTICS & CAR EXPENSES</div>
              </th>
              <th style={{ border: borderMedium, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>人员费用报销单</div><div style={{ fontSize: '8px' }}>EMPLOYEE EXPENSES</div>
              </th>
              <th style={{ border: borderMedium, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>销售费用报销单</div><div style={{ fontSize: '8px' }}>MARKETING EXPENSES</div>
              </th>
              <th style={{ border: borderMedium, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>金额</div><div>amount</div>
              </th>
              <th style={{ border: borderMedium, padding: '3px', color: P, fontSize: '9px', fontWeight: 'normal' }}>
                <div>总部付款-账户名称</div><div style={{ fontSize: '8px' }}>Head-account name</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 3 */}
            <tr style={{ height: '24px' }}>
              {dataCell(dateStr)}
              {catCell("office rent")}
              {catCell("vehicle")}
              {catCell("car rental")}
              {catCell("social insurance")}
              {catCell("exhibitions")}
              {amtCell(["office rent", "vehicle", "car rental", "social insurance", "exhibitions"])}
              {dataCell("DUAN LONGCHANG")}
            </tr>
            {/* Row 4 */}
            <tr style={{ height: '24px' }}>
              {labelCell("员工姓名", "Employee name")}
              {catCell("warehouse rent")}
              {catCell("computer")}
              {catCell("delivery")}
              {catCell("medical insurance")}
              {catCell("space branding rent")}
              {amtCell(["warehouse rent", "computer", "delivery", "medical insurance", "space branding rent"])}
              <td style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>总部付款-开户银行及账号</div><div style={{ fontSize: '8px' }}>Head-Bank & Account Number</div>
              </td>
            </tr>
            {/* Row 5 */}
            <tr style={{ height: '26px' }}>
              {dataCell(profile.full_name?.toUpperCase() || '')}
              {catCell("electricity&water")}
              {catCell("printer")}
              {catCell("express")}
              {catCell("accident insurance")}
              {catCell("operating rental")}
              {amtCell(["electricity&water", "printer", "express", "accident insurance", "operating rental"])}
              <td rowSpan={2} style={{ border: borderThin, padding: '4px', textAlign: 'center', color: BLK, fontSize: '8px', verticalAlign: 'middle' }}>
                {profile.bank_name || 'BCA'} {(profile.bank_account || '358 0567 966').replace(/-/g, ' ')}
              </td>
            </tr>
            {/* Row 6 */}
            <tr style={{ height: '24px' }}>
              {labelCell("员工部门", "Department")}
              {catCell("property management")}
              {catCell("projector")}
              {catCell("gasoline")}
              {catCell("welfare")}
              {catCell("advertising/promotion")}
              {amtCell(["property management", "projector", "gasoline", "welfare", "advertising/promotion"])}
            </tr>
            {/* Row 7 */}
            <tr style={{ height: '30px' }}>
              {dataCell(profile.department?.toUpperCase() || 'SERVICE CENTER PURWOKERTO')}
              {catCell("office supplies")}
              {catCell("office furniture")}
              {catCell("parking")}
              {catCell("training expenses")}
              {catCell("Marketing Fee")}
              {amtCell(["office supplies", "office furniture", "parking", "training expenses", "Marketing Fee"])}
              <td style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px' }}>
                <div>总部费用部审核</div><div style={{ fontSize: '8px' }}>Head-finance approval</div>
              </td>
            </tr>
            {/* Row 8 */}
            <tr style={{ height: '24px' }}>
              {labelCell("分公司付款-账户名称", "Branch-account name")}
              {catCell("service maintenance")}
              {catCell("office appliances")}
              {catCell("toll")}
              {catCell("Service fee")}
              {catCell("claim price protection")}
              {amtCell(["service maintenance", "office appliances", "toll", "Service fee", "claim price protection"])}
              <td rowSpan={2} style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                <div>区财务经理签字</div><div style={{ fontSize: '8px' }}>Finance Manager Cabang</div>
              </td>
            </tr>
            {/* Row 9 */}
            <tr style={{ height: '24px' }}>
              {dataCell("DUAN LONGCHANG")}
              {catCell("tools & spare part")}
              {catCell("exhibitions")}
              {catCell("repairing")}
              {emptyCell(1)}
              {catCell("Adv. Production/installation")}
              {amtCell(["tools & spare part", "exhibitions", "repairing", "Adv. Production/installation"])}
            </tr>
            {/* Row 10 */}
            <tr style={{ height: '24px' }}>
              {labelCell("分公司付款-开户银行", "Branch-Opening bank")}
              {catCell("drinking water")}
              {catCell("space branding rent")}
              {emptyCell(1)}
              {emptyCell(1)}
              {catCell("Adv. Material")}
              {amtCell(["drinking water", "space branding rent", "Adv. Material"])}
              {emptyCell(1)}
            </tr>
            {/* Row 11 */}
            <tr style={{ height: '36px' }}>
              {dataCell(profile.bank_name?.toUpperCase() || 'BCA')}
              {catCell("legal&professional fee")}
              {catCell("operating rental")}
              {emptyCell(1)}
              {catCell("allowance")}
              {catCell("public relation activity")}
              {amtCell(["legal&professional fee", "operating rental", "allowance", "public relation activity"])}
              {emptyCell(1)}
            </tr>
            {/* Row 12 */}
            <tr style={{ height: '24px' }}>
              {labelCell("分公司-银行账号", "Branch-account number")}
              {catCell("personnel recruitment")}
              {catCell("office rent")}
              {emptyCell(1)}
              {catCell("Transportation")}
              {catCell("BNS entertain-meals")}
              {amtCell(["personnel recruitment", "office rent", "Transportation", "BNS entertain-meals"])}
              <td style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', fontWeight: 'bold' }}>
                <div>总部财务经理签字</div><div style={{ fontSize: '8px' }}>Finance Manager Pusat</div>
              </td>
            </tr>
            {/* Row 13 */}
            <tr style={{ height: '24px' }}>
              {dataCell((profile.bank_account || '358 0567 966').replace(/-/g, ' '))}
              {catCell("document expense")}
              {catCell("warehouse rent")}
              {emptyCell(1)}
              {catCell("hotel")}
              {catCell("BNS entertain-entertainment")}
              {amtCell(["document expense", "warehouse rent", "hotel", "BNS entertain-entertainment"])}
              <td rowSpan={2} style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                <div>总部总经理审批</div><div style={{ fontSize: '8px' }}>The General Manager</div>
              </td>
            </tr>
            {/* Row 14 */}
            <tr style={{ height: '24px' }}>
              {labelCell("分公司部门审批", "Branch-Department", 1, 1, true)}
              {catCell("telephone&fax")}
              {catCell("property management")}
              {emptyCell(1)}
              {catCell("taxi")}
              {catCell("BNS entertain-hotel expense")}
              {amtCell(["telephone&fax", "property management", "taxi", "BNS entertain-hotel expense"])}
            </tr>
            {/* Row 15 - Signature image cell A15 */}
            <tr style={{ height: '24px' }}>
              <td style={{ border: borderThin, padding: '2px', position: 'relative', textAlign: 'center', verticalAlign: 'middle' }}>
                {profile.signature_url ? (
                  <img src={profile.signature_url} alt="Signature" style={{ width: '40px', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                ) : (
                  <img src="/template/image10.png" alt="Signature Approval" style={{ width: '40px', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                )}
              </td>
              {catCell("internet")}
              {catCell("vehicle rent")}
              {emptyCell(1)}
              {catCell("Bonus")}
              {catCell("BNS entertain-gift")}
              {amtCell(["internet", "vehicle rent", "Bonus", "BNS entertain-gift"])}
              {emptyCell(1)}
            </tr>
            {/* Row 16 */}
            <tr style={{ height: '24px' }}>
              {labelCell("分公司费用专员审核", "Branch-finance approval", 1, 1, true)}
              {catCell("supplies")}
              {catCell("asset insurance")}
              {emptyCell(1)}
              {emptyCell(1)}
              {catCell("BNS entertain-Transportation")}
              {amtCell(["supplies", "asset insurance", "BNS entertain-Transportation"])}
              <td rowSpan={2} style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                <div>总部出纳员签字</div><div style={{ fontSize: '8px' }}>Cashier signature</div>
              </td>
            </tr>
            {/* Row 17 */}
            <tr style={{ height: '25px' }}>
              {emptyCell(1)}
              {catCell("Tax Reklame")}
              {catCell("mobil insurance")}
              {emptyCell(1)}
              {emptyCell(1)}
              {catCell("meeting-meals")}
              {amtCell(["Tax Reklame", "mobil insurance", "meeting-meals"])}
            </tr>
            {/* Row 18 - Cost Reasons (B18:E20 merged) */}
            <tr style={{ height: '24px' }}>
              {emptyCell(1)}
              <td colSpan={4} rowSpan={3} style={{ border: borderThin, padding: '3px 6px', color: P, fontSize: '7px', fontWeight: 'bold', verticalAlign: 'top' }}>
                <div>Cost reasons and completion</div>
                <div>费用支出原因及完成情况</div>
                <div style={{ color: BLK, fontWeight: 'bold', fontSize: '7px', marginTop: '2px' }}>{costReasons}</div>
              </td>
              {catCell("meeting-accommodation")}
              {amtCell(["meeting-accommodation"])}
              {emptyCell(1)}
            </tr>
            {/* Row 19 */}
            <tr style={{ height: '24px' }}>
              <td rowSpan={2} style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                <div>分公司总经理审批</div><div style={{ fontSize: '8px' }}>The general manager</div>
              </td>
              {catCell("meeting-rental")}
              {amtCell(["meeting-rental"])}
              {emptyCell(1)}
            </tr>
            {/* Row 20 */}
            <tr style={{ height: '24px' }}>
              {catCell("meeting-gift")}
              {amtCell(["meeting-gift"])}
              <td style={{ border: borderThin, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', fontWeight: 'bold' }}>
                <div>记账签字</div><div style={{ fontSize: '8px' }}>Ledger signature</div>
              </td>
            </tr>
            {/* Row 21 - Terbilang & Total */}
            <tr style={{ height: '34px' }}>
              {emptyCell(1)}
              <td colSpan={4} style={{ border: borderThin, padding: '3px 6px', color: P, fontSize: '7px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                合计（大写）total (words)：<span style={{ color: BLK, fontWeight: 'bold', fontSize: '7px' }}>{totalInWords}</span>
              </td>
              <td style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>
                合计（小写）total（figures)
              </td>
              <td colSpan={1} style={{ border: borderThin, padding: '3px 6px', textAlign: 'right', color: BLK, fontSize: '7px', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: P }}>RP：</span>
                  <span style={{ color: BLK }}>{totalFormatted}</span>
                </div>
              </td>
              {emptyCell(1)}
            </tr>
            {/* Row 22 - Financial Row 1 */}
            <tr style={{ height: '42px' }}>
              <td rowSpan={2} style={{ border: borderMedium, padding: '2px 4px', textAlign: 'center', color: P, fontSize: '9px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                <div>分公司付款签字</div><div style={{ fontSize: '8px' }}>Cashier signature</div>
              </td>
              <td style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>Excluding VAT</div><div>RP: <span style={{ color: BLK }}>{totalFormatted}</span></div>
              </td>
              <td style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>入账金额：amount AC</div><div>RP : <span style={{ color: BLK }}>{totalFormatted}</span></div>
              </td>
              <td style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>代扣税PPH【2%】</div><div>RP:  -</div>
              </td>
              <td colSpan={2} style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>已付金额ADVANCE PAYMENT</div><div>RP:  -</div>
              </td>
              <td colSpan={2} style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>□冲减借款Reduce borrowing   </div>
                <div>□冲减预付款Reduce DP</div>
                <div>□冲减往来Reduce C A                                 </div>
              </td>
            </tr>
            {/* Row 23 - Financial Row 2 */}
            <tr style={{ height: '42px' }}>
              <td style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>VAT</div><div>RP: -</div>
              </td>
              <td style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>其他others</div><div>RP: -</div>
              </td>
              <td style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>扣款debit  </div><div>RP:  -</div>
              </td>
              <td colSpan={2} style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>实付金额ACTUAL PAYMENT</div><div>RP:  <span style={{ color: BLK }}>{totalFormatted}</span></div>
              </td>
              <td colSpan={2} style={{ border: borderThin, padding: '3px', color: P, fontSize: '7px', verticalAlign: 'top' }}>
                <div>□ Bank-BCA  □ Bank-Mandiri  □ Cash</div>
                <div>□ BOC       □ Others           </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

