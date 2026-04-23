"use client"

import { formatCurrency } from "@/lib/utils"

interface PrintTemplateProps {
  reimbursement: any
}

// Map English categories to Chinese
const CATEGORY_MAP: Record<string, string> = {
  // OFFICE EXPENSES
  "office rent": "办公租赁",
  "warehouse rent": "仓库租赁",
  "electricity&water": "水电费",
  "property management": "物业管理费",
  "office supplies": "办公用品",
  "service maintenance": "维修费",
  "tools & spare part": "工具配件",
  "drinking water": "纯净水",
  "legal&professional fee": "法律咨询费",
  "personnel recruitment": "人事招聘",
  "document expense": "证件办理费",
  "telephone&fax": "电话传真",
  "internet": "网络",
  "supplies": "低值易耗品",
  "Tax Reklame": "广告税",
  // FIXED ASSETS&PREPAID EXPENSES
  "vehicle": "车辆",
  "computer": "电脑",
  "printer": "打印机",
  "projector": "投影仪",
  "office furniture": "办公家具",
  "office appliances": "办公家电",
  "exhibitions (FA)": "展会/展位",
  "space branding rent (FA)": "广告位租赁",
  "operating rental (FA)": "经营租金",
  "office rent (Prepaid)": "办公租金",
  "warehouse rent (Prepaid)": "仓库租金",
  "property management (Prepaid)": "物业管理费",
  "vehicle rent": "车辆租赁",
  "asset insurance": "资产保险",
  "mobil insurance": "汽车保险费",
  // LOGISTICS & CAR EXPENSES
  "car rental": "租车费",
  "delivery": "运输费",
  "express": "快递费",
  "gasoline": "加油费",
  "parking": "停车费",
  "toll": "过路费",
  "repairing": "维修费",
  // EMPLOYEE EXPENSES
  "social insurance": "社保费",
  "medical insurance": "医疗保险",
  "accident insurance": "意外保险",
  "welfare": "福利费",
  "training expenses": "培训费",
  "Service fee": "劳务费",
  "allowance": "补贴",
  "Transportation": "交通费",
  "Hotel": "住宿费",
  "taxi": "市内交通费",
  "Bonus": "奖励",
  // MARKETING EXPENSES
  "exhibitions": "展会/展位",
  "space branding rent": "广告位租赁",
  "operating rental": "经营租金",
  "advertising/promotion": "广告宣传/促销活动",
  "Marketing Fee": "市场管理服务",
  "claim price protection": "调价补差",
  "Adv. Production/installation": "广告制作/安装",
  "Adv. Material": "广告物料",
  "public relation activity": "公关活动",
  "BNS entertain-meals": "业务招待费-餐饮",
  "BNS entertain-entertainment": "业务招待费-娱乐",
  "BNS entertain-hotel expense": "业务招待费-住宿",
  "BNS entertain-Transportation": "业务招待费-交通费",
  "BNS entertain-gift": "业务招待费-礼品",
  "meeting-meals": "会务费-餐饮",
  "meeting-accommodation": "会务费-住宿",
  "meeting-rental": "会务费-租赁",
  "meeting-gift": "会务费-礼品"
}

