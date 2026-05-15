const propertyTypes = [
  ["residentialBuilding", "سكني - عمارة", "🏢", "عدد الشقق", "متوسط إيجار الشقة الشهري", "دخل إضافي"],
  ["residentialVillas", "سكني - فلل", "🏡", "عدد الفلل", "متوسط إيجار الفيلا الشهري", "دخل إضافي"],
  ["commercialMall", "تجاري - مجمع تجاري", "🏬", "عدد المحلات", "متوسط إيجار المحل الشهري", "دخل اللوحات أو المواقف"],
  ["commercialShowrooms", "تجاري - معارض", "🛍", "عدد المعارض", "متوسط إيجار المعرض الشهري", "دخل إضافي"],
  ["industrialWarehouses", "صناعي - مستودعات", "🏭", "عدد المستودعات", "متوسط إيجار المستودع الشهري", "دخل خدمات أو ساحات إضافية"],
  ["industrialWorkshops", "صناعي - ورش", "🛠", "عدد الورش", "متوسط إيجار الورشة الشهري", "دخل إضافي"],
  ["hospitalityServicedApartments", "فندقي - شقق مخدومة", "🏨", "عدد الغرف", "متوسط سعر الليلة ADR", "إيرادات إضافية"],
  ["rawLandDevelopment", "أرض خام / تطوير أرض", "🏗", "عدد القطع أو الوحدات", "متوسط العائد الشهري للوحدة", "دخل إضافي"]
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
  mode: "purchase",
  transactionType: "rent"
};

const storageKey = "realEstateInvestmentCalculator:lastProject";
const projectsStorageKey = "realEstateInvestmentCalculator:projects";
let activeProjectId = null;

const englishNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

const number = englishNumber;

function money(value) {
  return `SAR ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0)}`;
}

const currency = { format: money };

function tableMoney(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

function stripSAR(value) {
  return typeof value === "string" ? value.replace(/^SAR\s*/, "") : value;
}

const chartMeta = {
  pie: [],
  line: []
};

let chartFocusSeries = null;

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
  const annualLandRentPerMeter = state.mode === "leaseInvestment" ? value("annualLandRent") : 0;
  const annualLandRent = state.mode === "leaseInvestment" ? value("landArea") * annualLandRentPerMeter : 0;
  const brokerageFees = rawValue("brokerageMode") === "percentage"
    ? (state.mode === "leaseInvestment" ? annualLandRent : landValue) * percent(value("brokerageFees"))
    : value("brokerageFees");
  const transactionTax = rawValue("transactionTaxMode") === "percentage" ? landValue * percent(value("realEstateTransactionTax")) : value("realEstateTransactionTax");
  const totalLandCost = state.mode === "leaseInvestment"
    ? brokerageFees + value("otherLandFees")
    : landValue + brokerageFees + transactionTax + value("otherLandFees");
  const building = buildingMetrics();
  if (rawValue("builtAreaMode") === "manual") document.querySelector('[name="builtUpArea"]').value = building.area || 0;
  const baseConstructionCost = building.cost;
  const additionalCosts = rawValue("additionalCostMode") === "detailed"
    ? value("designConsultingCost")
      + value("permitCost")
      + value("engineeringSupervisionCost")
      + value("infrastructureCost")
      + value("electricityCost")
      + value("waterCost")
      + value("civilDefenseCost")
      + value("elevatorsCost")
      + value("otherDevelopmentCost")
    : baseConstructionCost * percent(value("additionalCostPercentage"));
  const directDevelopmentCosts = baseConstructionCost + additionalCosts;
  const contingencyAmount = directDevelopmentCosts * percent(value("contingencyPercentage"));
  const totalDevelopmentCost = directDevelopmentCosts + contingencyAmount;
  const totalProjectCost = totalLandCost + totalDevelopmentCost;

  const occupancy = percent(value("occupancyRate"));
  let annualRevenue = 0;
  let monthlyIncome = 0;
  if (state.transactionType === "sale") {
    annualRevenue = rawValue("saleMethod") === "units"
      ? ((value("unitsCount") + value("otherSaleUnits")) * value("averageMonthlyRent")) + value("additionalIncome")
      : (netArea() * value("averageMonthlyRent")) + value("additionalIncome");
    monthlyIncome = annualRevenue / 12;
  } else if (state.propertyType === "hospitalityServicedApartments") {
    annualRevenue = (value("unitsCount") * value("averageMonthlyRent") * value("operatingDays") * occupancy) + value("additionalIncome");
    monthlyIncome = annualRevenue / 12;
  } else {
    annualRevenue = (value("unitsCount") * value("averageMonthlyRent") * occupancy) + value("additionalIncome");
    monthlyIncome = annualRevenue / 12;
  }

  const annualMaintenance = rawValue("maintenanceMode") === "percentage"
    ? annualRevenue * percent(value("annualMaintenance"))
    : value("annualMaintenance");
  const operatingDetails = rawValue("operatingExpenseMode") === "detailed"
    ? value("managementOperations")
      + value("cleaning")
      + value("operatingElectricity")
      + value("operatingWater")
      + value("security")
      + value("insurance")
      + value("otherOperatingExpenses")
    : annualRevenue * percent(value("operatingExpensePercentage"));
  const operatingExpenses = annualMaintenance + operatingDetails;
  const noi = annualRevenue - operatingExpenses - annualLandRent;
  const hasFinancing = value("hasFinancing");
  const debt = hasFinancing ? debtService(totalProjectCost) : { monthlyDebtService: 0, annualDebtService: 0, totalFinancingCost: 0, financingAmount: 0, financingRatio: 0, financingSchedule: [] };
  const firstDebtService = firstPayableDebtService(debt);
  const netIncomeAfterFinancing = state.transactionType === "sale"
    ? annualRevenue - totalProjectCost - firstDebtService
    : noi - firstDebtService;
  const yieldOnCost = totalProjectCost > 0 ? (noi / totalProjectCost) * 100 : 0;
  const capRate = totalProjectCost > 0 ? (noi / totalProjectCost) * 100 : 0;
  const roi = totalProjectCost > 0 ? (netIncomeAfterFinancing / totalProjectCost) * 100 : 0;
  const paybackBase = state.mode === "leaseInvestment" ? totalDevelopmentCost : totalProjectCost;
  const paybackPeriod = netIncomeAfterFinancing > 0 ? paybackBase / netIncomeAfterFinancing : 0;
  const dscr = hasFinancing && firstDebtService > 0 ? noi / firstDebtService : null;
  const breakEvenOccupancy = annualRevenue > 0 ? Math.min(((operatingExpenses + firstDebtService) / annualRevenue) * value("occupancyRate"), 100) : 0;
  const rating = rentRating(yieldOnCost);
  const oneTimeContractFees = state.mode === "leaseInvestment" ? totalLandCost : 0;
  let cumulative = -paybackBase;
  let paybackYear = null;
  const cashFlows = state.transactionType === "sale" ? [{
    year: 1,
    revenue: annualRevenue,
    landRent: 0,
    expenses: 0,
    contractFees: 0,
    financing: firstDebtService,
    noi,
    netAfterDebt: annualRevenue - firstDebtService,
    cumulative: -paybackBase + annualRevenue - firstDebtService
  }] : Array.from({ length: 10 }, (_, index) => {
    const year = index + 1;
    const revenue = annualRevenue * Math.pow(1.025, index);
    const expenses = operatingExpenses * Math.pow(1.018, index);
    const landRentInfo = landRentForYear(annualLandRent, year);
    const landRent = landRentInfo.amount;
    const contractFees = index === 0 ? oneTimeContractFees : 0;
    const yearNoi = revenue - expenses - landRent;
    const financing = debt.financingSchedule?.[index]?.payment || 0;
    const netAfterDebt = yearNoi - financing - contractFees;
    cumulative += netAfterDebt;
    if (!paybackYear && cumulative >= 0) paybackYear = year;
    return { year, revenue, landRent, landRentGrace: landRentInfo.isGrace, expenses, contractFees, financing, noi: yearNoi, netAfterDebt, cumulative };
  });
  if (!paybackYear && cashFlows.find((flow) => flow.cumulative >= 0)) paybackYear = cashFlows.find((flow) => flow.cumulative >= 0).year;
  const npv = -paybackBase + cashFlows.reduce((sum, flow) => sum + flow.netAfterDebt / Math.pow(1.10, flow.year), 0);
  const irr = calculateIRR([-paybackBase, ...cashFlows.map((flow) => flow.netAfterDebt)]);

  return {
    landValue,
    annualLandRentPerMeter,
    annualLandRent,
    brokerageFees,
    transactionTax,
    annualMaintenance,
    additionalCosts,
    totalLandCost,
    baseConstructionCost,
    directDevelopmentCosts,
    contingencyAmount,
    totalDevelopmentCost,
    totalProjectCost,
    paybackBase,
    oneTimeContractFees,
    monthlyIncome,
    annualRevenue,
    operatingExpenses,
    noi,
    ...debt,
    netIncomeAfterFinancing,
    yieldOnCost,
    capRate,
    roi,
    paybackPeriod,
    dscr,
    breakEvenOccupancy,
    rating,
    cashFlows,
    npv,
    irr,
    paybackYear
  };
}

