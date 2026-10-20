const SUB_PRICE = 2000;
const COMM_PERCENT = 0.15;
const COMM_PER_SUB = SUB_PRICE * COMM_PERCENT; // 300 PKR

let state = {
  model: 'fixed',
  juniorsCount: 4,
  juniorSalary: 25000,
  seniorSalary: 100000,
  salesPerRep: 25,
  churnRate: 0.08
};

const dom = {
  juniorsCount: document.getElementById('juniors-count'),
  juniorSalary: document.getElementById('junior-salary'),
  seniorSalary: document.getElementById('senior-salary'),
  salesPerRep: document.getElementById('sales-per-rep'),
  churnRate: document.getElementById('churn-rate'),

  valJuniorsCount: document.getElementById('val-juniors-count'),
  valJuniorSalary: document.getElementById('val-junior-salary'),
  valSeniorSalary: document.getElementById('val-senior-salary'),
  valSalesPerRep: document.getElementById('val-sales-per-rep'),
  valChurnRate: document.getElementById('val-churn-rate'),

  heroBreakeven: document.getElementById('hero-breakeven'),
  heroSubtext: document.getElementById('hero-subtext'),
  statMonthlyBurn: document.getElementById('stat-monthly-burn'),
  statPayback: document.getElementById('stat-payback'),
  statDrawdown: document.getElementById('stat-drawdown'),
  statusTag: document.getElementById('status-tag'),

  btnModelFixed: document.getElementById('btn-model-fixed'),
  btnModelHybrid: document.getElementById('btn-model-hybrid'),
  presetBtns: document.querySelectorAll('.preset-btn'),
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
  const isHybrid = state.model === 'hybrid';
  const effectiveJuniorBase = isHybrid ? 15000 : state.juniorSalary;
  const fixedBurn = (state.juniorsCount * effectiveJuniorBase) + state.seniorSalary;

  const agencyCommissionPerSub = isHybrid ? (COMM_PER_SUB - 75) : COMM_PER_SUB;
  const breakEvenSubs = Math.ceil(fixedBurn / agencyCommissionPerSub);

  let activeUsers = 0;
  let cumulativeCash = 0;
  let peakDrawdown = 0;
  let paybackMonth = null;
  const monthlyData = [];

  for (let m = 1; m <= 24; m++) {
    const grossAdditions = state.juniorsCount * state.salesPerRep;
    const churnLoss = Math.round(activeUsers * state.churnRate);
    activeUsers = Math.max(0, activeUsers + grossAdditions - churnLoss);

    const monthlyRevenue = activeUsers * agencyCommissionPerSub;
    const netMonth = monthlyRevenue - fixedBurn;
    cumulativeCash += netMonth;

    if (cumulativeCash < peakDrawdown) {
      peakDrawdown = cumulativeCash;
    }

    if (cumulativeCash >= 0 && paybackMonth === null && m > 1) {
      paybackMonth = m;
    }

    monthlyData.push({
      month: m,
      activeUsers,
      monthlyRevenue,
      netMonth,
      cumulativeCash
    });
  }

  return {
    fixedBurn,
    breakEvenSubs,
    paybackMonth,
    peakDrawdown,
    monthlyData,
    finalNet: monthlyData[23].netMonth
  };
}

function renderUI() {
  const result = calculateEngine();

  dom.valJuniorsCount.textContent = `${state.juniorsCount} people`;
  dom.valJuniorSalary.textContent = state.model === 'hybrid' ? '15,000 + Bonus' : `${Number(state.juniorSalary).toLocaleString()} PKR`;
  dom.valSeniorSalary.textContent = `${Number(state.seniorSalary).toLocaleString()} PKR`;
  dom.valSalesPerRep.textContent = `${state.salesPerRep} sales`;
  dom.valChurnRate.textContent = `${Math.round(state.churnRate * 100)}% cancel`;

  dom.heroBreakeven.textContent = result.breakEvenSubs.toLocaleString();
  dom.statMonthlyBurn.textContent = `PKR ${formatPKR(result.fixedBurn)}`;
  dom.statDrawdown.textContent = `PKR ${formatPKR(result.peakDrawdown)}`;
  dom.statPayback.textContent = result.paybackMonth ? `Month ${result.paybackMonth}` : 'Never in 2 Yrs';

  if (result.finalNet > 0) {
    document.body.className = 'state-profit';
    dom.statusTag.textContent = 'Profitable';
    dom.heroSubtext.textContent = `Once you reach ${result.breakEvenSubs} users, salaries are fully paid. In Month 24, you take home PKR ${formatPKR(result.finalNet)} pure profit every month.`;
  } else {
    document.body.className = 'state-deficit';
    dom.statusTag.textContent = 'Losing Money';
    dom.heroSubtext.textContent = `Your team is not making enough sales to pay their own salaries. You will keep losing money every month.`;
  }

  drawChart(result.monthlyData);
}

function drawChart(data) {
  const canvas = dom.chartCanvas;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padLeft = 70;
  const padRight = 20;
  const padTop = 30;
  const padBottom = 30;

  ctx.clearRect(0, 0, width, height);

  const values = data.map(d => d.cumulativeCash);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(100000, ...values);
  const range = maxVal - minVal;

  function getY(val) {
    return padTop + (height - padTop - padBottom) * (1 - (val - minVal) / range);
  }

  function getX(i) {
    return padLeft + (i / (data.length - 1)) * (width - padLeft - padRight);
  }

  const zeroY = getY(0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padLeft, zeroY);
  ctx.lineTo(width - padRight, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#9aa2b5';
  ctx.font = '11px Plus Jakarta Sans';
  ctx.textAlign = 'right';
  ctx.fillText('0 PKR (Even)', padLeft - 8, zeroY + 4);

  ctx.beginPath();
  ctx.moveTo(getX(0), zeroY);
  data.forEach((d, i) => {
    ctx.lineTo(getX(i), getY(d.cumulativeCash));
  });
  ctx.lineTo(getX(data.length - 1), zeroY);
  ctx.closePath();

  const isProfitable = data[data.length - 1].cumulativeCash > 0;
  const gradient = ctx.createLinearGradient(0, padTop, 0, height);
  if (isProfitable) {
    gradient.addColorStop(0, 'rgba(81, 207, 102, 0.35)');
    gradient.addColorStop(1, 'rgba(81, 207, 102, 0)');
  } else {
    gradient.addColorStop(0, 'rgba(255, 107, 107, 0)');
    gradient.addColorStop(1, 'rgba(255, 107, 107, 0.35)');
  }
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.cumulativeCash);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = isProfitable ? '#51cf66' : '#ff6b6b';
  ctx.lineWidth = 3;
  ctx.stroke();

  [0, 5, 11, 17, 23].forEach(idx => {
    const x = getX(idx);
    const y = getY(data[idx].cumulativeCash);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9aa2b5';
    ctx.textAlign = 'center';
    ctx.fillText(`Month ${idx + 1}`, x, height - 10);
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
  dom.salesPerRep.addEventListener('input', (e) => {
    state.salesPerRep = Number(e.target.value);
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

      if (preset === 'worst') {
        state.salesPerRep = 10;
        state.churnRate = 0.15;
      } else if (preset === 'base') {
        state.salesPerRep = 25;
        state.churnRate = 0.08;
      } else if (preset === 'growth') {
        state.salesPerRep = 50;
        state.churnRate = 0.05;
      }

      dom.salesPerRep.value = state.salesPerRep;
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