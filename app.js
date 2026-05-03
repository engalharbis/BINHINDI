const propertyTypes = [
  ["residentialBuilding", "سكني - عمارة", "عم", "عدد الشقق", "متوسط إيجار الشقة الشهري", "دخل إضافي"],
  ["residentialVillas", "سكني - فلل", "فل", "عدد الفلل", "متوسط إيجار الفيلا الشهري", "دخل إضافي"],
  ["commercialMall", "تجاري - مجمع تجاري", "مج", "عدد المحلات", "متوسط إيجار المحل الشهري", "دخل اللوحات أو المواقف"],
  ["commercialShowrooms", "تجاري - معارض", "مع", "عدد المعارض", "متوسط إيجار المعرض الشهري", "دخل إضافي"],
  ["industrialWorkshops", "صناعي - ورش", "ور", "عدد الورش", "متوسط إيجار الورشة الشهري", "دخل إضافي"],
  ["industrialWarehouses", "صناعي - مستودعات", "مس", "عدد المستودعات", "متوسط إيجار المستودع الشهري", "دخل خدمات أو ساحات إضافية"],
  ["hospitalityServicedApartments", "فندقي - شقق مخدومة", "فن", "عدد الغرف", "متوسط سعر الليلة ADR", "إيرادات إضافية"],
  ["rawLandDevelopment", "أرض خام / تطوير أرض", "أر", "عدد القطع أو الوحدات", "متوسط العائد الشهري للوحدة", "دخل إضافي"]
];

const steps = [
  "نوع العقار",
  "تكاليف الأرض",
  "البناء والتطوير",
  "الإيرادات",
  "المصاريف",
  "التمويل",
  "النتائج"
];

const state = {
  step: 0,
  propertyType: "residentialBuilding",
  mode: "purchase"
};

const storageKey = "realEstateInvestmentCalculator:lastProject";

const currency = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 0
});