function landRentForYear(baseAnnualRent, year) {
  if (!baseAnnualRent || state.mode !== "leaseInvestment") return { amount: 0, isGrace: false };
  const graceYears = value("landRentGracePeriod");
  const yearStart = year - 1;
  const yearEnd = year;
  if (yearEnd <= graceYears) return { amount: 0, isGrace: true };
  const payableFraction = Math.min(Math.max(yearEnd - Math.max(yearStart, graceYears), 0), 1);
  if (payableFraction <= 0) return { amount: 0, isGrace: true };
  const completedPayableYears = Math.max(0, Math.floor(yearStart - graceYears));
  const amount = baseAnnualRent * Math.pow(1 + percent(value("annualLandRentEscalation")), completedPayableYears) * payableFraction;
  return { amount, isGrace: payableFraction < 1 && yearStart < graceYears };
}

function debtService(totalProjectCost) {
  const financingMode = rawValue("financingMode") || "amount";
  const principal = financingMode === "ratio" ? totalProjectCost * percent(value("financingRatio")) : value("financingAmount");
  const years = value("termYears");
  if (!principal || !years) return { monthlyDebtService: 0, annualDebtService: 0, totalFinancingCost: 0, financingAmount: 0, financingRatio: 0, financingSchedule: [] };
  const schedule = financingSchedule(principal, years);
  const annualDebtService = firstPayableDebtService({ financingSchedule: schedule });
  const monthlyDebtService = annualDebtService / 12;
  const totalFinancingCost = schedule.reduce((sum, item) => sum + item.interest, 0);
  return {
    financingAmount: principal,
    financingRatio: totalProjectCost > 0 ? (principal / totalProjectCost) * 100 : 0,
    monthlyDebtService,
    annualDebtService,
    totalFinancingCost,
    financingSchedule: schedule
  };
}

function financingSchedule(principal, years) {
  const annualRate = value("annualInterestRate") / 100;
  const repaymentType = rawValue("repaymentType") || "annual";
  const paymentsPerYear = repaymentType === "quarterly" ? 4 : repaymentType === "semiannual" ? 2 : 1;
  const graceYears = value("gracePeriod");
  const fullGraceYears = Math.floor(graceYears);
  const hasHalfGrace = graceYears % 1 >= 0.5;
  const repaymentYears = Math.max(years - graceYears, 0.5);
  const periodRate = annualRate / paymentsPerYear;
  const periods = Math.max(Math.round(repaymentYears * paymentsPerYear), 1);
  const periodPayment = periodRate > 0
    ? principal * (periodRate * Math.pow(1 + periodRate, periods)) / (Math.pow(1 + periodRate, periods) - 1)
    : principal / periods;
  let balance = principal;
  return Array.from({ length: Math.ceil(years) }, (_, index) => {
    const year = index + 1;
    let payment = 0;
    let principalPaid = 0;
    let interest = 0;
    const yearPeriods = hasHalfGrace && year === fullGraceYears + 1 ? Math.max(paymentsPerYear / 2, 1) : paymentsPerYear;
    const inFullGrace = year <= fullGraceYears;
    if (!inFullGrace && balance > 0) {
      for (let period = 0; period < yearPeriods && balance > 0; period += 1) {
        const periodInterest = balance * periodRate;
        const periodPrincipal = Math.min(Math.max(periodPayment - periodInterest, 0), balance);
        interest += periodInterest;
        principalPaid += periodPrincipal;
        payment += periodInterest + periodPrincipal;
        balance = Math.max(balance - periodPrincipal, 0);
      }
    }
    return { year, payment, principal: principalPaid, interest, balance };
  });
}

function firstPayableDebtService(debt) {
  return debt.financingSchedule?.find((item) => item.payment > 0)?.payment || debt.annualDebtService || 0;
}

function defaultOperatingRate() {
  if (state.propertyType === "hospitalityServicedApartments") return 0.05;
  if (state.propertyType === "commercialMall" || state.propertyType === "commercialShowrooms") return 0.025;
  if (state.propertyType === "industrialWarehouses" || state.propertyType === "industrialWorkshops") return 0.02;
  return 0.02;
}

function rentRating(yieldOnCost) {
  if (yieldOnCost >= 12) return "ممتاز جداً";
  if (yieldOnCost >= 10) return "ممتاز";
  if (yieldOnCost >= 9) return "جيد جداً";
  if (yieldOnCost >= 8) return "جيد";
  return "ضعيف";
}

function calculateIRR(flows) {
  let rate = 0.1;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    let npv = 0;
    let derivative = 0;
    flows.forEach((flow, index) => {
      npv += flow / Math.pow(1 + rate, index);
      if (index > 0) derivative -= index * flow / Math.pow(1 + rate, index + 1);
    });
    if (Math.abs(derivative) < 0.000001) break;
    const next = rate - npv / derivative;
    if (!Number.isFinite(next) || next <= -0.99) break;
    if (Math.abs(next - rate) < 0.000001) {
      rate = next;
      break;
    }
    rate = next;
  }
  return Number.isFinite(rate) ? rate * 100 : 0;
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
  document.querySelector('[data-label="unitsCount"]').textContent = state.transactionType === "sale" ? "عدد الوحدات المعروضة للبيع" : selected[3];
  document.querySelector('[data-label="averageMonthlyRent"]').textContent = state.transactionType === "sale"
    ? (rawValue("saleMethod") === "units" ? "متوسط سعر بيع الوحدة" : "سعر البيع للمتر")
    : selected[4].replace("الشهري", "السنوي");
  document.querySelector('[data-label="additionalIncome"]').textContent = state.transactionType === "sale" ? "مبيعات أخرى" : selected[5];
  document.querySelector('[data-label="additionalIncomeHint"]').textContent = state.transactionType === "sale" ? "(مبيعات أو إيرادات بيع أخرى)" : "(محلات، معارض، خدمات أخرى)";
  document.querySelector('[data-label="annualRevenueTitle"]').textContent = state.transactionType === "sale" ? "إجمالي المبيعات" : "إجمالي الدخل السنوي";
  document.querySelector('[data-label="totalLandCost"]').textContent = state.mode === "leaseInvestment" ? "تكاليف تأسيس الأرض المستأجرة" : "إجمالي تكلفة تملك الأرض";
  $(".hotel-only").classList.toggle("is-hidden", state.propertyType !== "hospitalityServicedApartments");
  $$(".segment-card").forEach((button) => button.classList.toggle("is-selected", button.dataset.transaction === state.transactionType));
  document.querySelector('[data-transaction="sale"]')?.classList.toggle("is-hidden", state.mode === "leaseInvestment");
  $$(".rent-only").forEach((node) => node.classList.toggle("is-hidden", state.transactionType === "sale"));
  $$(".sale-only").forEach((node) => node.classList.toggle("is-hidden", state.transactionType !== "sale"));
  $$(".sale-units-only").forEach((node) => node.classList.toggle("is-hidden", state.transactionType !== "sale" || rawValue("saleMethod") !== "units"));
  $$(".unit-count-field").forEach((node) => node.classList.toggle("is-hidden", state.transactionType === "sale" && rawValue("saleMethod") === "meter"));
  $$(".operating-details, .operating-percentage").forEach((node) => node.closest(".step")?.classList.toggle("sale-muted", state.transactionType === "sale"));
}