export function ExpenseFormTemplate({ reimbursement }: PrintTemplateProps) {
  const profile = reimbursement.profiles || {}
  const items = reimbursement.reimbursement_items || []
  
  // Aggregate amounts by category
  const amountsByCategory: Record<string, number> = {}
  items.forEach((item: any) => {
    if (!amountsByCategory[item.category]) {
      amountsByCategory[item.category] = 0
    }
    amountsByCategory[item.category] += Number(item.amount)
  })

  // Format date correctly
  const d = new Date(reimbursement.created_at)
  const dateStr = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`

  // Reusable cell renderer
  const renderCell = (catKey: string, rowSpan = 1) => {
    const val = amountsByCategory[catKey]
    const amountStr = val ? val.toLocaleString('id-ID') : ""
    return (
      <td rowSpan={rowSpan} className="border border-purple-800 p-1 text-center relative group">
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-[10px]">{CATEGORY_MAP[catKey]}</span>
          <span className="text-[9px]">{catKey}</span>
          {amountStr && <div className="absolute inset-0 bg-purple-100/30 flex items-center justify-center font-bold">{amountStr}</div>}
        </div>
      </td>
    )
  }

  return (
    <div className="w-[297mm] h-[210mm] overflow-hidden bg-white print:block hidden text-purple-900 mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <table className="w-full border-collapse border-2 border-purple-900 text-[10px]">
        <thead>
          <tr>
            <th colSpan={4} className="border border-purple-800 p-2 text-center text-lg font-bold">
              <div className="text-xl">费用报销单 - 中爪哇西南</div>
              <div className="text-sm">EXPENSES REIMBURSEMENT- JATENG BARAT SELATAN</div>
            </th>
            <th className="border border-purple-800 p-2 text-left align-top" colSpan={1}>
              <div className="font-bold">部门编码</div>
              <div>DP NO. 613</div>
            </th>
            <th className="border border-purple-800 p-2 text-left align-top" colSpan={1}>
              <div className="font-bold">凭证编号</div>
              <div>KODE U8 .</div>
            </th>
            <th className="border border-purple-800 p-2 text-left align-top" colSpan={1}>
              <div className="font-bold">查询编码：</div>
              <div>KODE CABANG</div>
            </th>
          </tr>
          <tr className="bg-purple-50/50">
            <th className="border border-purple-800 p-1 font-normal w-[10%]">
              <div>填写日期</div>
              <div>Fill in the date</div>
            </th>
            <th className="border border-purple-800 p-1 font-normal w-[15%]">
              <div>办公费用报销单</div>
              <div className="text-[9px]">OFFICE EXPENSES</div>
            </th>
            <th className="border border-purple-800 p-1 font-normal w-[15%]">
              <div>固定资产和待摊费用</div>
              <div className="text-[9px]">FIXED ASSETS&PREPAID EXPENSES</div>
            </th>
            <th className="border border-purple-800 p-1 font-normal w-[15%]">
              <div>物流、车辆费用报销单</div>
              <div className="text-[9px]">LOGISTICS & CAR EXPENSES</div>
            </th>
            <th className="border border-purple-800 p-1 font-normal w-[15%]">
              <div>人员费用报销单</div>
              <div className="text-[9px]">EMPLOYEE EXPENSES</div>
            </th>
            <th className="border border-purple-800 p-1 font-normal w-[15%]">
              <div>销售费用报销单</div>
              <div className="text-[9px]">MARKETING EXPENSES</div>
            </th>
            <th className="border border-purple-800 p-1 font-normal w-[10%]">
              <div>金额</div>
              <div>amount</div>
            </th>
            <th className="border border-purple-800 p-1 font-normal w-[15%]">
              <div>总部付款-账户名称</div>
              <div className="text-[9px]">Head-account name</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center font-bold">{dateStr}</td>
            {renderCell("office rent")}
            {renderCell("vehicle")}
            {renderCell("car rental")}
            {renderCell("social insurance")}
            {renderCell("exhibitions")}
            <td className="border border-purple-800 p-1 text-center" rowSpan={18}></td>
            <td className="border border-purple-800 p-1 text-center font-bold bg-purple-50/20" rowSpan={1}>DUAN LONGCHANG</td>
          </tr>
          {/* Row 2 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
              <div>员工姓名</div><div>Employee name</div>
            </td>
            {renderCell("warehouse rent")}
            {renderCell("computer")}
            {renderCell("delivery")}
            {renderCell("medical insurance")}
            {renderCell("space branding rent")}
            <td className="border border-purple-800 p-1 text-center font-bold" rowSpan={1}>
               <div>总部付款-开户银行及账号</div><div className="text-[9px]">Head-Bank & Account Number</div>
            </td>
          </tr>
          {/* Row 3 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center font-bold">{profile.full_name?.toUpperCase()}</td>
            {renderCell("electricity&water")}
            {renderCell("printer")}
            {renderCell("express")}
            {renderCell("accident insurance")}
            {renderCell("operating rental")}
            <td className="border border-purple-800 p-2 text-center font-bold text-sm" rowSpan={3}>
               {profile.bank_account || "BCA 358-0567-966"}
            </td>
          </tr>
          {/* Row 4 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
              <div>员工部门</div><div>Department</div>
            </td>
            {renderCell("property management")}
            {renderCell("projector")}
            {renderCell("gasoline")}
            {renderCell("welfare")}
            {renderCell("advertising/promotion")}
          </tr>
          {/* Row 5 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center font-bold">SC VIVO PURWOKERTO</td>
            {renderCell("office supplies")}
            {renderCell("office furniture")}
            {renderCell("parking")}
            {renderCell("training expenses")}
            {renderCell("Marketing Fee")}
          </tr>
          {/* Row 6 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
              <div>分公司付款-账户名称</div><div>Branch-account name</div>
            </td>
            {renderCell("service maintenance")}
            {renderCell("office appliances")}
            {renderCell("toll")}
            {renderCell("Service fee")}
            {renderCell("claim price protection")}
            <td className="border border-purple-800 p-1 text-center">
              <div>总部费用部审核</div><div>Head-finance approval</div>
            </td>
          </tr>
          {/* Row 7 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center font-bold">{profile.full_name?.toUpperCase()}</td>
            {renderCell("tools & spare part")}
            {renderCell("exhibitions (FA)")}
            {renderCell("repairing")}
            <td className="border border-purple-800 p-1" rowSpan={12}></td>
            {renderCell("Adv. Production/installation")}
            <td className="border border-purple-800 p-1" rowSpan={3}></td>
          </tr>
          {/* Row 8 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
              <div>分公司付款-开户银行</div><div>Branch-Opening bank</div>
            </td>
            {renderCell("drinking water")}
            {renderCell("space branding rent (FA)")}
            <td className="border border-purple-800 p-1" rowSpan={11}></td>
            {renderCell("Adv. Material")}
          </tr>
          {/* Row 9 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center font-bold">BCA</td>
            {renderCell("legal&professional fee")}
            {renderCell("operating rental (FA)")}
            {renderCell("public relation activity")}
          </tr>
          {/* Row 10 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
              <div>分公司-银行账号</div><div>Branch-Account number</div>
            </td>
            {renderCell("personnel recruitment")}
            {renderCell("office rent (Prepaid)")}
            {renderCell("BNS entertain-meals")}
            <td className="border border-purple-800 p-1 text-center">
               <div>区财务经理签字</div><div>Finance Manager Cabang</div>
            </td>
          </tr>
          {/* Row 11 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center font-bold">358-0567-966</td>
            {renderCell("document expense")}
            {renderCell("warehouse rent (Prepaid)")}
            {renderCell("BNS entertain-entertainment")}
            <td className="border border-purple-800 p-1" rowSpan={2}></td>
          </tr>
          {/* Row 12 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
              <div>分公司部门审批</div><div>Branch-Department</div>
            </td>
            {renderCell("telephone&fax")}
            {renderCell("property management (Prepaid)")}
            {renderCell("BNS entertain-hotel expense")}
          </tr>
          {/* Row 13 */}
          <tr>
            <td className="border border-purple-800 p-1" rowSpan={2}></td>
            {renderCell("internet")}
            {renderCell("vehicle rent")}
            {renderCell("BNS entertain-Transportation")}
            <td className="border border-purple-800 p-1 text-center">
               <div>总部财务经理签字</div><div>Finance Manager Pusat</div>
            </td>
          </tr>
          {/* Row 14 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
              <div>分公司费用专员审核</div><div>Branch-finance approval</div>
            </td>
            {renderCell("supplies")}
            {renderCell("asset insurance")}
            {renderCell("meeting-meals")}
            <td className="border border-purple-800 p-1" rowSpan={2}></td>
          </tr>
          {/* Row 15 */}
          <tr>
            <td className="border border-purple-800 p-1" rowSpan={2}></td>
            {renderCell("Tax Reklame")}
            {renderCell("mobil insurance")}
            {renderCell("meeting-accommodation")}
          </tr>
          {/* Row 16 */}
          <tr>
            <td className="border border-purple-800 p-1 font-bold bg-purple-50/30" colSpan={2}>
              <div>Cost reasons and completion</div>
              <div>费用支出原因及完成情况</div>
            </td>
            {renderCell("meeting-rental")}
            <td className="border border-purple-800 p-1 text-center">
               <div>总部总经理审批</div><div>The General Manager</div>
            </td>
          </tr>
          {/* Row 17 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
              <div>分公司总经理审批</div><div>The general manager</div>
            </td>
            <td className="border border-purple-800 p-1 text-[11px] font-medium align-top" colSpan={2} rowSpan={2}>
              {profile.full_name?.toUpperCase()} REIMB PAID DUAN LONGCHANG BIAYA PEMBELIAN UNTUK SERVICE CENTER VIVO PURWOKERTO
              <div className="mt-2 text-slate-700 whitespace-pre-wrap">{reimbursement.notes}</div>
            </td>
            {renderCell("meeting-gift")}
            <td className="border border-purple-800 p-1" rowSpan={2}></td>
          </tr>
          {/* Row 18 */}
          <tr>
            <td className="border border-purple-800 p-1"></td>
            <td className="border border-purple-800 p-1 text-center font-bold">
               <div>合计（小写）total（figures)</div>
            </td>
            <td className="border border-purple-800 p-1 text-center font-bold text-lg">Rp {reimbursement.total_amount?.toLocaleString('id-ID')}</td>
          </tr>
          
          {/* Row 19 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center" rowSpan={2}>
              <div>分公司付款签字</div><div>Cashier signature</div>
            </td>
            <td className="border border-purple-800 p-1 font-bold" colSpan={2}>
              <div>合计（大写）total (words)：</div>
            </td>
            <td className="border border-purple-800 p-1 font-bold" colSpan={3}>
              <div>Excluding VAT</div>
              <div>RP:</div>
            </td>
            <td className="border border-purple-800 p-1 text-center">
               <div>总部出纳员签字</div><div>Cashier signature</div>
            </td>
          </tr>
          {/* Row 20 */}
          <tr>
            <td className="border border-purple-800 p-1" colSpan={2}>
              <div>入账金额：amount AC</div>
              <div>RP: -</div>
            </td>
            <td className="border border-purple-800 p-1">
              <div>代扣税PPH 【 】</div>
              <div>RP: -</div>
            </td>
            <td className="border border-purple-800 p-1">
              <div>已付金额ADVANCE PAYMENT</div>
              <div>RP: -</div>
            </td>
            <td className="border border-purple-800 p-1">
              <div>□冲减借款Reduce borrowing</div>
              <div>□冲减预付款Reduce DP</div>
              <div>□冲减往来Reduce C A</div>
            </td>
            <td className="border border-purple-800 p-1"></td>
          </tr>
          {/* Row 21 */}
          <tr>
            <td className="border border-purple-800 p-1 text-center">
               <div>VAT</div><div>RP: -</div>
            </td>
            <td className="border border-purple-800 p-1 text-center" colSpan={2}>
               <div>其他others</div><div>RP: -</div>
            </td>
            <td className="border border-purple-800 p-1 text-center">
               <div>扣款debit</div><div>RP:</div>
            </td>
            <td className="border border-purple-800 p-1 text-center">
               <div>实付金额ACTUAL PAYMENT</div><div>RP:</div>
            </td>
            <td className="border border-purple-800 p-1 text-center" colSpan={2}>
               <div>□ Bank-BCA  □ Bank-Mandiri  □ Cash</div>
               <div>□ BOC      □ Others</div>
            </td>
            <td className="border border-purple-800 p-1 text-center">
               <div>记账签字</div><div>Ledger signature</div>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  )
}
