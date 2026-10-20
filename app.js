const MONTHLY_PRICE = 2000;
const YEARLY_PRICE = 20000;
const COMM_PERCENT = 0.15;

const MONTHLY_COMM = MONTHLY_PRICE * COMM_PERCENT; // 300 PKR
const YEARLY_COMM = YEARLY_PRICE * COMM_PERCENT;   // 3000 PKR upfront

let state = {
  model: 'fixed',
  juniorsCount: 4,
  juniorSalary: 25000,
  seniorSalary: 100000,
  salesPerDay: 2,
  yearlyMix: 0.20,
  churnRate: 0.08
};

const dom = {
  juniorsCount: document.getElementById('juniors-count'),
  juniorSalary: document.getElementById('junior-salary'),
  seniorSalary: document.getElementById('senior-salary'),
  salesPerDay: document.getElementById('sales-per-day'),
  yearlyMix: document.getElementById('yearly-mix'),
  churnRate: document.getElementById('churn-rate'),

  valJuniorsCount: document.getElementById('val-juniors-count'),
  valJuniorSalary: document.getElementById('val-junior-salary'),
  valSeniorSalary: document.getElementById('val-senior-salary'),
  valSalesPerDay: document.getElementById('val-sales-per-day'),
  valYearlyMix: document.getElementById('val-yearly-mix'),
  valChurnRate: document.getElementById('val-churn-rate'),
  hintMonthlyTotal: document.getElementById('hint-monthly-total'),

  heroBreakeven: document.getElementById('hero-breakeven'),
  heroSubtext: document.getElementById('hero-subtext'),
  statMonthlyBurn: document.getElementById('stat-monthly-burn'),
  statPayback: document.getElementById('stat-payback'),
  statDrawdown: document.getElementById('stat-drawdown'),
  statusTag: document.getElementById('status-tag'),
  chartBadge: document.getElementById('chart-badge'),

  btnModelFixed: document.getElementById('btn-model-fixed'),
  btnModelHybrid: document.getElementById('btn-model-hybrid'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  chartCanvas: document.getElementById('projection-chart')
};

function formatPKR(val) {
  const rounded = Math.round(val);
  const abs = Math.abs(rounded);
  if (abs >= 10000000) return (abs / 10000000).toFixed(1) + ' Crore';
  if (abs >= 100000) return (abs / 100000).toFixed(1) + ' Lakh';
  return abs.toLocaleString();
}

function calculateEngine() {
  const isHybrid = state.model === 'hybrid';
  const effectiveJuniorBase = isHybrid ? 15000 : state.juniorSalary;
  const fixedBurn = (state.juniorsCount * effectiveJuniorBase) + state.seniorSalary;

  // In hybrid, agency shares 25% of commission with the youngsters
  const netMonthlyComm = isHybrid ? (MONTHLY_COMM - 75) : MONTHLY_COMM;
  const netYearlyComm = isHybrid ? (YEARLY_COMM - 750) : YEARLY_COMM;

  const totalMonthlySales = state.juniorsCount * Math.round(state.salesPerDay * 30);
  const monthlyPlanSales = Math.round(totalMonthlySales * (1 - state.yearlyMix));
  const yearlyPlanSales = totalMonthlySales - monthlyPlanSales;

  // Break-even in equivalent monthly subs
  const breakEvenMonthlySubs = Math.ceil(fixedBurn / netMonthlyComm);

  let activeMonthlyUsers = 0;
  let yearlyCohorts = new Array(25).fill(0);
  let cumulativeCash = 0;
  let peakDrawdown = 0;
  let paybackMonth = null;
  const monthlyData = [];

  for (let m = 1; m <= 24; m++) {
    // 1. Monthly Users Flow
    const monthlyChurnLoss = Math.round(activeMonthlyUsers * state.churnRate);
    activeMonthlyUsers = Math.max(0, activeMonthlyUsers + monthlyPlanSales - monthlyChurnLoss);
    const revenueFromMonthly = activeMonthlyUsers * netMonthlyComm;

    // 2. Yearly Users Flow (Immediate 3,000 PKR cash per yearly sub)
    yearlyCohorts[m] = yearlyPlanSales;
    let renewingYearly = 0;
    if (m >= 13) {
      // Annual renewals after 12 months (approx 20% annual churn)
      renewingYearly = Math.round(yearlyCohorts[m - 12] * 0.80);
    }
    const revenueFromYearly = (yearlyPlanSales + renewingYearly) * netYearlyComm;

    const totalRevenue = revenueFromMonthly + revenueFromYearly;
    const netMonth = totalRevenue - fixedBurn;
    cumulativeCash += netMonth;

    if (cumulativeCash < peakDrawdown) {
      peakDrawdown = cumulativeCash;
    }

    if (cumulativeCash >= 0 && paybackMonth === null && m > 1) {
      paybackMonth = m;
    }

    monthlyData.push({
      month: m,
      activeMonthlyUsers,
      totalRevenue,
      netMonth,
      cumulativeCash
    });
  }

  return {
    fixedBurn,
    breakEvenMonthlySubs,
    totalMonthlySales,
    yearlyPlanSales,
    paybackMonth,
    peakDrawdown: Math.abs(peakDrawdown),
    monthlyData,
    month24Profit: monthlyData[23].netMonth
  };
}

function renderUI() {
  const result = calculateEngine();

  dom.valJuniorsCount.textContent = `${state.juniorsCount} reps`;
  dom.valJuniorSalary.textContent = state.model === 'hybrid' ? '15,000 + Bonus' : `${Number(state.juniorSalary).toLocaleString()} PKR`;
  dom.valSeniorSalary.textContent = `${Number(state.seniorSalary).toLocaleString()} PKR`;
  dom.valSalesPerDay.textContent = `${state.salesPerDay} sales / day`;
  dom.valYearlyMix.textContent = `${Math.round(state.yearlyMix * 100)}% Yearly`;
  dom.valChurnRate.textContent = `${Math.round(state.churnRate * 100)}%`;
  dom.hintMonthlyTotal.textContent = `Team brings ~${result.totalMonthlySales} new sales/mo (${result.yearlyPlanSales} yearly plans)`;

  dom.heroBreakeven.textContent = result.breakEvenMonthlySubs.toLocaleString();
  dom.statMonthlyBurn.textContent = `PKR ${formatPKR(result.fixedBurn)}`;
  dom.statDrawdown.textContent = `PKR ${formatPKR(result.peakDrawdown)}`;
  dom.statPayback.textContent = result.paybackMonth ? `Month ${result.paybackMonth}` : 'Month 1';

  if (result.month24Profit > 0) {
    dom.statusTag.textContent = 'High Compounding';
    dom.chartBadge.textContent = `+PKR ${formatPKR(result.month24Profit)} / mo recurring`;
    dom.heroSubtext.textContent = `With ${Math.round(state.yearlyMix * 100)}% choosing the 20k yearly plan, you collect PKR 3,000 instantly on each annual sale. Month 24 run-rate hits PKR ${formatPKR(result.month24Profit)}/month profit.`;
  } else {
    dom.statusTag.textContent = 'Ramp Up Needed';
    dom.chartBadge.textContent = 'Subsidized';
    dom.heroSubtext.textContent = `Increase sales pace or yearly ratio to achieve break-even faster.`;
  }

  drawMonochromeChart(result.monthlyData);
}

function drawMonochromeChart(data) {
  const canvas = dom.chartCanvas;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padLeft = 65;
  const padRight = 20;
  const padTop = 30;
  const padBottom = 30;

  ctx.clearRect(0, 0, width, height);

  const values = data.map(d => d.cumulativeCash);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(100000, ...values);
  const range = (maxVal - minVal) || 1;

  function getY(val) {
    return padTop + (height - padTop - padBottom) * (1 - (val - minVal) / range);
  }

  function getX(i) {
    return padLeft + (i / (data.length - 1)) * (width - padLeft - padRight);
  }

  const zeroY = getY(0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(padLeft, zeroY);
  ctx.lineTo(width - padRight, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#6e7485';
  ctx.font = '10px Plus Jakarta Sans';
  ctx.textAlign = 'right';
  ctx.fillText('0 PKR', padLeft - 8, zeroY + 3);

  // Gradient fill
  ctx.beginPath();
  ctx.moveTo(getX(0), zeroY);
  data.forEach((d, i) => {
    ctx.lineTo(getX(i), getY(d.cumulativeCash));
  });
  ctx.lineTo(getX(data.length - 1), zeroY);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, padTop, 0, height);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Solid white curve
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.cumulativeCash);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Milestone points
  [0, 5, 11, 17, 23].forEach(idx => {
    const x = getX(idx);
    const y = getY(data[idx].cumulativeCash);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8c93a4';
    ctx.textAlign = 'center';
    ctx.fillText(`M${idx + 1}`, x, height - 10);
  });
}

function bindEvents() {
  dom.juniorsCount.addEventListener('input', (e) => {
    state.juniorsCount = Number(e.target.value);
    renderUI();
  });
  dom.juniorSalary.addEventListener('input', (e) => {
    state.juniorSalary = Number(e.target.value);
    renderUI();
  });
  dom.seniorSalary.addEventListener('input', (e) => {
    state.seniorSalary = Number(e.target.value);
    renderUI();
  });
  dom.salesPerDay.addEventListener('input', (e) => {
    state.salesPerDay = Number(e.target.value);
    renderUI();
  });
  dom.yearlyMix.addEventListener('input', (e) => {
    state.yearlyMix = Number(e.target.value) / 100;
    renderUI();
  });
  dom.churnRate.addEventListener('input', (e) => {
    state.churnRate = Number(e.target.value) / 100;
    renderUI();
  });

  dom.btnModelFixed.addEventListener('click', () => {
    state.model = 'fixed';
    dom.btnModelFixed.classList.add('active');
    dom.btnModelHybrid.classList.remove('active');
    dom.juniorSalary.disabled = false;
    renderUI();
  });

  dom.btnModelHybrid.addEventListener('click', () => {
    state.model = 'hybrid';
    dom.btnModelHybrid.classList.add('active');
    dom.btnModelFixed.classList.remove('active');
    dom.juniorSalary.disabled = true;
    renderUI();
  });

  dom.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;

      if (preset === 'steady') {
        state.salesPerDay = 1;
        state.yearlyMix = 0.10;
        state.churnRate = 0.10;
      } else if (preset === 'target') {
        state.salesPerDay = 5;
        state.yearlyMix = 0.20;
        state.churnRate = 0.08;
      } else if (preset === 'scale') {
        state.salesPerDay = 25;
        state.yearlyMix = 0.30;
        state.churnRate = 0.05;
      }

      dom.salesPerDay.value = state.salesPerDay;
      dom.yearlyMix.value = Math.round(state.yearlyMix * 100);
      dom.churnRate.value = Math.round(state.churnRate * 100);
      renderUI();
    });
  });

  window.addEventListener('resize', () => {
    renderUI();
  });
}

bindEvents();
renderUI();