function syncOutputs() {
  syncVisibility();
  const r = calculate();
  const moneyKeys = ["landValue", "totalAnnualLandRent", "totalLandCost", "baseConstructionCost", "totalDevelopmentCost", "monthlyIncome", "annualRevenue", "operatingExpenses", "noi", "monthlyDebtService", "annualDebtService", "totalFinancingCost", "netIncomeAfterFinancing"];
  moneyKeys.forEach((key) => {
    const node = document.querySelector(`[data-out="${key}"]`);
    if (node) node.textContent = currency.format(key === "totalAnnualLandRent" ? r.annualLandRent : r[key]);
  });
  const dscr = document.querySelector('[data-out="dscr"]');
  if (dscr) dscr.textContent = r.dscr ? number.format(r.dscr) : "لا يوجد";
  const rating = document.querySelector('[data-out="rating"]');
  if (rating) {
    const smartRating = state.transactionType === "sale" ? saleRating(r) : r.rating;
    rating.textContent = smartRating;
    rating.parentElement.dataset.rating = smartRating;
  }
  const ratingMeta = document.querySelector('[data-out="ratingMeta"]');
  if (ratingMeta) ratingMeta.textContent = state.transactionType === "sale"
    ? `هامش الربح ${number.format(saleMargin(r))}% · ROI ${number.format(r.roi)}%`
    : `${state.mode === "leaseInvestment" ? "استرداد التطوير" : "الاسترداد"} ${number.format(r.paybackPeriod)} سنة · Yield ${number.format(r.yieldOnCost)}%`;
  const builtRatio = document.querySelector('[data-out="builtRatio"]');
  if (builtRatio) builtRatio.textContent = value("landArea") > 0 ? `${number.format((value("builtUpArea") / value("landArea")) * 100)}٪` : "0٪";
  const calculatedBuiltArea = document.querySelector('[data-out="calculatedBuiltArea"]');
  const building = buildingMetrics();
  if (calculatedBuiltArea) calculatedBuiltArea.textContent = `${number.format(building.area || calculatedArea())} م²`;
  document.querySelector('[data-out="landAreaReadonly"]').textContent = `${number.format(value("landArea"))} م²`;
  document.querySelector('[data-out="serviceArea"]').textContent = `${number.format(serviceArea())} م²`;
  document.querySelector('[data-out="netSellableArea"]').textContent = `${number.format(netArea())} م²`;
  document.querySelector('[name="builtUpArea"]').readOnly = rawValue("builtAreaMode") === "auto";
  document.querySelector('[data-out="basementArea"]').textContent = `${number.format(building.basementArea || 0)} م²`;
  const groundFloorAreaOut = document.querySelector('[data-out="groundFloorArea"]');
  if (groundFloorAreaOut) groundFloorAreaOut.textContent = `${number.format(building.groundArea || floorPlateArea())} م²`;
  document.querySelector('[data-out="repeatedFloorsArea"]').textContent = `${number.format(building.repeatedArea || 0)} م²`;
  document.querySelector('[data-out="annexArea"]').textContent = `${number.format(building.annexArea || 0)} م²`;
  document.querySelector('[data-out="additionalCostsValue"]').textContent = tableMoney(calculate().additionalCosts);
  document.querySelector('[data-out="availableNetArea"]').textContent = `${state.transactionType === "sale" ? "صافي المساحة البيعية المتاحة" : "صافي المساحة التأجيرية المتاحة"}: ${number.format(netArea())} م²`;
  document.querySelector('[data-unit="brokerage"]').textContent = rawValue("brokerageMode") === "percentage" ? "%" : "SAR";
  document.querySelector('[data-unit="tax"]').textContent = rawValue("transactionTaxMode") === "percentage" ? "%" : "SAR";
  document.querySelector('[data-unit="financing"]').textContent = rawValue("financingMode") === "ratio" ? "%" : "SAR";
  document.querySelector('[data-unit="maintenance"]').textContent = rawValue("maintenanceMode") === "percentage" ? "%" : "SAR";
  if (value("hasFinancing")) {
    if (rawValue("financingMode") === "ratio") document.querySelector('[name="financingAmount"]').value = Math.round(r.financingAmount || 0);
    else document.querySelector('[name="financingRatio"]').value = (r.financingRatio || 0).toFixed(2);
  }
  renderKpis(r);
  renderCashflowTable(r);
  if (state.step === 6) renderCharts(r);
}

function syncVisibility() {
  $$(".purchase-only").forEach((node) => node.classList.toggle("is-hidden", state.mode === "leaseInvestment"));
  $$(".lease-only").forEach((node) => node.classList.toggle("is-hidden", state.mode !== "leaseInvestment"));
  $(".build-auto-fields")?.classList.toggle("is-hidden", rawValue("builtAreaMode") === "manual");
  $(".build-manual-fields")?.classList.toggle("is-hidden", rawValue("builtAreaMode") !== "manual");
  $(".additional-details")?.classList.toggle("is-hidden", rawValue("additionalCostMode") !== "detailed");
  $(".additional-summary")?.classList.toggle("is-hidden", rawValue("additionalCostMode") === "detailed");
  $(".operating-details")?.classList.toggle("is-hidden", rawValue("operatingExpenseMode") !== "detailed");
  $(".operating-percentage")?.classList.toggle("is-hidden", rawValue("operatingExpenseMode") !== "percentage");
  $(".maintenance-note")?.classList.toggle("is-hidden", rawValue("maintenanceMode") !== "percentage");
  $(".finance-fields")?.classList.toggle("is-hidden", !value("hasFinancing"));
  $(".finance-empty")?.classList.toggle("is-hidden", value("hasFinancing"));
}

function calculatedArea() {
  return value("landArea") * percent(value("constructionLandRatio")) * (value("floorsCount") || 1);
}

function serviceArea() {
  return buildingMetrics().area * 0.07;
}

function netArea() {
  return Math.max(buildingMetrics().area - serviceArea(), 0);
}

function floorPlateArea() {
  return value("landArea") * percent(value("constructionLandRatio"));
}

function buildingMetrics() {
  if (rawValue("builtAreaMode") !== "manual") {
    return {
      area: value("builtUpArea"),
      cost: value("builtUpArea") * value("constructionCostPerMeter")
    };
  }
  const basementArea = value("hasBasement") ? value("landArea") * 0.9 : 0;
  const basementCost = basementArea * value("basementCostPerMeter");
  const groundArea = value("groundFloorAreaInput") || floorPlateArea();
  const groundCost = groundArea * value("groundFloorCostPerMeter");
  const repeatedFloorArea = value("repeatedFloorAreaInput") || floorPlateArea();
  const repeatedArea = repeatedFloorArea * value("repeatedFloorsCount");
  const repeatedCost = repeatedArea * value("repeatedFloorCostPerMeter");
  const annexArea = value("hasAnnex") ? repeatedFloorArea * 0.5 : 0;
  const annexCost = annexArea * value("annexCostPerMeter");
  return {
    area: basementArea + groundArea + repeatedArea + annexArea,
    cost: basementCost + groundCost + repeatedCost + annexCost,
    basementArea,
    groundArea,
    repeatedArea,
    annexArea
  };
}

function renderKpis(r) {
  const grid = $("#kpiGrid");
  if (!grid) return;
  const items = state.transactionType === "sale" ? saleKpiItems(r) : [
    ["قيمة الأرض", "Land Value", currency.format(r.landValue), state.mode === "purchase" ? "قيمة الأرض حسب المساحة وسعر المتر" : "لا تحتسب كأصل مملوك في أرض الاستثمار", true],
    ["تكلفة البناء والتطوير", "Development Cost", currency.format(r.totalDevelopmentCost), "تكلفة البناء والتكاليف الإضافية والاحتياطي", false],
    ["إجمالي تكلفة المشروع", "Total Project Cost", currency.format(r.totalProjectCost), "التكلفة الكلية للمشروع", true],
    ["إجمالي الدخل المتوقع", "Expected Revenue", currency.format(r.annualRevenue), "إجمالي الدخل المتوقع سنوياً", false],
    ["NOI", "Net Operating Income", currency.format(r.noi), "صافي الدخل التشغيلي"],
    ["صافي الربح", "Net Profit", currency.format(r.netIncomeAfterFinancing), "بعد المصاريف والتمويل", false],
    ["Yield on Cost", "Return compared to total project cost", `${number.format(r.yieldOnCost)}%`, "العائد السنوي مقارنة بإجمالي تكلفة المشروع"],
    ["ROI", "Return on Investment", `${number.format(r.roi)}%`, "نسبة العائد على الاستثمار"],
    ["IRR", "Internal Rate of Return", `${number.format(r.irr)}%`, "معدل العائد الداخلي المتوقع للمشروع"],
    ["NPV", "Net Present Value", currency.format(r.npv), "صافي القيمة الحالية للتدفقات النقدية المستقبلية"],
    [state.mode === "leaseInvestment" ? "فترة استرداد تكلفة التطوير" : "Payback Period", "Payback Period", `${number.format(r.paybackPeriod)} سنة`, state.mode === "leaseInvestment" ? "عدد السنوات المتوقعة لاسترداد تطوير الأرض المستأجرة" : "عدد السنوات المتوقعة لاسترداد رأس المال"],
    ["القسط السنوي", "Annual Debt Service", currency.format(r.annualDebtService), "خدمة الدين السنوية"],
    ["DSCR", "Debt Service Coverage Ratio", r.dscr ? number.format(r.dscr) : "لا يوجد", "قدرة المشروع على تغطية التزامات التمويل"],
    ["نقطة التعادل", "Break-even", `${number.format(r.breakEvenOccupancy)}%`, "نسبة إشغال تقريبية للتعادل"]
  ];
  grid.innerHTML = items.map(([label, en, val, hint, highlight]) => `<div class="kpi-card ${highlight || label === "NOI" ? "is-prime" : ""}"><span>${label}<small>(${en})</small></span><strong>${formatKpiMoney(val)}</strong><em>${hint}</em></div>`).join("");
}

