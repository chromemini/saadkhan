const MONTHLY_PRICE = 2000;
const YEARLY_PRICE = 20000;
const COMM_PERCENT = 0.15;

const MONTHLY_COMM = MONTHLY_PRICE * COMM_PERCENT; // 300 PKR
const YEARLY_COMM = YEARLY_PRICE * COMM_PERCENT;   // 3000 PKR upfront

let state = {
  juniorsCount: 4,
  juniorSalary: 25000,
  seniorSalary: 100000,
  salesPerDay: 2,
  yearlyMix: 0.20,
  churnRate: 0.08,
  selectedMonth: 1
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

  heroMonthTitle: document.getElementById('hero-month-title'),
  heroProfit: document.getElementById('hero-profit'),
  heroUnit: document.getElementById('hero-unit'),
  heroSubtext: document.getElementById('hero-subtext'),

  mathIn: document.getElementById('math-in'),
  mathInSub: document.getElementById('math-in-sub'),
  mathOut: document.getElementById('math-out'),
  mathOutSub: document.getElementById('math-out-sub'),
  mathNet: document.getElementById('math-net'),
  mathNetSub: document.getElementById('math-net-sub'),

  statBreakeven: document.getElementById('stat-breakeven'),
  statActiveUsers: document.getElementById('stat-active-users'),
  statPayback: document.getElementById('stat-payback'),
  statDrawdown: document.getElementById('stat-drawdown'),

  statusTag: document.getElementById('status-tag'),
  chartBadge: document.getElementById('chart-badge'),

  presetBtns: document.querySelectorAll('.preset-btn'),
  monthChips: document.querySelectorAll('.month-chip'),
  chartCanvas: document.getElementById('projection-chart')
};

function formatPKR(val) {
  const rounded = Math.round(val);
  const abs = Math.abs(rounded);
  let formatted = '';

  if (abs >= 10000000) {
    formatted = (abs / 10000000).toFixed(1) + ' Crore';
  } else if (abs >= 100000) {
    formatted = (abs / 100000).toFixed(1) + ' Lakh';
  } else {
    formatted = abs.toLocaleString();
  }

  return rounded < 0 ? `-${formatted}` : formatted;
}

function calculateEngine() {
  const fixedBurn = (state.juniorsCount * state.juniorSalary) + state.seniorSalary;
  const breakEvenMonthlySubs = Math.ceil(fixedBurn / MONTHLY_COMM);

  const totalMonthlySales = state.juniorsCount * Math.round(state.salesPerDay * 30);
  const monthlyPlanSales = Math.round(totalMonthlySales * (1 - state.yearlyMix));
  const yearlyPlanSales = totalMonthlySales - monthlyPlanSales;

  let activeMonthlyUsers = 0;
  let yearlyCohorts = new Array(25).fill(0);
  let cumulativeCash = 0;
  let peakDrawdown = 0;
  let paybackMonth = null;
  const monthlyData = [];

  for (let m = 1; m <= 24; m++) {
    const monthlyChurnLoss = Math.round(activeMonthlyUsers * state.churnRate);
    activeMonthlyUsers = Math.max(0, activeMonthlyUsers + monthlyPlanSales - monthlyChurnLoss);
    const revenueFromMonthly = activeMonthlyUsers * MONTHLY_COMM;

    yearlyCohorts[m] = yearlyPlanSales;
    let renewingYearly = 0;
    if (m >= 13) {
      renewingYearly = Math.round(yearlyCohorts[m - 12] * 0.80);
    }
    const revenueFromYearly = (yearlyPlanSales + renewingYearly) * YEARLY_COMM;

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
      totalActiveUsers: activeMonthlyUsers + yearlyPlanSales,
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
    monthlyData
  };
}