const number = new Intl.NumberFormat("ar-SA", {
  maximumFractionDigits: 2
});

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function value(name) {
  const field = document.querySelector(`[name="${name}"]`);
  if (!field) return 0;
  if (field.type === "checkbox") return field.checked;
  const parsed = Number(field.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function rawValue(name) {
  const field = document.querySelector(`[name="${name}"]`);
  if (!field) return "";
  if (field.type === "checkbox") return field.checked;
  return field.value;
}

function percent(raw) {
  return Math.min(Math.max(raw, 0), 100) / 100;
}

function calculate() {
  const landValue = value("landArea") * value("landPricePerMeter");
  const brokerageFees = rawValue("brokerageMode") === "percentage"
    ? landValue * percent(value("brokerageFees"))
    : value("brokerageFees");
  const totalLandCost = landValue + brokerageFees + value("realEstateTransactionTax") + value("otherLandFees");
  const baseConstructionCost = value("builtUpArea") * value("constructionCostPerMeter");
  const directDevelopmentCosts = baseConstructionCost
    + value("designConsultingCost")
    + value("permitCost")
    + value("engineeringSupervisionCost")
    + value("infrastructureCost")
    + value("electricityCost")
    + value("waterCost")
    + value("civilDefenseCost")
    + value("elevatorsCost")
    + value("finishingCost");
  const contingencyAmount = directDevelopmentCosts * percent(value("contingencyPercentage"));
  const totalDevelopmentCost = directDevelopmentCosts + contingencyAmount;
  const totalProjectCost = totalLandCost + totalDevelopmentCost;

  const occupancy = percent(value("occupancyRate"));
  let annualRevenue = 0;
  let monthlyIncome = 0;
  if (state.propertyType === "hospitalityServicedApartments") {
    annualRevenue = (value("unitsCount") * value("averageMonthlyRent") * value("operatingDays") * occupancy) + value("additionalIncome");
    monthlyIncome = annualRevenue / 12;
  } else {
    monthlyIncome = (value("unitsCount") * value("averageMonthlyRent") * occupancy) + value("additionalIncome");
    annualRevenue = monthlyIncome * 12;
  }

  const annualMaintenance = rawValue("maintenanceMode") === "percentage"
    ? annualRevenue * percent(value("annualMaintenance"))
    : value("annualMaintenance");
  const fixedOperatingExpenses = annualMaintenance
    + value("security")
    + value("cleaning")
    + value("ownerUtilities")
    + value("managementOperations")
    + value("insurance")
    + value("marketing")
    + value("otherOperatingExpenses");
  const operatingExpenses = fixedOperatingExpenses + annualRevenue * percent(value("operatingExpensePercentage"));
  const noi = annualRevenue - operatingExpenses;
  const hasFinancing = value("hasFinancing");
  const debt = hasFinancing ? debtService() : { monthlyDebtService: 0, annualDebtService: 0, totalFinancingCost: 0 };
  const netIncomeAfterFinancing = noi - debt.annualDebtService;
  const yieldOnCost = totalProjectCost > 0 ? (noi / totalProjectCost) * 100 : 0;
  const roi = totalProjectCost > 0 ? (netIncomeAfterFinancing / totalProjectCost) * 100 : 0;
  const paybackPeriod = netIncomeAfterFinancing > 0 ? totalProjectCost / netIncomeAfterFinancing : 0;
  const dscr = hasFinancing && debt.annualDebtService > 0 ? noi / debt.annualDebtService : null;
  const breakEvenOccupancy = annualRevenue > 0 ? Math.min(((operatingExpenses + debt.annualDebtService) / annualRevenue) * value("occupancyRate"), 100) : 0;
  const rating = yieldOnCost >= 10 ? "ممتاز" : yieldOnCost >= 8 ? "جيد" : yieldOnCost >= 6 ? "متوسط" : "ضعيف";
  const cashFlows = Array.from({ length: 10 }, (_, index) => {
    const year = index + 1;
    const revenue = annualRevenue * Math.pow(1.025, index);
    const expenses = operatingExpenses * Math.pow(1.018, index);
    const yearNoi = revenue - expenses;
    return { year, revenue, expenses, noi: yearNoi, netAfterDebt: yearNoi - debt.annualDebtService };
  });

  return {
    landValue,
    brokerageFees,
    annualMaintenance,
    totalLandCost,
    baseConstructionCost,
    directDevelopmentCosts,
    contingencyAmount,
    totalDevelopmentCost,
    totalProjectCost,
    monthlyIncome,
    annualRevenue,
    operatingExpenses,
    noi,
    ...debt,
    netIncomeAfterFinancing,
    yieldOnCost,
    roi,
    paybackPeriod,
    dscr,
    breakEvenOccupancy,
    rating,
    cashFlows
  };
}

function debtService() {
  const principal = value("financingAmount");
  const years = value("termYears");
  const annualRate = value("annualInterestRate") / 100;
  const repaymentType = document.querySelector('[name="repaymentType"]').value;
  if (!principal || !years) return { monthlyDebtService: 0, annualDebtService: 0, totalFinancingCost: 0 };
  let annualDebtService = 0;
  let monthlyDebtService = 0;
  if (repaymentType === "annual") {
    annualDebtService = annualRate > 0
      ? principal * (annualRate * Math.pow(1 + annualRate, years)) / (Math.pow(1 + annualRate, years) - 1)
      : principal / years;
    monthlyDebtService = annualDebtService / 12;
  } else {
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    monthlyDebtService = monthlyRate > 0
      ? principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      : principal / months;
    annualDebtService = monthlyDebtService * 12;
  }
  return {
    monthlyDebtService,
    annualDebtService,
    totalFinancingCost: Math.max(annualDebtService * years - principal, 0)
  };
}

function renderPropertyTypes() {
  const grid = $("#propertyGrid");
  const titlePrefix = state.mode === "leaseInvestment" ? "استثمار - " : "";
  grid.innerHTML = propertyTypes.map(([id, title, icon]) => `
    <button class="property-card ${state.propertyType === id ? "is-selected" : ""}" type="button" data-property="${id}">
      <span class="property-icon">${icon}</span>
      <strong>${titlePrefix}${title}</strong>
    </button>
  `).join("");
}

function updatePropertyLabels() {
  const selected = propertyTypes.find(([id]) => id === state.propertyType);
  document.querySelector('[data-label="unitsCount"]').textContent = selected[3];
  document.querySelector('[data-label="averageMonthlyRent"]').textContent = selected[4];
  document.querySelector('[data-label="additionalIncome"]').textContent = selected[5];
  $(".hotel-only").classList.toggle("is-hidden", state.propertyType !== "hospitalityServicedApartments");
}

function syncOutputs() {
  const r = calculate();
  const moneyKeys = ["landValue", "totalLandCost", "baseConstructionCost", "totalDevelopmentCost", "monthlyIncome", "annualRevenue", "noi", "monthlyDebtService", "totalFinancingCost", "netIncomeAfterFinancing"];
  moneyKeys.forEach((key) => {
    const node = document.querySelector(`[data-out="${key}"]`);
    if (node) node.textContent = currency.format(r[key]);
  });
  const dscr = document.querySelector('[data-out="dscr"]');
  if (dscr) dscr.textContent = r.dscr ? number.format(r.dscr) : "لا يوجد";
  const rating = document.querySelector('[data-out="rating"]');
  if (rating) rating.textContent = r.rating;
  const builtRatio = document.querySelector('[data-out="builtRatio"]');
  if (builtRatio) builtRatio.textContent = value("landArea") > 0 ? `${number.format((value("builtUpArea") / value("landArea")) * 100)}٪` : "0٪";
  renderKpis(r);
  if (state.step === 6) renderCharts(r);
}

function renderKpis(r) {
  const grid = $("#kpiGrid");
  if (!grid) return;
  const items = [
    ["إجمالي تكلفة الأرض", currency.format(r.totalLandCost)],
    ["إجمالي تكلفة البناء والتطوير", currency.format(r.totalDevelopmentCost)],
    ["إجمالي تكلفة المشروع", currency.format(r.totalProjectCost)],
    ["إجمالي الإيراد السنوي", currency.format(r.annualRevenue)],
    ["إجمالي المصاريف التشغيلية", currency.format(r.operatingExpenses)],
    ["صافي الدخل التشغيلي NOI", currency.format(r.noi)],
    ["صافي الدخل بعد التمويل", currency.format(r.netIncomeAfterFinancing)],
    ["Yield on Cost", `${number.format(r.yieldOnCost)}٪`],
    ["ROI", `${number.format(r.roi)}٪`],
    ["Payback Period", `${number.format(r.paybackPeriod)} سنة`],
    ["القسط الشهري", currency.format(r.monthlyDebtService)],
    ["DSCR", r.dscr ? number.format(r.dscr) : "لا يوجد"],
    ["نقطة التعادل التقريبية", `${number.format(r.breakEvenOccupancy)}٪`]
  ];
  grid.innerHTML = items.map(([label, val]) => `<div class="kpi-card"><span>${label}</span><strong>${val}</strong></div>`).join("");
}

function validateStep() {
  const fail = (message) => {
    $("#errorMessage").textContent = message;
    $("#errorMessage").classList.remove("is-hidden");
    return false;
  };
  $("#errorMessage").classList.add("is-hidden");
  if (state.step === 1 && (!value("landArea") || !value("landPricePerMeter"))) return fail("أدخل مساحة الأرض وسعر المتر بقيم أكبر من صفر.");
  if (state.step === 3 && (!value("unitsCount") || !value("averageMonthlyRent"))) return fail("أدخل عدد الوحدات ومتوسط الإيجار أو السعر.");
  if (state.step === 4 && value("operatingExpensePercentage") > 100) return fail("نسبة المصاريف التشغيلية يجب ألا تتجاوز 100٪.");
  if (state.step === 5 && value("hasFinancing") && (!value("financingAmount") || !value("termYears"))) return fail("أدخل مبلغ التمويل ومدة التمويل.");
  return true;
}

function goToStep(step) {
  state.step = Math.min(Math.max(step, 0), steps.length - 1);
  $$(".step").forEach((node) => node.classList.toggle("is-hidden", Number(node.dataset.step) !== state.step));
  $("#stepTitle").textContent = steps[state.step];
  $("#stepLabel").textContent = `المرحلة ${state.step + 1} من ${steps.length}`;
  $("#progressFill").style.width = `${((state.step + 1) / steps.length) * 100}%`;
  document.querySelector("[data-prev]").classList.toggle("is-hidden", state.step === 0);
  document.querySelector("[data-next]").textContent = state.step === steps.length - 2 ? "حساب النتائج" : state.step === steps.length - 1 ? "تصدير PDF" : "التالي";
  syncOutputs();
}

function drawPie(canvas, items) {
  const ctx = canvas.getContext("2d");
  const total = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!total) return drawEmpty(ctx, canvas);
  const colors = ["#11110f", "#c69b4f", "#716b60", "#e6d5ad", "#d8d8d8"];
  let start = -Math.PI / 2;
  items.forEach((item, index) => {
    const slice = (item.value / total) * Math.PI * 2;
    const middle = start + slice / 2;
    ctx.beginPath();
    ctx.moveTo(160, 115);
    ctx.arc(160, 115, 86, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    if (slice > 0.26) {
      const labelX = 160 + Math.cos(middle) * 54;
      const labelY = 115 + Math.sin(middle) * 54;
      ctx.fillStyle = index === 0 ? "#ffffff" : "#11110f";
      ctx.font = "bold 11px Tahoma";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round((item.value / total) * 100)}٪`, labelX, labelY);
    }
    start += slice;
  });
  ctx.font = "11px Tahoma";
  ctx.textAlign = "right";
  items.slice(0, 5).forEach((item, index) => {
    const y = 218 + index * 16;
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(230, y - 9, 10, 10);
    ctx.fillStyle = "#68645c";
    ctx.fillText(`${item.label}: ${number.format((item.value / total) * 100)}٪`, 222, y);
  });
}

function drawBar(canvas, items) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const max = Math.max(...items.map((item) => Math.max(item.value, 0)), 1);
  items.forEach((item, index) => {
    const w = 46;
    const h = (Math.max(item.value, 0) / max) * 160;
    const x = 36 + index * 70;
    const y = 198 - h;
    ctx.fillStyle = "#c69b4f";
    roundRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = "#68645c";
    ctx.font = "12px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText(item.label, x + w / 2, 226);
    ctx.fillStyle = "#11110f";
    ctx.font = "bold 10px Tahoma";
    ctx.fillText(compactMoney(item.value), x + w / 2, Math.max(y - 8, 14));
  });
}

function drawLine(canvas, flows) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const values = flows.map((flow) => flow.netAfterDebt);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  ctx.strokeStyle = "#11110f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((val, index) => {
    const x = 42 + index * ((canvas.width - 84) / 9);
    const y = 205 - ((val - min) / range) * 160;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = "#c69b4f";
  values.forEach((val, index) => {
    const x = 42 + index * ((canvas.width - 84) / 9);
    const y = 205 - ((val - min) / range) * 160;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    if (index === 0 || index === values.length - 1 || index === 4) {
      ctx.fillStyle = "#11110f";
      ctx.font = "bold 11px Tahoma";
      ctx.textAlign = "center";
      ctx.fillText(compactMoney(val), x, Math.max(y - 10, 14));
      ctx.fillStyle = "#c69b4f";
    }
  });
}

function compactMoney(value) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${number.format(value / 1000000)}م`;
  if (abs >= 1000) return `${number.format(value / 1000)}ألف`;
  return number.format(value);
}

function drawEmpty(ctx, canvas) {
  ctx.fillStyle = "#68645c";
  ctx.font = "15px Tahoma";
  ctx.textAlign = "center";
  ctx.fillText("أدخل البيانات لعرض الرسم", canvas.width / 2, canvas.height / 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function renderCharts(r) {
  drawPie($("#pieChart"), [
    { label: "الأرض", value: r.landValue },
    { label: "البناء", value: r.baseConstructionCost },
    { label: "الرسوم", value: value("brokerageFees") + value("realEstateTransactionTax") + value("otherLandFees") + value("permitCost") },
    { label: "الاحتياطي", value: r.contingencyAmount },
    { label: "أخرى", value: Math.max(r.totalProjectCost - r.landValue - r.baseConstructionCost - r.contingencyAmount, 0) }
  ]);
  drawBar($("#barChart"), [
    { label: "الإيراد", value: r.annualRevenue },
    { label: "المصاريف", value: r.operatingExpenses },
    { label: "NOI", value: r.noi },
    { label: "بعد التمويل", value: r.netIncomeAfterFinancing }
  ]);
  drawLine($("#lineChart"), r.cashFlows);
}

function buildReport() {
  const r = calculate();
  renderCharts(r);
  const selected = propertyTypes.find(([id]) => id === state.propertyType);
  const pieImage = $("#pieChart")?.toDataURL("image/png") ?? "";
  const barImage = $("#barChart")?.toDataURL("image/png") ?? "";
  const lineImage = $("#lineChart")?.toDataURL("image/png") ?? "";
  const row = (label, val) => `<tr><td>${label}</td><td>${val}</td></tr>`;
  const table = (title, rows) => `<section class="report-section"><h2>${title}</h2><table>${rows.join("")}</table></section>`;
  $("#printReport").innerHTML = `
    <article class="report-page report-cover">
      <img class="report-logo" src="/assets/logo.svg" alt="بداية الطريق العقارية">
      <p class="gold">Real Estate Investment Calculator</p>
      <h1>تقرير جدوى الاستثمار العقاري</h1>
      <p>تاريخ إنشاء التقرير: ${new Date().toLocaleString("ar-SA")}</p>
      <p>نوع العملية: ${state.mode === "purchase" ? "شراء عقار" : "استثمار على أرض مستأجرة"}</p>
      <p>نوع العقار: ${selected[1]}</p>
      <p>ملخص تنفيذي: تبلغ تكلفة المشروع ${currency.format(r.totalProjectCost)}، بإيراد سنوي ${currency.format(r.annualRevenue)} وصافي دخل تشغيلي ${currency.format(r.noi)}. العائد السنوي على التكلفة ${number.format(r.yieldOnCost)}٪ والتقييم ${r.rating}.</p>
      <div class="report-grid">
        <div class="report-kpi">إجمالي تكلفة المشروع<strong>${currency.format(r.totalProjectCost)}</strong></div>
        <div class="report-kpi">Yield on Cost<strong>${number.format(r.yieldOnCost)}٪</strong></div>
        <div class="report-kpi">NOI<strong>${currency.format(r.noi)}</strong></div>
        <div class="report-kpi">التقييم<strong>${r.rating}</strong></div>
      </div>
    </article>
    <article class="report-page">
      <img class="report-watermark" src="/assets/logo.svg" alt="">
      ${table("المدخلات الأساسية", [
        row("نوع العملية", state.mode === "purchase" ? "شراء عقار" : "استثمار على أرض مستأجرة"),
        row("نوع العقار", selected[1]),
        row("مساحة الأرض", `${number.format(value("landArea"))} م²`),
        row("مسطح البناء", `${number.format(value("builtUpArea"))} م²`),
        row("نسبة المسطح إلى الأرض", value("landArea") > 0 ? `${number.format((value("builtUpArea") / value("landArea")) * 100)}٪` : "0٪"),
        row("نسبة الإشغال", `${number.format(value("occupancyRate"))}٪`)
      ])}
      ${table("تكاليف الأرض", [
        row("إجمالي قيمة الأرض", currency.format(r.landValue)),
        row("رسوم السعي أو الوساطة", currency.format(r.brokerageFees)),
        row("ضريبة التصرفات العقارية", currency.format(value("realEstateTransactionTax"))),
        row("رسوم أخرى", currency.format(value("otherLandFees"))),
        row("إجمالي تكلفة تملك الأرض", currency.format(r.totalLandCost))
      ])}
      ${table("تكاليف البناء والتطوير", [
        row("إجمالي تكلفة البناء", currency.format(r.baseConstructionCost)),
        row("تكاليف التصميم والتراخيص والإشراف", currency.format(value("designConsultingCost") + value("permitCost") + value("engineeringSupervisionCost"))),
        row("البنية التحتية والكهرباء والمياه والدفاع المدني", currency.format(value("infrastructureCost") + value("electricityCost") + value("waterCost") + value("civilDefenseCost"))),
        row("المصاعد والتشطيبات", currency.format(value("elevatorsCost") + value("finishingCost"))),
        row("احتياطي المخاطر", currency.format(r.contingencyAmount)),
        row("إجمالي تكلفة التطوير", currency.format(r.totalDevelopmentCost))
      ])}
    </article>
    <article class="report-page">
      <img class="report-watermark" src="/assets/logo.svg" alt="">
      ${table("الإيرادات", [
        row(selected[3], number.format(value("unitsCount"))),
        row(selected[4], currency.format(value("averageMonthlyRent"))),
        row("الدخل الإضافي", currency.format(value("additionalIncome"))),
        row("إجمالي الدخل الشهري", currency.format(r.monthlyIncome)),
        row("إجمالي الدخل السنوي", currency.format(r.annualRevenue))
      ])}
      ${table("المصاريف التشغيلية", [
        row("الصيانة السنوية", currency.format(r.annualMaintenance)),
        row("إجمالي المصاريف التشغيلية", currency.format(r.operatingExpenses)),
        row("NOI", currency.format(r.noi))
      ])}
      ${value("hasFinancing") ? table("التمويل", [
        row("مبلغ التمويل", currency.format(value("financingAmount"))),
        row("مدة التمويل", `${number.format(value("termYears"))} سنة`),
        row("نسبة الفائدة أو الربح", `${number.format(value("annualInterestRate"))}٪`),
        row("القسط الشهري", currency.format(r.monthlyDebtService)),
        row("إجمالي تكلفة التمويل", currency.format(r.totalFinancingCost)),
        row("DSCR", r.dscr ? number.format(r.dscr) : "غير متاح")
      ]) : ""}
      ${table("النتائج والمؤشرات", [
        row("إجمالي تكلفة المشروع", currency.format(r.totalProjectCost)),
        row("صافي الدخل بعد التمويل", currency.format(r.netIncomeAfterFinancing)),
        row("Yield on Cost", `${number.format(r.yieldOnCost)}٪`),
        row("ROI", `${number.format(r.roi)}٪`),
        row("فترة استرداد رأس المال", `${number.format(r.paybackPeriod)} سنة`),
        row("نقطة التعادل التقريبية", `${number.format(r.breakEvenOccupancy)}٪`),
        row("التقييم المختصر", r.rating)
      ])}
    </article>
    <article class="report-page">
      <img class="report-watermark" src="/assets/logo.svg" alt="">
      <section class="report-section">
        <h2>الرسوم البيانية</h2>
        <div class="report-charts">
          <figure><img src="${pieImage}" alt="توزيع تكلفة المشروع"><figcaption>توزيع تكلفة المشروع</figcaption></figure>
          <figure><img src="${barImage}" alt="مقارنة الدخل والمصاريف"><figcaption>مقارنة الدخل والمصاريف</figcaption></figure>
          <figure class="wide"><img src="${lineImage}" alt="التدفقات النقدية لعشر سنوات"><figcaption>التدفقات النقدية لعشر سنوات</figcaption></figure>
        </div>
      </section>
      <section class="report-section"><h2>التوصية المختصرة</h2><p>${recommendation(r.rating)}</p></section>
      <p class="report-note">هذا التقرير تقديري ولا يغني عن الدراسة المالية والهندسية التفصيلية.</p>
    </article>
  `;
}

async function exportPDF() {
  buildReport();
  const report = $("#printReport");
  const actions = $(".pdf-actions");
  const button = document.querySelector("[data-export]");
  actions?.classList.add("is-exporting");
  if (button) button.textContent = "جاري إنشاء PDF...";
  try {
    if (!window.html2canvas || !window.jspdf) {
      throw new Error("PDF libraries are not ready");
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pages = [...report.querySelectorAll(".report-page")];
    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await window.html2canvas(pages[index], {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      });
      const img = canvas.toDataURL("image/jpeg", 0.96);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      if (index > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);
    }
    pdf.save(`تقرير-جدوى-الاستثمار-العقاري-${Date.now()}.pdf`);
    saveProject();
  } catch (error) {
    $("#errorMessage").textContent = "تعذر إنشاء PDF مباشرة. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.";
    $("#errorMessage").classList.remove("is-hidden");
  } finally {
    actions?.classList.remove("is-exporting");
    if (button) button.textContent = "تصدير تقرير PDF";
  }
}

function recommendation(rating) {
  if (rating === "ممتاز") return "المؤشرات قوية والعائد يتجاوز 10٪. يوصى بالانتقال إلى دراسة تفصيلية تشمل حساسية الإشغال والتكلفة.";
  if (rating === "جيد") return "العائد جيد ومناسب للمراجعة الاستثمارية مع ضرورة ضبط تكاليف التنفيذ وشروط التمويل.";
  if (rating === "متوسط") return "العائد متوسط. يفضل تحسين الإيجارات أو خفض تكلفة الأرض أو البناء قبل اتخاذ قرار نهائي.";
  return "العائد أقل من المستوى المستهدف. يوصى بإعادة التفاوض على التكلفة أو إعادة تصميم نموذج الإيرادات.";
}

function collectProject() {
  const fields = {};
  $$("input, select").forEach((field) => {
    fields[field.name] = field.type === "checkbox" ? field.checked : field.value;
  });
  return {
    mode: state.mode,
    propertyType: state.propertyType,
    step: state.step,
    fields,
    savedAt: new Date().toISOString(),
    result: calculate()
  };
}

function saveProject() {
  localStorage.setItem(storageKey, JSON.stringify(collectProject()));
  const saveButton = document.querySelector("[data-save-project]");
  if (saveButton) {
    const oldText = saveButton.textContent;
    saveButton.textContent = "تم حفظ المشروع";
    setTimeout(() => { saveButton.textContent = oldText; }, 1600);
  }
}

function loadProject() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    $("#errorMessage").textContent = "لا يوجد مشروع محفوظ على هذا المتصفح.";
    $("#errorMessage").classList.remove("is-hidden");
    return false;
  }
  const project = JSON.parse(saved);
  state.mode = project.mode || "purchase";
  state.propertyType = project.propertyType || "residentialBuilding";
  Object.entries(project.fields || {}).forEach(([name, savedValue]) => {
    const field = document.querySelector(`[name="${name}"]`);
    if (!field) return;
    if (field.type === "checkbox") field.checked = Boolean(savedValue);
    else field.value = savedValue;
  });
  renderPropertyTypes();
  updatePropertyLabels();
  $(".finance-fields").classList.toggle("is-hidden", !value("hasFinancing"));
  $(".finance-empty").classList.toggle("is-hidden", value("hasFinancing"));
  $("#splash").classList.add("is-hidden");
  $("#wizard").classList.remove("is-hidden");
  goToStep(Math.min(project.step || 0, steps.length - 1));
  return true;
}

function resetAll() {
  document.getElementById("calculatorForm").reset();
  state.propertyType = "residentialBuilding";
  state.mode = "purchase";
  state.step = 0;
  renderPropertyTypes();
  updatePropertyLabels();
  goToStep(0);
}

document.addEventListener("input", (event) => {
  if (event.target.matches("input, select")) {
    if (event.target.type === "number" && Number(event.target.value) < 0) event.target.value = 0;
    if (event.target.name === "constructionLandRatio" && value("landArea") > 0) {
      document.querySelector('[name="builtUpArea"]').value = (value("landArea") * value("constructionLandRatio")) / 100;
    }
    if (event.target.name === "builtUpArea" && value("landArea") > 0) {
      document.querySelector('[name="constructionLandRatio"]').value = (value("builtUpArea") / value("landArea")) * 100;
    }
    $(".finance-fields").classList.toggle("is-hidden", !value("hasFinancing"));
    $(".finance-empty").classList.toggle("is-hidden", value("hasFinancing"));
    syncOutputs();
    saveProject();
  }
});

document.addEventListener("click", (event) => {
  const property = event.target.closest("[data-property]");
  if (property) {
    state.propertyType = property.dataset.property;
    renderPropertyTypes();
    updatePropertyLabels();
    syncOutputs();
  }
  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    state.mode = modeButton.dataset.mode;
    state.propertyType = state.mode === "leaseInvestment" ? "commercialShowrooms" : "residentialBuilding";
    renderPropertyTypes();
    updatePropertyLabels();
    $("#splash").classList.add("is-hidden");
    $("#wizard").classList.remove("is-hidden");
    goToStep(0);
    saveProject();
  }
  if (event.target.matches("[data-load-project]")) {
    loadProject();
  }
  if (event.target.matches("[data-next]")) {
    if (state.step === steps.length - 1) {
      exportPDF();
    } else if (validateStep()) {
      goToStep(state.step + 1);
      if (state.step === steps.length - 1) saveProject();
    }
  }
  if (event.target.matches("[data-prev]")) goToStep(state.step - 1);
  if (event.target.matches("[data-reset]")) resetAll();
  if (event.target.matches("[data-save-project]")) saveProject();
  if (event.target.matches("[data-export]")) {
    exportPDF();
  }
});

renderPropertyTypes();
updatePropertyLabels();
syncOutputs();