function saleKpiItems(r) {
  const profit = saleProfit(r);
  const margin = saleMargin(r);
  return [
    ["إجمالي المبيعات المتوقعة", "Expected Sales", currency.format(r.annualRevenue), "قيمة البيع المتوقعة حسب طريقة البيع", true],
    ["صافي الربح المتوقع", "Expected Net Profit", currency.format(profit), "إجمالي المبيعات بعد خصم تكلفة المشروع والتمويل", true],
    ["هامش الربح", "Profit Margin", `${number.format(margin)}%`, "صافي الربح ÷ إجمالي المبيعات", true],
    ["ROI", "Return on Investment", `${number.format(r.roi)}%`, "نسبة العائد على الاستثمار", false],
    ["إجمالي تكلفة المشروع", "Total Project Cost", currency.format(r.totalProjectCost), "التكلفة الكلية للتطوير", true],
    ["قيمة الأرض", "Land Value", currency.format(r.landValue), "تكلفة الأرض ضمن المشروع", false],
    ["تكلفة التطوير", "Development Cost", currency.format(r.totalDevelopmentCost), "تكلفة البناء والتكاليف الإضافية والاحتياطي", false],
    ["فترة الاسترداد", "Payback", "يتم الاسترداد عند اكتمال البيع", "لا توجد تدفقات تشغيلية دورية في نموذج البيع", false],
    ["IRR", "Internal Rate of Return", `${number.format(r.irr)}%`, "معدل العائد الداخلي المتوقع", false],
    ["NPV", "Net Present Value", currency.format(r.npv), "صافي القيمة الحالية", false]
  ];
}

function saleProfit(r) {
  return r.annualRevenue - r.totalProjectCost - (r.annualDebtService || 0);
}

function saleMargin(r) {
  return r.annualRevenue > 0 ? (saleProfit(r) / r.annualRevenue) * 100 : 0;
}

function saleRating(r) {
  const margin = saleMargin(r);
  if (margin > 40) return "ممتاز جداً";
  if (margin >= 30) return "ممتاز";
  if (margin >= 20) return "جيد";
  if (margin >= 10) return "مقبول";
  return "ضعيف";
}

function formatKpiMoney(value) {
  if (typeof value !== "string" || !value.startsWith("SAR ")) return value;
  return `<small class="currency-mark">SAR</small>${value.replace("SAR ", "")}`;
}

function renderCashflowTable(r) {
  const table = $("#cashflowTable");
  if (!table) return;
  const flows = displayCashFlows(r);
  const paybackYear = displayPaybackYear(r, flows);
  const totals = cashflowTotals(flows);
  const incomeLabel = state.transactionType === "sale" ? "البيع" : "الدخل";
  const showLandRent = state.mode === "leaseInvestment";
  table.innerHTML = `
    <thead>
      <tr>
        <th>السنة</th>
        <th>${incomeLabel}</th>
        ${showLandRent ? "<th>إيجار الأرض</th>" : ""}
        <th>المصاريف</th>
        <th>التمويل</th>
        <th>صافي الدخل</th>
        <th>التراكمي</th>
      </tr>
    </thead>
    <tbody>
      ${flows.map((flow) => `
        <tr class="${paybackYear === flow.year ? "is-payback" : ""}">
          <td><strong>${flow.year}${paybackYear === flow.year ? " ✔" : ""}</strong></td>
          <td>${tableMoney(flow.revenue)}</td>
          ${showLandRent ? `<td>${flow.landRentGrace && !flow.landRent ? "فترة سماحية – لا يوجد إيجار أرض" : tableMoney(flow.landRent)}</td>` : ""}
          <td>${tableMoney(flow.expenses + (flow.contractFees || 0))}</td>
          <td>${tableMoney(flow.financing)}</td>
          <td>${tableMoney(flow.netAfterDebt)}</td>
          <td>${tableMoney(flow.cumulative)}</td>
        </tr>
      `).join("")}
    </tbody>
    <tfoot>
      <tr>
        <td>الإجمالي</td>
        <td>${tableMoney(totals.revenue)}</td>
        ${showLandRent ? `<td>${tableMoney(totals.landRent)}</td>` : ""}
        <td>${tableMoney(totals.expenses)}</td>
        <td>${tableMoney(totals.financing)}</td>
        <td>${tableMoney(totals.netAfterDebt)}</td>
        <td>${tableMoney(totals.finalCumulative)}</td>
      </tr>
    </tfoot>
  `;
  const payback = document.querySelector('[data-out="paybackStatus"]');
  if (payback) {
    const label = state.mode === "leaseInvestment" ? "تكلفة التطوير" : "رأس المال";
    payback.textContent = paybackYear ? `تم استرداد ${label} في السنة ${paybackYear}` : "لم يتم الاسترداد خلال مدة المشروع";
  }
}

function getProjectYears() {
  const years = state.mode === "leaseInvestment" && value("leaseTermYears")
    ? Math.round(value("leaseTermYears"))
    : value("hasFinancing") && value("termYears")
    ? Math.round(value("termYears"))
    : 10;
  return Math.min(Math.max(years, 1), 30);
}

function displayCashFlows(r) {
  if (state.transactionType === "sale") return r.cashFlows || [];
  const years = getProjectYears();
  const annualLandRent = r.annualLandRent || 0;
  return Array.from({ length: years }, (_, index) => {
    const year = index + 1;
    const financing = r.financingSchedule?.[index]?.payment || 0;
    const revenue = r.annualRevenue * Math.pow(1.025, index);
    const expenses = r.operatingExpenses * Math.pow(1.018, index);
    const landRentInfo = landRentForYear(annualLandRent, year);
    const landRent = landRentInfo.amount;
    const contractFees = index === 0 ? (r.oneTimeContractFees || 0) : 0;
    const noi = revenue - expenses - landRent;
    const netAfterDebt = noi - financing - contractFees;
    return { year, revenue, landRent, landRentGrace: landRentInfo.isGrace, expenses, contractFees, financing, noi, netAfterDebt, cumulative: 0 };
  }).reduce((flows, flow) => {
    const previous = flows.length ? flows[flows.length - 1].cumulative : -recoveryBase(r);
    flows.push({ ...flow, cumulative: previous + flow.netAfterDebt });
    return flows;
  }, []);
}

function recoveryBase(r) {
  return state.mode === "leaseInvestment" ? r.totalDevelopmentCost : r.totalProjectCost;
}

function displayPaybackYear(r, flows = displayCashFlows(r)) {
  return flows.find((flow) => flow.cumulative >= 0)?.year || null;
}

function cashflowTotals(flows) {
  return flows.reduce((totals, flow, index) => ({
    revenue: totals.revenue + flow.revenue,
    landRent: totals.landRent + flow.landRent,
    expenses: totals.expenses + flow.expenses + (flow.contractFees || 0),
    financing: totals.financing + flow.financing,
    netAfterDebt: totals.netAfterDebt + flow.netAfterDebt,
    finalCumulative: index === flows.length - 1 ? flow.cumulative : totals.finalCumulative
  }), { revenue: 0, landRent: 0, expenses: 0, financing: 0, netAfterDebt: 0, finalCumulative: 0 });
}