function renderUI() {
  const result = calculateEngine();
  const currentMonthData = result.monthlyData[state.selectedMonth - 1];

  dom.valJuniorsCount.textContent = `${state.juniorsCount} reps`;
  dom.valJuniorSalary.textContent = `${Number(state.juniorSalary).toLocaleString()} PKR`;
  dom.valSeniorSalary.textContent = `${Number(state.seniorSalary).toLocaleString()} PKR`;
  dom.valSalesPerDay.textContent = `${state.salesPerDay}/day`;
  dom.valYearlyMix.textContent = `${Math.round(state.yearlyMix * 100)}% Yearly`;
  dom.valChurnRate.textContent = `${Math.round(state.churnRate * 100)}%`;
  dom.hintMonthlyTotal.textContent = `Team brings ~${result.totalMonthlySales} new sales/mo (${result.yearlyPlanSales} yearly plans)`;

  // Hero Card
  dom.heroMonthTitle.textContent = `Month ${state.selectedMonth} Net Cash In Pocket`;
  const monthProfit = currentMonthData.netMonth;

  if (monthProfit >= 0) {
    dom.heroProfit.textContent = `+PKR ${formatPKR(monthProfit)}`;
    dom.heroProfit.style.color = '#4ade80';
    dom.heroUnit.textContent = `profit in Month ${state.selectedMonth}`;
    dom.heroSubtext.textContent = `After paying all team salaries, you keep PKR ${formatPKR(monthProfit)} pure profit in Month ${state.selectedMonth}.`;
    dom.statusTag.textContent = 'Making Profit';
  } else {
    dom.heroProfit.textContent = `-PKR ${formatPKR(Math.abs(monthProfit))}`;
    dom.heroProfit.style.color = '#f87171';
    dom.heroUnit.textContent = `shortfall in Month ${state.selectedMonth}`;
    dom.heroSubtext.textContent = `In Month ${state.selectedMonth}, team sales haven't covered the full salary yet. You need ${result.breakEvenMonthlySubs} subscribers to start profiting.`;
    dom.statusTag.textContent = 'Ramping Up';
  }

  // 3-Box Formula
  dom.mathIn.textContent = `+PKR ${formatPKR(currentMonthData.totalRevenue)}`;
  dom.mathInSub.textContent = `from active subscribers`;
  dom.mathOut.textContent = `-PKR ${formatPKR(result.fixedBurn)}`;
  dom.mathOutSub.textContent = `${state.juniorsCount + 1} team members`;
  dom.mathNet.textContent = `${monthProfit >= 0 ? '+' : '-'}PKR ${formatPKR(Math.abs(monthProfit))}`;
  dom.mathNet.style.color = monthProfit >= 0 ? '#4ade80' : '#f87171';
  dom.mathNetSub.textContent = monthProfit >= 0 ? 'Pure Profit' : 'Out of Pocket';

  // Supporting Stat Pills
  dom.statBreakeven.textContent = `${result.breakEvenMonthlySubs.toLocaleString()} subs`;
  dom.statActiveUsers.textContent = `${currentMonthData.totalActiveUsers.toLocaleString()} users`;
  dom.statPayback.textContent = result.paybackMonth ? `Month ${result.paybackMonth}` : 'Month 1';
  dom.statDrawdown.textContent = `PKR ${formatPKR(result.peakDrawdown)}`;

  dom.chartBadge.textContent = `${monthProfit >= 0 ? '+' : '-'}PKR ${formatPKR(Math.abs(monthProfit))} in M${state.selectedMonth}`;

  drawMonochromeChart(result.monthlyData, state.selectedMonth);
}

function drawMonochromeChart(data, activeMonth) {
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
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

  // Milestone points and active selection ring
  [0, 2, 5, 11, 23].forEach(idx => {
    const x = getX(idx);
    const y = getY(data[idx].cumulativeCash);
    const isSelected = (idx + 1) === activeMonth;

    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = isSelected ? '#4ade80' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isSelected ? '#ffffff' : '#8c93a4';
    ctx.font = isSelected ? 'bold 10px Plus Jakarta Sans' : '10px Plus Jakarta Sans';
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

  dom.monthChips.forEach(chip => {
    chip.addEventListener('click', () => {
      dom.monthChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedMonth = Number(chip.dataset.month);
      renderUI();
    });
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