function validateStep() {
  const fail = (message) => {
    $("#errorMessage").textContent = message;
    $("#errorMessage").classList.remove("is-hidden");
    return false;
  };
  $("#errorMessage").classList.add("is-hidden");
  if (state.step === 1 && state.mode === "purchase" && (!value("landArea") || !value("landPricePerMeter"))) return fail("أدخل مساحة الأرض وسعر المتر بقيم أكبر من صفر.");
  if (state.step === 1 && state.mode === "leaseInvestment" && (!value("landArea") || !value("annualLandRent"))) return fail("أدخل مساحة الأرض وسعر إيجار المتر السنوي.");
  if (state.step === 3 && state.transactionType === "sale" && rawValue("saleMethod") === "meter" && !value("averageMonthlyRent")) return fail("الرجاء إدخال سعر البيع للمتر.");
  if (state.step === 3 && state.transactionType === "sale" && rawValue("saleMethod") === "units" && (!value("unitsCount") || !value("averageMonthlyRent"))) return fail("الرجاء إدخال بيانات الوحدات وأسعار البيع.");
  if (state.step === 3 && state.transactionType !== "sale" && (!value("unitsCount") || !value("averageMonthlyRent"))) return fail("أدخل عدد الوحدات ومتوسط الإيجار السنوي.");
  if (state.step === 5 && value("hasFinancing") && rawValue("financingMode") === "amount" && (!value("financingAmount") || !value("termYears"))) return fail("أدخل مبلغ التمويل ومدة التمويل.");
  if (state.step === 5 && value("hasFinancing") && rawValue("financingMode") === "ratio" && (!value("financingRatio") || !value("termYears"))) return fail("أدخل نسبة التمويل ومدة التمويل.");
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
  const available = canvas.width - 52;
  const slot = available / Math.max(items.length, 1);
  const w = Math.min(46, Math.max(28, slot * 0.58));
  items.forEach((item, index) => {
    const h = (Math.max(item.value, 0) / max) * 160;
    const x = 26 + index * slot + (slot - w) / 2;
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
  if (abs >= 1000000) return `SAR ${number.format(value / 1000000)}M`;
  if (abs >= 1000) return `SAR ${number.format(value / 1000)}K`;
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
  const scenarios = scenarioValues(r);
  const costItems = [
    { label: "الأرض", value: state.mode === "purchase" ? r.landValue : 0 },
    { label: "البناء", value: r.baseConstructionCost },
    { label: state.transactionType === "sale" ? "التكاليف الإضافية" : "الرسوم", value: state.transactionType === "sale" ? r.additionalCosts : r.brokerageFees + (state.mode === "purchase" ? r.transactionTax : 0) + value("otherLandFees") },
    { label: state.transactionType === "sale" ? "الاحتياطي" : "التكاليف الأخرى", value: state.transactionType === "sale" ? r.contingencyAmount : r.additionalCosts + r.contingencyAmount }
  ].filter((item) => item.value > 0);
  drawPieEnhanced($("#pieChart"), costItems);
  drawBar($("#barChart"), state.transactionType === "sale" ? [
    { label: "التكلفة", value: r.totalProjectCost },
    { label: "متشائم", value: scenarios.pessimisticProfit },
    { label: "أساسي", value: r.annualRevenue },
    { label: "متفائل", value: scenarios.optimisticProfit },
    { label: "الربح", value: saleProfit(r) }
  ] : [
    { label: "الإيراد", value: r.annualRevenue },
    { label: "المصاريف", value: r.operatingExpenses },
    { label: "NOI", value: r.noi },
    { label: "بعد التمويل", value: r.netIncomeAfterFinancing }
  ]);
  drawLineEnhanced($("#lineChart"), displayCashFlows(r));
}

function scenarioValues(r) {
  const pessimisticRevenue = r.annualRevenue * (1 - percent(value("scenarioPessimisticRevenueDrop")));
  const pessimisticCost = r.totalProjectCost * (1 + percent(value("scenarioPessimisticCostIncrease")));
  const optimisticRevenue = r.annualRevenue * (1 + percent(value("scenarioOptimisticRevenueIncrease")));
  const optimisticCost = r.totalProjectCost * (1 - percent(value("scenarioOptimisticCostDecrease")));
  return {
    pessimisticRevenue,
    pessimisticCost,
    optimisticRevenue,
    optimisticCost,
    pessimisticProfit: pessimisticRevenue - pessimisticCost,
    optimisticProfit: optimisticRevenue - optimisticCost
  };
}

function drawPieEnhanced(canvas, items) {
  const ctx = canvas.getContext("2d");
  const total = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chartMeta.pie = [];
  renderPieLegend(items, total);
  if (!total || items.length < 2) return drawEmpty(ctx, canvas, "لا توجد تفاصيل كافية لعرض توزيع التكلفة");
  const colors = ["#2f855a", "#c69b4f", "#4a5568", "#c53030", "#2b6cb0"];
  const centerX = canvas.width / 2;
  const centerY = 145;
  const radius = 112;
  let start = -Math.PI / 2;
  items.forEach((item, index) => {
    const slice = (item.value / total) * Math.PI * 2;
    const middle = start + slice / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    chartMeta.pie.push({ ...item, color: colors[index % colors.length], start, end: start + slice, total, centerX, centerY, radius });
    if (slice > 0.18) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px Tahoma";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round((item.value / total) * 100)}%`, centerX + Math.cos(middle) * 68, centerY + Math.sin(middle) * 68);
    }
    start += slice;
  });
  attachPieTooltip(canvas);
}

function renderPieLegend(items, total) {
  const legend = $("#pieLegend");
  if (!legend) return;
  if (!total || items.length < 2) {
    legend.innerHTML = "";
    return;
  }
  const colors = ["#2f855a", "#c69b4f", "#4a5568", "#c53030", "#2b6cb0"];
  legend.innerHTML = items.map((item, index) => `
    <div class="legend-row" style="border-color:${colors[index % colors.length]};background:${colors[index % colors.length]}18">
      <span><i style="background:${colors[index % colors.length]}"></i> ${item.label}</span>
      <strong>${number.format((item.value / total) * 100)}% · ${currency.format(item.value)}</strong>
    </div>
  `).join("");
}

function drawLineEnhanced(canvas, flows) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chartMeta.line = [];
  const series = [
    { key: "revenue", label: "الإيرادات", color: "#2f855a" },
    { key: "expenses", label: "المصاريف", color: "#c53030" },
    { key: "landRent", label: "إيجار الأرض", color: "#805ad5" },
    { key: "financing", label: "التمويل", color: "#4a5568" },
    { key: "netAfterDebt", label: "صافي التدفق", color: "#c69b4f" },
    { key: "cumulative", label: "الاسترداد التراكمي", color: "#2b6cb0" }
  ].filter((item) => {
    if (item.key === "landRent") return flows.some((flow) => flow.landRent > 0);
    if (item.key === "financing") return flows.some((flow) => flow.financing > 0);
    if (item.key === "cumulative") return flows.some((flow) => Math.abs(flow.cumulative) > 0);
    return true;
  });
  const values = series.flatMap((item) => flows.map((flow) => flow[item.key] || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const left = 66;
  const right = canvas.width - 30;
  const top = 34;
  const bottom = canvas.height - 58;
  const height = bottom - top;
  ctx.strokeStyle = "rgba(17,17,15,0.14)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#68645c";
  ctx.font = "12px Tahoma";
  ctx.textAlign = "right";
  [0, 0.25, 0.5, 0.75, 1].forEach((tick) => {
    const y = bottom - tick * height;
    ctx.strokeStyle = "rgba(17,17,15,0.07)";
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.fillText(compactAxis(min + range * tick), left - 8, y + 4);
  });
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  ctx.fillStyle = "#68645c";
  ctx.font = "bold 13px Tahoma";
  ctx.textAlign = "center";
  ctx.fillText("السنة", (left + right) / 2, canvas.height - 16);
  ctx.save();
  ctx.translate(18, (top + bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("القيمة (SAR)", 0, 0);
  ctx.restore();
  series.forEach((item) => {
    ctx.strokeStyle = item.color;
    ctx.globalAlpha = chartFocusSeries && chartFocusSeries !== item.key ? 0.22 : 1;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    flows.forEach((flow, index) => {
      const x = left + index * ((right - left) / Math.max(flows.length - 1, 1));
      const y = bottom - (((flow[item.key] || 0) - min) / range) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    flows.forEach((flow, index) => {
      const x = left + index * ((right - left) / Math.max(flows.length - 1, 1));
      const y = bottom - (((flow[item.key] || 0) - min) / range) * height;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      chartMeta.line.push({ x, y, value: flow[item.key], year: flow.year, label: item.label, color: item.color });
    });
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#68645c";
  ctx.font = "11px Tahoma";
  ctx.textAlign = "center";
  flows.forEach((flow, index) => {
    if (index % Math.ceil(flows.length / 6) === 0 || index === flows.length - 1) {
      const x = left + index * ((right - left) / Math.max(flows.length - 1, 1));
      ctx.fillText(`س${flow.year}`, x, bottom + 22);
    }
  });
  renderLineLegend(series);
  attachLineTooltip(canvas);
}

function yearLabel(year) {
  const labels = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة"];
  return year <= labels.length ? `السنة ${labels[year - 1]}` : `السنة ${year}`;
}

function compactAxis(value) {
  if (value >= 1000000) return `SAR ${number.format(value / 1000000)}M`;
  if (value >= 1000) return `SAR ${number.format(value / 1000)}K`;
  return `SAR ${number.format(value)}`;
}

function renderLineLegend(series) {
  const legend = $("#lineLegend");
  if (!legend) return;
  legend.innerHTML = series.map((item) => `
    <div class="legend-row" data-series="${item.key}" style="border-color:${item.color};background:${item.color}18">
      <span><i style="background:${item.color}"></i> ${item.label}</span>
      <strong>${lineLegendLabel(item)}</strong>
    </div>
  `).join("");
  legend.querySelectorAll("[data-series]").forEach((node) => {
    node.onmouseenter = () => {
      chartFocusSeries = node.dataset.series;
      renderCharts(calculate());
    };
    node.onmouseleave = () => {
      chartFocusSeries = null;
      renderCharts(calculate());
    };
  });
}

function lineLegendLabel(item) {
  if (item.key === "revenue") return "الإيرادات السنوية";
  if (item.key === "expenses") return "المصاريف التشغيلية";
  if (item.key === "landRent") return "نمو إيجار الأرض";
  if (item.key === "financing") return "التمويل البنكي";
  if (item.key === "netAfterDebt") return "صافي التدفق";
  return "استرداد التطوير التراكمي";
}

function landRentGraceLabel() {
  const labels = {
    "0": "بدون",
    "0.5": "6 شهور",
    "1": "سنة",
    "1.5": "سنة ونصف",
    "2": "سنتين",
    "2.5": "سنتين ونصف"
  };
  return labels[rawValue("landRentGracePeriod") || "0"] || "بدون";
}

function tooltipNode() {
  let node = document.querySelector(".chart-tooltip");
  if (!node) {
    node = document.createElement("div");
    node.className = "chart-tooltip is-hidden";
    document.body.appendChild(node);
  }
  return node;
}

function showTooltip(event, html) {
  const node = tooltipNode();
  node.innerHTML = html;
  node.style.left = `${event.clientX}px`;
  node.style.top = `${event.clientY}px`;
  node.classList.remove("is-hidden");
}

function hideTooltip() {
  tooltipNode().classList.add("is-hidden");
}

function attachPieTooltip(canvas) {
  canvas.onmousemove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const item = chartMeta.pie.find((slice) => {
      const dx = x - slice.centerX;
      const dy = y - slice.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      while (angle < slice.start) angle += Math.PI * 2;
      return distance <= slice.radius && angle >= slice.start && angle <= slice.end;
    });
    if (!item) return hideTooltip();
    showTooltip(event, `<strong>${item.label}</strong><br>${currency.format(item.value)}<br>${number.format((item.value / item.total) * 100)}%`);
  };
  canvas.onmouseleave = hideTooltip;
}

function attachLineTooltip(canvas) {
  canvas.onmousemove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const point = chartMeta.line.find((item) => Math.hypot(item.x - x, item.y - y) <= 10);
    if (!point) return hideTooltip();
    const sameYear = chartMeta.line.filter((item) => item.year === point.year);
    showTooltip(event, `<strong>السنة: ${point.year}</strong><br>${sameYear.map((item) => `${item.label}: ${tableMoney(item.value)}`).join("<br>")}`);
  };
  canvas.onmouseleave = hideTooltip;
}

function buildReport() {
  const r = calculate();
  renderCharts(r);
  const selected = propertyTypes.find(([id]) => id === state.propertyType);
  const pieImage = $("#pieChart")?.toDataURL("image/png") ?? "";
  const barImage = $("#barChart")?.toDataURL("image/png") ?? "";
  const lineImage = $("#lineChart")?.toDataURL("image/png") ?? "";
  const reportFlows = displayCashFlows(r);
  const reportTotals = cashflowTotals(reportFlows);
  const reportPaybackYear = displayPaybackYear(r, reportFlows);
  const reportPieLegend = chartMeta.pie.map((item) => `<div>${item.label}: ${currency.format(item.value)} · ${number.format((item.value / item.total) * 100)}%</div>`).join("");
  const reportShowLandRent = state.mode === "leaseInvestment";
  const reportIncomeLabel = state.transactionType === "sale" ? "البيع" : "الدخل";
  const reportRating = state.transactionType === "sale" ? saleRating(r) : r.rating;
  const row = (label, val) => `<tr><td>${label}</td><td>${stripSAR(val)}</td></tr>`;
  const table = (title, rows) => `<section class="report-section"><h2>${title}</h2><table>${rows.join("")}</table></section>`;
  const financingRows = (r.financingSchedule || []).map((item) => `
    <tr>
      <td>${item.year}</td>
      <td>${tableMoney(item.payment)}</td>
      <td>${tableMoney(item.principal)}</td>
      <td>${tableMoney(item.interest)}</td>
      <td>${tableMoney(item.balance)}</td>
    </tr>
  `).join("");
  const costDistributionRows = [
    ["قيمة الأرض", state.mode === "purchase" ? r.landValue : 0],
    ["تكلفة البناء والتطوير", r.totalDevelopmentCost],
    ["التكاليف الإضافية", r.additionalCosts],
    ["التكاليف التشغيلية", r.operatingExpenses],
    ["التمويل", r.annualDebtService],
    ["الاحتياطي والمخاطر", r.contingencyAmount]
  ].map(([label, amount]) => row(label, `${tableMoney(amount)} · ${number.format(r.totalProjectCost ? (amount / r.totalProjectCost) * 100 : 0)}%`));
  $("#printReport").innerHTML = `
    <article class="report-page report-cover">
      <div class="report-brand">
        <div class="report-brand-title">شركة بداية الطريق العقارية<br>Start Road Real Estate Company</div>
        <img class="report-logo" src="/assets/company-logo.jpeg" alt="بداية الطريق العقارية">
      </div>
      <h1>تقرير جدوى الاستثمار العقاري</h1>
      <div class="report-meta-grid">
        <div class="report-meta-card"><span>تاريخ التقرير</span><strong>${new Date().toLocaleDateString("en-US")}</strong></div>
        <div class="report-meta-card"><span>نوع العملية</span><strong>${state.mode === "purchase" ? "شراء عقار" : "استثمار على أرض مستأجرة"}</strong></div>
        <div class="report-meta-card"><span>نوع العقار</span><strong>${selected[1]}</strong></div>
      </div>
      <section class="report-summary">
        <h2>ملخص تنفيذي</h2>
        <div class="report-summary-grid">
          <div class="report-summary-card"><span>إجمالي التكلفة</span><strong>${currency.format(r.totalProjectCost)}</strong></div>
        <div class="report-summary-card"><span>${state.transactionType === "sale" ? "إجمالي المبيعات" : "الإيراد السنوي"}</span><strong>${currency.format(r.annualRevenue)}</strong></div>
        <div class="report-summary-card"><span>${state.transactionType === "sale" ? "صافي الربح" : "صافي الدخل"}</span><strong>${currency.format(state.transactionType === "sale" ? saleProfit(r) : r.noi)}</strong></div>
        </div>
      </section>
      <div class="report-grid">
        <div class="report-kpi">${state.transactionType === "sale" ? "هامش الربح" : "Yield on Cost"}<strong>${number.format(state.transactionType === "sale" ? saleMargin(r) : r.yieldOnCost)}%</strong></div>
        <div class="report-kpi">ROI<strong>${number.format(r.roi)}%</strong></div>
        <div class="report-kpi">NPV<strong>${currency.format(r.npv)}</strong></div>
        <div class="report-kpi">التقييم<strong>${reportRating}</strong></div>
        <div class="report-kpi">تكلفة التطوير<strong>${currency.format(r.totalDevelopmentCost)}</strong></div>
        <div class="report-kpi">قيمة الأرض<strong>${state.mode === "purchase" ? currency.format(r.landValue) : "أرض مستأجرة"}</strong></div>
        <div class="report-kpi">Net Profit<strong>${currency.format(state.transactionType === "sale" ? saleProfit(r) : r.netIncomeAfterFinancing)}</strong></div>
        <div class="report-kpi">${state.mode === "leaseInvestment" ? "استرداد التطوير" : "فترة الاسترداد"}<strong>${state.transactionType === "sale" ? "عند اكتمال البيع" : `${number.format(r.paybackPeriod)} سنة`}</strong></div>
      </div>
      <div class="report-footer">Fares Alharbi</div>
    </article>
    <article class="report-page">
      <img class="report-watermark" src="/assets/app-icon.jpeg" alt="">
      <div class="report-footer">Fares Alharbi</div>
      ${table("المدخلات الأساسية", [
        row("نوع العملية", state.mode === "purchase" ? "شراء عقار" : "استثمار على أرض مستأجرة"),
        row("نوع العقار", selected[1]),
        row("مساحة الأرض", `${number.format(value("landArea"))} م²`),
        row("سعر إيجار المتر السنوي", currency.format(r.annualLandRentPerMeter)),
        row("إجمالي إيجار الأرض السنوي", currency.format(r.annualLandRent)),
        row("فترة سماح إيجار الأرض", state.mode === "leaseInvestment" ? landRentGraceLabel() : "لا ينطبق"),
        row("زيادة إيجار الأرض السنوية", state.mode === "leaseInvestment" ? `${number.format(value("annualLandRentEscalation"))}%` : "لا ينطبق"),
        row("مسطح البناء", `${number.format(value("builtUpArea"))} م²`),
        ...(state.transactionType === "sale" ? [] : [row("نسبة الإشغال", `${number.format(value("occupancyRate"))}٪`)])
      ])}
      ${table("تكاليف الأرض", [
        row("إجمالي قيمة الأرض", state.mode === "purchase" ? currency.format(r.landValue) : "لا تحتسب - أرض مستأجرة"),
        row("رسوم السعي أو الوساطة", currency.format(r.brokerageFees)),
        row("ضريبة التصرفات العقارية", currency.format(r.transactionTax)),
        row("رسوم أخرى", currency.format(value("otherLandFees"))),
        row(state.mode === "purchase" ? "إجمالي تكلفة تملك الأرض" : "تكاليف تأسيس مرتبطة بالأرض المستأجرة", currency.format(r.totalLandCost))
      ])}
      ${table("تكاليف البناء والتطوير", [
        row("إجمالي تكلفة البناء", currency.format(r.baseConstructionCost)),
        row("تكاليف التصميم والتراخيص والإشراف", currency.format(value("designConsultingCost") + value("permitCost") + value("engineeringSupervisionCost"))),
        row("البنية التحتية والكهرباء والمياه والدفاع المدني", currency.format(value("infrastructureCost") + value("electricityCost") + value("waterCost") + value("civilDefenseCost"))),
        row("المصاعد", currency.format(value("elevatorsCost"))),
        row("إجمالي التكاليف الإضافية", currency.format(r.additionalCosts)),
        row("احتياطي المخاطر", currency.format(r.contingencyAmount)),
        row("إجمالي تكلفة التطوير", currency.format(r.totalDevelopmentCost))
      ])}
    </article>
    <article class="report-page">
      <img class="report-watermark" src="/assets/app-icon.jpeg" alt="">
      <div class="report-footer">Fares Alharbi</div>
      ${table(state.transactionType === "sale" ? "المبيعات" : "الإيرادات", [
        row(selected[3], number.format(value("unitsCount"))),
        row(state.transactionType === "sale" ? (rawValue("saleMethod") === "units" ? "متوسط سعر بيع الوحدة" : "سعر البيع للمتر") : selected[4], currency.format(value("averageMonthlyRent"))),
        row(state.transactionType === "sale" ? "مبيعات أخرى" : "الدخل الإضافي", currency.format(value("additionalIncome"))),
        ...(state.transactionType === "sale" ? [
          row("إجمالي المبيعات", currency.format(r.annualRevenue)),
          row("صافي الربح", currency.format(saleProfit(r))),
          row("هامش الربح", `${number.format(saleMargin(r))}%`)
        ] : [
          row("إجمالي الدخل الشهري", currency.format(r.monthlyIncome)),
          row("إجمالي الدخل السنوي", currency.format(r.annualRevenue))
        ])
      ])}
      ${state.transactionType === "sale" ? "" : table("المصاريف التشغيلية", [
        row("الصيانة السنوية", currency.format(r.annualMaintenance)),
        row("إجمالي المصاريف التشغيلية", currency.format(r.operatingExpenses)),
        row("NOI", currency.format(r.noi))
      ])}
      ${value("hasFinancing") ? table("التمويل", [
        row("مبلغ التمويل", currency.format(r.financingAmount)),
        row("نسبة التمويل", `${number.format(r.financingRatio)}٪`),
        row("مدة التمويل", `${number.format(value("termYears"))} سنة`),
        row("نسبة الفائدة أو الربح", `${number.format(value("annualInterestRate"))}٪`),
        row("القسط السنوي", currency.format(r.annualDebtService)),
        row("إجمالي تكلفة التمويل", currency.format(r.totalFinancingCost)),
        row("DSCR", r.dscr ? number.format(r.dscr) : "غير متاح")
      ]) : ""}
      ${table("النتائج والمؤشرات", state.transactionType === "sale" ? [
        row("إجمالي المبيعات", currency.format(r.annualRevenue)),
        row("إجمالي التكلفة", currency.format(r.totalProjectCost)),
        row("صافي الربح", currency.format(saleProfit(r))),
        row("هامش الربح", `${number.format(saleMargin(r))}%`),
        row("ROI", `${number.format(r.roi)}٪`),
        row("IRR", `${number.format(r.irr)}٪`),
        row("NPV", currency.format(r.npv)),
        row("فترة الاسترداد", "يتم الاسترداد عند اكتمال البيع"),
        row("التقييم المختصر", reportRating)
      ] : [
        row("إجمالي تكلفة المشروع", currency.format(r.totalProjectCost)),
        row("صافي الدخل بعد التمويل", currency.format(r.netIncomeAfterFinancing)),
        row("Yield on Cost", `${number.format(r.yieldOnCost)}٪`),
        row("ROI", `${number.format(r.roi)}٪`),
        row("IRR", `${number.format(r.irr)}٪`),
        row("NPV", currency.format(r.npv)),
        row(state.mode === "leaseInvestment" ? "فترة استرداد تكلفة التطوير" : "فترة استرداد رأس المال", `${number.format(r.paybackPeriod)} سنة`),
        row("سنة الاسترداد", r.paybackYear ? `السنة ${r.paybackYear}` : "لم يتم الاسترداد"),
        row("نقطة التعادل التقريبية", `${number.format(r.breakEvenOccupancy)}٪`),
        row("التقييم المختصر", r.rating)
      ])}
    </article>
    <article class="report-page">
      <img class="report-watermark" src="/assets/app-icon.jpeg" alt="">
      <div class="report-footer">Fares Alharbi</div>
      ${state.transactionType === "sale" ? "" : `<section class="report-section">
        <h2>التقرير المالي</h2>
        <table>
          <tr><td>السنة</td><td>${reportIncomeLabel}</td>${reportShowLandRent ? "<td>إيجار الأرض</td>" : ""}<td>المصاريف</td><td>التمويل</td><td>صافي الدخل</td><td>التراكمي</td></tr>
          ${reportFlows.map((flow) => `
            <tr class="${reportPaybackYear === flow.year ? "is-payback" : ""}">
              <td>${flow.year}${reportPaybackYear === flow.year ? " ✔" : ""}</td>
              <td>${tableMoney(flow.revenue)}</td>
              ${reportShowLandRent ? `<td>${flow.landRentGrace && !flow.landRent ? "فترة سماحية – لا يوجد إيجار أرض" : tableMoney(flow.landRent)}</td>` : ""}
              <td>${tableMoney(flow.expenses + (flow.contractFees || 0))}</td>
              <td>${tableMoney(flow.financing)}</td>
              <td>${tableMoney(flow.netAfterDebt)}</td>
              <td>${tableMoney(flow.cumulative)}</td>
            </tr>
          `).join("")}
          <tr>
            <td><strong>الإجمالي</strong></td>
            <td><strong>${tableMoney(reportTotals.revenue)}</strong></td>
            ${reportShowLandRent ? `<td><strong>${tableMoney(reportTotals.landRent)}</strong></td>` : ""}
            <td><strong>${tableMoney(reportTotals.expenses)}</strong></td>
            <td><strong>${tableMoney(reportTotals.financing)}</strong></td>
            <td><strong>${tableMoney(reportTotals.netAfterDebt)}</strong></td>
            <td><strong>${tableMoney(reportTotals.finalCumulative)}</strong></td>
          </tr>
        </table>
        <p class="report-note">${reportPaybackYear ? `تم استرداد ${state.mode === "leaseInvestment" ? "تكلفة التطوير" : "رأس المال"} في السنة ${reportPaybackYear}` : "لم يتم الاسترداد خلال مدة المشروع"}</p>
      </section>`}
      ${table("توزيع التكاليف", costDistributionRows)}
      <section class="report-section">
        <h2>الرسوم البيانية</h2>
        <p class="report-note">السيناريو الأساسي يعتمد على المدخلات الحالية، المتشائم يفترض انخفاض الإيرادات وارتفاع التكاليف، والمتفائل يفترض ارتفاع الإيرادات وتحسن التكاليف.</p>
        <div class="report-charts">
          <figure><img src="${pieImage}" alt="توزيع تكلفة المشروع"><figcaption>توزيع تكلفة المشروع</figcaption><div class="report-chart-legend">${reportPieLegend}</div></figure>
          <figure><img src="${barImage}" alt="مقارنة الدخل والمصاريف"><figcaption>مقارنة الدخل والمصاريف</figcaption></figure>
          <figure class="wide"><img src="${lineImage}" alt="التدفقات النقدية حسب مدة المشروع"><figcaption>التدفقات النقدية حسب مدة المشروع</figcaption></figure>
        </div>
      </section>
      <section class="report-section"><h2>التوصية المختصرة</h2><p>${recommendation(reportRating)}</p></section>
      <section class="report-section"><h2>المخاطر</h2><p>تشمل المخاطر المحتملة تغير تكلفة البناء، انخفاض الإشغال، ارتفاع مصاريف التشغيل، تغير شروط التمويل، ومخاطر تجديد عقد الأرض المستأجرة في حال كان المشروع قائماً على أرض غير مملوكة.</p></section>
      <p class="report-note">هذا التقرير تقديري ولا يغني عن الدراسة المالية والهندسية التفصيلية.</p>
    </article>
  `;
  if (value("hasFinancing")) {
    const financePage = $("#printReport .report-page:nth-child(3)");
    financePage?.insertAdjacentHTML("beforeend", `<section class="report-section">
      <h2>جدول التمويل السنوي</h2>
      <table>
        <tr><td>السنة</td><td>القسط السنوي</td><td>أصل الدين المسدد</td><td>الفائدة السنوية</td><td>الرصيد المتبقي</td></tr>
        ${financingRows}
      </table>
    </section>`);
  }
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
  if (rating === "ممتاز جداً") return "المؤشرات قوية جداً وتدعم عرض المشروع على المستثمرين، مع إجراء اختبار حساسية للتكلفة والإيرادات قبل القرار النهائي.";
  if (rating === "ممتاز") return "المؤشرات قوية والعائد يتجاوز 10٪. يوصى بالانتقال إلى دراسة تفصيلية تشمل حساسية الإشغال والتكلفة.";
  if (rating === "جيد جداً") return "المؤشرات جاذبة وقريبة من مستوى ممتاز، ويفضل مراجعة شروط التمويل ومخاطر التنفيذ لتحسين صافي العائد.";
  if (rating === "جيد") return "العائد جيد ومناسب للمراجعة الاستثمارية مع ضرورة ضبط تكاليف التنفيذ وشروط التمويل.";
  if (rating === "مقبول") return "المشروع مقبول مبدئياً لكن هامش الأمان محدود، ويحتاج تحسين سعر البيع أو خفض تكلفة التطوير.";
  if (rating === "متوسط") return "العائد متوسط. يفضل تحسين الإيجارات أو خفض تكلفة الأرض أو البناء قبل اتخاذ قرار نهائي.";
  return "العائد أقل من المستوى المستهدف. يوصى بإعادة التفاوض على التكلفة أو إعادة تصميم نموذج الإيرادات.";
}

function collectProject() {
  const fields = {};
  $$("input, select").forEach((field) => {
    fields[field.name] = field.type === "checkbox" ? field.checked : field.value;
  });
  return {
    id: activeProjectId,
    name: document.querySelector('[name="projectName"]')?.value || "",
    mode: state.mode,
    transactionType: state.transactionType,
    propertyType: state.propertyType,
    step: state.step,
    fields,
    savedAt: new Date().toISOString(),
    result: calculate()
  };
}

function savedProjects() {
  try {
    return JSON.parse(localStorage.getItem(projectsStorageKey) || "[]");
  } catch {
    return [];
  }
}

function writeSavedProjects(projects) {
  localStorage.setItem(projectsStorageKey, JSON.stringify(projects));
  renderSavedProjects();
}

function saveProject(options = {}) {
  const project = collectProject();
  localStorage.setItem(storageKey, JSON.stringify(project));
  if (options.named) {
    const existing = savedProjects();
    const current = activeProjectId ? existing.find((item) => item.id === activeProjectId) : null;
    const name = options.name || current?.name || window.prompt("اكتب اسم المشروع", current?.name || "مشروع عقاري");
    if (!name) return null;
    project.id = activeProjectId || `project-${Date.now()}`;
    project.name = name;
    project.updatedAt = new Date().toISOString();
    activeProjectId = project.id;
    const next = existing.filter((item) => item.id !== project.id);
    next.unshift(project);
    writeSavedProjects(next);
  }
  const saveButton = document.querySelector("[data-save-project]");
  if (saveButton && options.named) {
    const oldText = saveButton.textContent;
    saveButton.textContent = "تم حفظ المشروع";
    setTimeout(() => { saveButton.textContent = oldText; }, 1600);
  }
  return project;
}

function applyProject(project) {
  activeProjectId = project.id || null;
  localStorage.setItem(storageKey, JSON.stringify(project));
  state.mode = project.mode || "purchase";
  state.propertyType = project.propertyType || "residentialBuilding";
  state.transactionType = project.transactionType || "rent";
  document.getElementById("calculatorForm").reset();
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
}

function loadProject(projectId = null) {
  const saved = projectId
    ? JSON.stringify(savedProjects().find((project) => project.id === projectId))
    : localStorage.getItem(storageKey);
  if (!saved || saved === "undefined") {
    $("#errorMessage").textContent = "لا يوجد مشروع محفوظ على هذا المتصفح.";
    $("#errorMessage").classList.remove("is-hidden");
    return false;
  }
  const project = JSON.parse(saved);
  applyProject(project);
  return true;
}

function renderSavedProjects() {
  const list = $("#savedProjectsList");
  if (!list) return;
  const projects = savedProjects();
  list.innerHTML = projects.length ? projects.map((project) => `
    <article class="saved-project-card">
      <div>
        <strong>${project.name || "مشروع بدون اسم"}</strong>
        <span>${project.mode === "leaseInvestment" ? "استثمار أرض مستأجرة" : "شراء عقار"} · ${new Date(project.updatedAt || project.savedAt).toLocaleDateString("en-US")}</span>
      </div>
      <div class="project-actions">
        <button type="button" data-open-project="${project.id}">فتح</button>
        <button type="button" data-copy-project="${project.id}">نسخ</button>
        <button type="button" data-delete-project="${project.id}">حذف</button>
      </div>
    </article>
  `).join("") : `<p class="muted">لا توجد مشاريع محفوظة بعد.</p>`;
}

function resetAll() {
  document.getElementById("calculatorForm").reset();
  state.propertyType = "residentialBuilding";
  state.mode = "purchase";
  state.transactionType = "rent";
  state.step = 0;
  renderPropertyTypes();
  updatePropertyLabels();
  goToStep(0);
}

function hasUserData() {
  return $$("input").some((field) => field.type === "checkbox" ? field.checked : Boolean(field.value));
}

function showHome() {
  $("#wizard").classList.add("is-hidden");
  $("#splash").classList.remove("is-hidden");
  renderSavedProjects();
}

function confirmReturnHome() {
  if (!hasUserData()) {
    showHome();
    return;
  }
  const overlay = document.createElement("div");
  overlay.className = "return-modal";
  overlay.innerHTML = `
    <div class="return-dialog">
      <h3>هل ترغب في حفظ المشروع قبل العودة للبداية؟</h3>
      <p>يمكنك حفظ المشروع باسم والرجوع إليه لاحقاً من الصفحة الرئيسية.</p>
      <button type="button" data-return-save>حفظ والعودة</button>
      <button type="button" data-return-nosave>العودة بدون حفظ</button>
      <button type="button" data-return-cancel>إلغاء</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (event) => {
    if (event.target.matches("[data-return-save]")) {
      const saved = saveProject({ named: true });
      if (saved) {
        overlay.remove();
        showHome();
      }
    }
    if (event.target.matches("[data-return-nosave]")) {
      overlay.remove();
      showHome();
    }
    if (event.target.matches("[data-return-cancel]") || event.target === overlay) overlay.remove();
  });
}

document.addEventListener("input", (event) => {
  if (event.target.matches("input, select")) {
    if (event.target.type === "number" && Number(event.target.value) < 0) event.target.value = 0;
    if (event.target.name === "saleMethod") updatePropertyLabels();
    if ((event.target.name === "landArea" || event.target.name === "constructionLandRatio" || event.target.name === "floorsCount" || event.target.name === "builtAreaMode") && rawValue("builtAreaMode") === "auto") {
      document.querySelector('[name="builtUpArea"]').value = calculatedArea();
    }
    if (event.target.name === "builtUpArea" && value("landArea") > 0 && rawValue("builtAreaMode") === "manual") {
      document.querySelector('[name="constructionLandRatio"]').value = ((value("builtUpArea") / value("landArea")) * 100).toFixed(2);
    }
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
  const transaction = event.target.closest("[data-transaction]");
  if (transaction) {
    state.transactionType = transaction.dataset.transaction;
    updatePropertyLabels();
    syncOutputs();
    saveProject();
  }
  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    state.mode = modeButton.dataset.mode;
    state.propertyType = state.mode === "leaseInvestment" ? "commercialShowrooms" : "residentialBuilding";
    state.transactionType = state.mode === "leaseInvestment" ? "rent" : state.transactionType;
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
  const openProject = event.target.closest("[data-open-project]");
  if (openProject) loadProject(openProject.dataset.openProject);
  const deleteProject = event.target.closest("[data-delete-project]");
  if (deleteProject && window.confirm("حذف المشروع المحفوظ؟")) {
    writeSavedProjects(savedProjects().filter((project) => project.id !== deleteProject.dataset.deleteProject));
  }
  const copyProject = event.target.closest("[data-copy-project]");
  if (copyProject) {
    const source = savedProjects().find((project) => project.id === copyProject.dataset.copyProject);
    if (source) {
      const clone = { ...source, id: `project-${Date.now()}`, name: `${source.name || "مشروع"} - نسخة`, updatedAt: new Date().toISOString() };
      writeSavedProjects([clone, ...savedProjects()]);
    }
  }
  if (event.target.matches("[data-next]")) {
    if (state.step === steps.length - 1) {
      exportPDF();
    } else if (validateStep()) {
      goToStep(state.transactionType === "sale" && state.step === 3 ? 5 : state.step + 1);
      if (state.step === steps.length - 1) saveProject();
    }
  }
  if (event.target.matches("[data-prev]")) goToStep(state.step - 1);
  if (event.target.matches("[data-reset]")) resetAll();
  if (event.target.matches("[data-home]")) confirmReturnHome();
  if (event.target.matches("[data-save-project]")) saveProject({ named: true });
  if (event.target.matches("[data-export]")) {
    exportPDF();
  }
});

renderPropertyTypes();
updatePropertyLabels();
syncOutputs();
renderSavedProjects();
setTimeout(() => {
  document.getElementById("startupSplash")?.classList.add("is-hidden");
}, 1800);
