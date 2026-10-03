/**
 * Sistema de Control de Créditos Natillera
 * Lógica de Negocio y Aplicación Web
 */

// Global State
let state = {
  config: {
    adminName: "Santiago",
    defaultInterestRate: 0.005, // 0.5% mensual
    defaultInterestRateDisplay: "0.5%",
    currency: "COP"
  },
  systemDate: "2026-10-02",
  currentTab: "dashboard",
  currentSocioId: null,
  socios: []
};

// Storage Key
const STORAGE_KEY = "natillera_creditos_v2";

// Chart instances
let chartCartera = null;
let chartStatus = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setupEventListeners();
  initSystemDate();
  renderAll();
});

/**
 * Cargar datos desde localStorage o INITIAL_DATA
 */
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.config = parsed.config || state.config;
      state.socios = parsed.socios || [];
      if (parsed.systemDate) {
        state.systemDate = parsed.systemDate;
      }
    } catch (e) {
      console.error("Error al cargar localStorage, usando datos iniciales", e);
      loadInitialData();
    }
  } else {
    loadInitialData();
  }

  // Ensure currentSocioId is valid
  if (state.socios.length > 0) {
    state.currentSocioId = state.socios[0].id;
  }
}

function loadInitialData() {
  if (typeof INITIAL_DATA !== "undefined") {
    state.config = JSON.parse(JSON.stringify(INITIAL_DATA.config));
    state.socios = JSON.parse(JSON.stringify(INITIAL_DATA.socios));
  } else {
    state.socios = [];
  }
  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    config: state.config,
    systemDate: state.systemDate,
    socios: state.socios
  }));
}

/**
 * Inicializar fecha del sistema
 */
function initSystemDate() {
  const dateInput = document.getElementById("systemDateInput");
  if (!state.systemDate) {
    // Si no está seteada, usar fecha de hoy en formato YYYY-MM-DD
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    state.systemDate = `${y}-${m}-${d}`;
  }
  if (dateInput) {
    dateInput.value = state.systemDate;
    dateInput.addEventListener("change", (e) => {
      state.systemDate = e.target.value;
      saveData();
      renderAll();
      showToast(`Fecha del sistema actualizada a: ${state.systemDate}`);
    });
  }

  // Update simulator dates default
  const simInicio = document.getElementById("simFechaInicio");
  const simFin = document.getElementById("simFechaFin");
  if (simInicio && !simInicio.value) {
    simInicio.value = state.systemDate;
  }
  if (simFin && !simFin.value) {
    // 30 days later
    const d = parseDate(state.systemDate);
    d.setDate(d.getDate() + 30);
    simFin.value = formatDate(d);
  }
}

/**
 * Configurar eventos generales
 */
function setupEventListeners() {
  // Navigation Tabs
  window.switchTab = switchTab;
  window.openModal = openModal;
  window.closeModal = closeModal;
}

/**
 * Cambio de Pestañas
 */
function switchTab(tabId) {
  state.currentTab = tabId;

  // Tab Buttons Style
  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.classList.remove("text-white", "bg-slate-800");
    btn.classList.add("text-slate-400");
  });

  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add("text-white", "bg-slate-800");
    activeBtn.classList.remove("text-slate-400");
  }

  // Tab Content Visibility
  const tabs = ["dashboard", "socio", "simulador", "recibos", "guia", "config"];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) {
      if (t === tabId) {
        el.classList.remove("hidden");
        el.classList.add("fade-in");
      } else {
        el.classList.add("hidden");
        el.classList.remove("fade-in");
      }
    }
  });

  if (tabId === "dashboard") {
    renderDashboard();
  } else if (tabId === "socio") {
    renderSocioView();
  } else if (tabId === "simulador") {
    recalculateSimulation();
  } else if (tabId === "recibos") {
    updateReceiptGenerator();
  } else if (tabId === "config") {
    renderConfig();
  }
}

/**
 * ----------------------------------------------------
 * MOTOR FINANCIERO (Cálculos Exactos del Excel)
 * ----------------------------------------------------
 */

// Utilidad para diferencias de fechas exactas en días
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

function formatDate(dateObj) {
  if (!dateObj) return "";
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDaysDiff(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcular métricas completas de un crédito
 */
function calculateLoanMetrics(credito, allAbonos, systemDateStr) {
  const capital = Number(credito.capital) || 0;
  const tasa = Number(credito.tasa) || 0.005; // 0.5% mensual = 0.005
  const fc = credito.fechaCredito;
  const fp = credito.fechaPago; // Si está liquidado

  // 1. Días transcurridos
  let dias = 0;
  let diasHoy = 0;
  if (fc) {
    diasHoy = Math.max(0, getDaysDiff(fc, systemDateStr));
    if (fp) {
      dias = Math.max(0, getDaysDiff(fc, fp));
    } else {
      dias = diasHoy;
    }
  }

  // 2. Intereses a Hoy (En Vivo)
  // Fórmula Excel: ROUND( capital * (tasa / 30) * (HOY - C), 0 )
  const interesesHoy = Math.round(capital * (tasa / 30.0) * diasHoy);

  // 3. Intereses a Fecha Pago
  // Fórmula Excel: IF(D<>"", ROUND( capital * (tasa / 30) * (D - C), 0 ), "-")
  const interesesFechaPago = fp ? Math.round(capital * (tasa / 30.0) * dias) : null;

  // 4. Abonos recibidos para este crédito
  const abonosCredito = allAbonos.filter(a => Number(a.creditoId) === Number(credito.id));
  const totalAbonoInteres = abonosCredito.reduce((acc, a) => acc + (Number(a.abonoInteres) || 0), 0);
  const totalAbonoCapital = abonosCredito.reduce((acc, a) => acc + (Number(a.abonoCapital) || 0), 0);

  // 5. Saldo Interés
  // Fórmula Excel: MAX(0, IF(D<>"", I, H) - J)
  const baseInteres = fp ? (interesesFechaPago || 0) : interesesHoy;
  const saldoInteres = Math.max(0, baseInteres - totalAbonoInteres);

  // 6. Saldo Capital
  // Fórmula Excel: MAX(0, F - L)
  const saldoCapital = Math.max(0, capital - totalAbonoCapital);

  // 7. Total a Pagar Hoy
  // Fórmula Excel: Saldo Interés + Saldo Capital
  const totalPagar = saldoInteres + saldoCapital;

  // 8. Estado del crédito
  // Fórmula Excel: IF(TotalPagar <= 0, "PAGADO", IF(D<>"", "PAGADO", IF(Dias > 30, "PENDIENTE", "VIGENTE")))
  let estado = "VIGENTE";
  if (totalPagar <= 0 || fp) {
    estado = "PAGADO";
  } else if (dias > 30) {
    estado = "PENDIENTE";
  } else {
    estado = "VIGENTE";
  }

  return {
    dias,
    diasHoy,
    interesesHoy,
    interesesFechaPago,
    totalAbonoInteres,
    saldoInteres,
    totalAbonoCapital,
    saldoCapital,
    totalPagar,
    estado,
    isPaid: (totalPagar <= 0 || !!fp)
  };
}

/**
 * Calcular totales de un Socio
 */
function calculateSocioTotals(socio, systemDateStr) {
  const creditos = socio.creditos || [];
  const abonos = socio.abonos || [];

  let totalPrestado = 0;
  let capitalCalle = 0;
  let intLiquidados = 0;
  let intCobrar = 0;
  let totalPorCobrar = 0;

  creditos.forEach(c => {
    const m = calculateLoanMetrics(c, abonos, systemDateStr);
    totalPrestado += Number(c.capital) || 0;
    capitalCalle += m.saldoCapital;

    if (c.fechaPago) {
      intLiquidados += (m.interesesFechaPago || 0);
    } else {
      intCobrar += m.saldoInteres;
    }
    totalPorCobrar += m.totalPagar;
  });

  const abonosInteres = abonos.reduce((acc, a) => acc + (Number(a.abonoInteres) || 0), 0);
  const abonosCapital = abonos.reduce((acc, a) => acc + (Number(a.abonoCapital) || 0), 0);
  const totalRecaudado = abonosInteres + abonosCapital;

  // Estado Socio
  // Fórmula Excel: IF(TotalPorCobrar <= 0, "PAZ Y SALVO", IF(CapitalCalle > 0, "CON DEUDA", "AL DÍA"))
  let estadoSocio = "AL DÍA";
  if (totalPrestado === 0) {
    estadoSocio = "SIN CRÉDITOS";
  } else if (totalPorCobrar <= 0) {
    estadoSocio = "PAZ Y SALVO";
  } else if (capitalCalle > 0) {
    estadoSocio = "CON DEUDA";
  } else {
    estadoSocio = "AL DÍA";
  }

  return {
    totalPrestado,
    capitalCalle,
    intLiquidados,
    intCobrar,
    totalPorCobrar,
    abonosInteres,
    abonosCapital,
    totalRecaudado,
    estadoSocio,
    numCreditos: creditos.length
  };
}

/**
 * Calcular totales Globales de la Natillera
 */
function calculateGlobalTotals(socios, systemDateStr) {
  let gPrestado = 0;
  let gCalle = 0;
  let gIntLiquidados = 0;
  let gIntCobrar = 0;
  let gTotalCobrar = 0;
  let gTotalRecaudado = 0;
  let gAbonosInteres = 0;
  let gAbonosCapital = 0;

  socios.forEach(s => {
    const tot = calculateSocioTotals(s, systemDateStr);
    gPrestado += tot.totalPrestado;
    gCalle += tot.capitalCalle;
    gIntLiquidados += tot.intLiquidados;
    gIntCobrar += tot.intCobrar;
    gTotalCobrar += tot.totalPorCobrar;
    gTotalRecaudado += tot.totalRecaudado;
    gAbonosInteres += tot.abonosInteres;
    gAbonosCapital += tot.abonosCapital;
  });

  return {
    gPrestado,
    gCalle,
    gIntLiquidados,
    gIntCobrar,
    gTotalCobrar,
    gTotalRecaudado,
    gAbonosInteres,
    gAbonosCapital
  };
}

// Formateador de moneda en pesos colombianos
function formatCurrency(val) {
  if (val === null || val === undefined) return "$0";
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * ----------------------------------------------------
 * RENDERIZADO GENERAL
 * ----------------------------------------------------
 */
function renderAll() {
  document.getElementById("bannerCurrentDate").textContent = state.systemDate;
  document.getElementById("headerAdminName").textContent = state.config.adminName || "Santiago";

  populateSocioSelects();

  if (state.currentTab === "dashboard") {
    renderDashboard();
  } else if (state.currentTab === "socio") {
    renderSocioView();
  }
}

function populateSocioSelects() {
  const socioSelect = document.getElementById("socioSelect");
  const ncSocioSelect = document.getElementById("ncSocioId");
  const abSocioSelect = document.getElementById("abSocioId");
  const receiptSocioSelect = document.getElementById("receiptSocioSelect");

  const selects = [socioSelect, ncSocioSelect, abSocioSelect, receiptSocioSelect];
  
  selects.forEach(sel => {
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = "";
    state.socios.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });

    if (currentVal && state.socios.some(s => s.id === currentVal)) {
      sel.value = currentVal;
    } else if (state.currentSocioId) {
      sel.value = state.currentSocioId;
    }
  });

  if (state.socios.length > 0 && !state.currentSocioId) {
    state.currentSocioId = state.socios[0].id;
  }
}

/**
 * ----------------------------------------------------
 * DASHBOARD GENERAL
 * ----------------------------------------------------
 */
function renderDashboard() {
  const global = calculateGlobalTotals(state.socios, state.systemDate);

  // Render KPI Cards
  document.getElementById("kpiTotalPrestado").textContent = formatCurrency(global.gPrestado);
  document.getElementById("kpiCapitalCalle").textContent = formatCurrency(global.gCalle);
  document.getElementById("kpiIntLiquidados").textContent = formatCurrency(global.gIntLiquidados);
  document.getElementById("kpiIntCobrar").textContent = formatCurrency(global.gIntCobrar);
  document.getElementById("kpiTotalCobrar").textContent = formatCurrency(global.gTotalCobrar);
  document.getElementById("kpiTotalRecaudado").textContent = formatCurrency(global.gTotalRecaudado);

  // Render Socios Table
  renderSociosTable();

  // Render Charts
  renderDashboardCharts(global);
}

function renderSociosTable() {
  const tbody = document.getElementById("tbodySociosDashboard");
  const tfoot = document.getElementById("tfootSociosDashboard");
  if (!tbody) return;

  const searchQuery = (document.getElementById("searchSocioInput")?.value || "").toLowerCase().trim();
  const filterEstado = document.getElementById("filterEstadoSocio")?.value || "ALL";

  tbody.innerHTML = "";

  const global = calculateGlobalTotals(state.socios, state.systemDate);

  state.socios.forEach((s, idx) => {
    const tot = calculateSocioTotals(s, state.systemDate);

    // Apply filters
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery)) {
      return;
    }
    if (filterEstado !== "ALL" && tot.estadoSocio !== filterEstado) {
      return;
    }

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/80 transition duration-150 cursor-pointer";
    tr.onclick = (e) => {
      // Don't trigger if clicked on a button
      if (e.target.closest("button")) return;
      viewSocioDetail(s.id);
    };

    let badgeClass = "badge-vigente";
    if (tot.estadoSocio === "PAZ Y SALVO") badgeClass = "badge-pazysalvo";
    if (tot.estadoSocio === "CON DEUDA") badgeClass = "badge-deuda";

    tr.innerHTML = `
      <td class="py-3 px-4 font-semibold text-slate-400">${idx + 1}</td>
      <td class="py-3 px-4">
        <div class="font-bold text-slate-800 hover:text-emerald-600 transition flex items-center">
          <i class="fa-solid fa-user-circle mr-2 text-slate-400"></i>
          <span>${s.name}</span>
        </div>
      </td>
      <td class="py-3 px-4 text-right font-medium text-slate-700">${formatCurrency(tot.totalPrestado)}</td>
      <td class="py-3 px-4 text-right font-bold text-amber-600">${formatCurrency(tot.capitalCalle)}</td>
      <td class="py-3 px-4 text-right font-medium text-cyan-700">${formatCurrency(tot.intLiquidados)}</td>
      <td class="py-3 px-4 text-right font-medium text-indigo-600">${formatCurrency(tot.intCobrar)}</td>
      <td class="py-3 px-4 text-right font-bold text-rose-600">${formatCurrency(tot.totalPorCobrar)}</td>
      <td class="py-3 px-4 text-right font-medium text-emerald-600">${formatCurrency(tot.totalRecaudado)}</td>
      <td class="py-3 px-4 text-center">
        <span class="badge ${badgeClass}">${tot.estadoSocio}</span>
      </td>
      <td class="py-3 px-4 text-center">
        <span class="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">${tot.numCreditos}</span>
      </td>
      <td class="py-3 px-4 text-center">
        <div class="flex items-center justify-center space-x-1">
          <button onclick="viewSocioDetail('${s.id}')" title="Ver ficha y liquidar" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-lg border border-emerald-200 transition font-medium">
            <i class="fa-solid fa-folder-open mr-1"></i> Ver Ficha
          </button>
          <button onclick="quickAbonoForSocio('${s.id}')" title="Registrar abono rápido" class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-lg border border-blue-200 transition font-medium">
            <i class="fa-solid fa-hand-holding-dollar"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Footer Row (Excel Row 29)
  if (tfoot) {
    tfoot.innerHTML = `
      <td class="py-3 px-4" colspan="2">TOTAL GENERAL NATILLERA</td>
      <td class="py-3 px-4 text-right font-bold text-slate-100">${formatCurrency(global.gPrestado)}</td>
      <td class="py-3 px-4 text-right font-bold text-amber-300">${formatCurrency(global.gCalle)}</td>
      <td class="py-3 px-4 text-right font-bold text-cyan-300">${formatCurrency(global.gIntLiquidados)}</td>
      <td class="py-3 px-4 text-right font-bold text-indigo-300">${formatCurrency(global.gIntCobrar)}</td>
      <td class="py-3 px-4 text-right font-bold text-rose-300">${formatCurrency(global.gTotalCobrar)}</td>
      <td class="py-3 px-4 text-right font-bold text-emerald-400">${formatCurrency(global.gTotalRecaudado)}</td>
      <td class="py-3 px-4 text-center font-bold text-slate-300">-</td>
      <td class="py-3 px-4 text-center font-bold text-slate-300">${state.socios.reduce((a, s) => a + (s.creditos || []).length, 0)}</td>
      <td class="py-3 px-4 text-center"></td>
    `;
  }
}

function filterSociosTable() {
  renderSociosTable();
}

function viewSocioDetail(socioId) {
  state.currentSocioId = socioId;
  const select = document.getElementById("socioSelect");
  if (select) select.value = socioId;
  switchTab("socio");
}

function quickAbonoForSocio(socioId) {
  state.currentSocioId = socioId;
  openModalAbonoForCurrentSocio();
}

/**
 * Gráficas de Dashboard (Chart.js)
 */
function renderDashboardCharts(global) {
  // Chart 1: Bar Chart per Socio
  const ctxCartera = document.getElementById("chartCarteraSocios");
  if (ctxCartera) {
    const labels = state.socios.map(s => s.name);
    const dataCalle = state.socios.map(s => calculateSocioTotals(s, state.systemDate).capitalCalle);
    const dataRecaudado = state.socios.map(s => calculateSocioTotals(s, state.systemDate).totalRecaudado);

    if (chartCartera) chartCartera.destroy();

    chartCartera = new Chart(ctxCartera, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Capital en Calle (Deuda)',
            data: dataCalle,
            backgroundColor: '#f59e0b',
            borderRadius: 6
          },
          {
            label: 'Total Recaudado (Abonos)',
            data: dataRecaudado,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + (value / 1000).toFixed(0) + 'k'
            }
          }
        }
      }
    });
  }

  // Chart 2: Status Breakdown (Pie / Doughnut)
  const ctxStatus = document.getElementById("chartStatusPie");
  if (ctxStatus) {
    if (chartStatus) chartStatus.destroy();

    const deudas = global.gCalle;
    const recaudado = global.gTotalRecaudado;
    const intCobrar = global.gIntCobrar;

    chartStatus = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Capital en Calle', 'Total Recaudado', 'Intereses por Cobrar'],
        datasets: [{
          data: [deudas, recaudado, intCobrar],
          backgroundColor: ['#f59e0b', '#10b981', '#6366f1'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}`
            }
          }
        },
        cutout: '65%'
      }
    });
  }
}

/**
 * ----------------------------------------------------
 * FICHA POR SOCIO (Detalle Completo)
 * ----------------------------------------------------
 */
function onSocioSelected(socioId) {
  state.currentSocioId = socioId;
  renderSocioView();
}

function renderSocioView() {
  const socio = state.socios.find(s => s.id === state.currentSocioId);
  if (!socio) return;

  // Header Avatar & Badge
  const initials = socio.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById("socioAvatar").textContent = initials;

  const tot = calculateSocioTotals(socio, state.systemDate);
  const badge = document.getElementById("socioStatusBadge");
  badge.textContent = tot.estadoSocio;
  badge.className = `badge ${tot.estadoSocio === 'PAZ Y SALVO' ? 'badge-pazysalvo' : (tot.estadoSocio === 'CON DEUDA' ? 'badge-deuda' : 'badge-vigente')}`;

  // KPI Summary
  document.getElementById("socioKpiPrestado").textContent = formatCurrency(tot.totalPrestado);
  document.getElementById("socioKpiCapitalCalle").textContent = formatCurrency(tot.capitalCalle);
  document.getElementById("socioKpiIntLiquidados").textContent = formatCurrency(tot.intLiquidados);
  document.getElementById("socioKpiIntCobrar").textContent = formatCurrency(tot.intCobrar);
  document.getElementById("socioKpiTotalCobrar").textContent = formatCurrency(tot.totalPorCobrar);
  document.getElementById("socioKpiTotalRecaudado").textContent = formatCurrency(tot.totalRecaudado);

  // Render Table 1: Créditos
  renderSocioCreditosTable(socio);

  // Render Table 2: Abonos
  renderSocioAbonosTable(socio);
}

function renderSocioCreditosTable(socio) {
  const tbody = document.getElementById("tbodySocioCreditos");
  const tfoot = document.getElementById("tfootSocioCreditos");
  if (!tbody) return;

  tbody.innerHTML = "";
  const creditos = socio.creditos || [];
  const abonos = socio.abonos || [];

  if (creditos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="15" class="py-8 text-center text-slate-400">
          <i class="fa-solid fa-inbox text-3xl mb-2 block"></i>
          Este socio no tiene créditos registrados aún.
        </td>
      </tr>
    `;
    if (tfoot) tfoot.innerHTML = "";
    return;
  }

  let sumCap = 0;
  let sumIntHoy = 0;
  let sumIntPago = 0;
  let sumAbInt = 0;
  let sumSaldoInt = 0;
  let sumAbCap = 0;
  let sumSaldoCap = 0;
  let sumTotalPagar = 0;

  creditos.forEach(c => {
    const m = calculateLoanMetrics(c, abonos, state.systemDate);

    sumCap += Number(c.capital) || 0;
    sumIntHoy += m.interesesHoy;
    if (c.fechaPago) sumIntPago += (m.interesesFechaPago || 0);
    sumAbInt += m.totalAbonoInteres;
    sumSaldoInt += m.saldoInteres;
    sumAbCap += m.totalAbonoCapital;
    sumSaldoCap += m.saldoCapital;
    sumTotalPagar += m.totalPagar;

    let rowClass = "hover:bg-slate-50 transition";
    let badgeClass = "badge-vigente";
    if (m.estado === "PAGADO") {
      badgeClass = "badge-pagado";
      rowClass += " bg-emerald-50/20";
    } else if (m.estado === "PENDIENTE") {
      badgeClass = "badge-pendiente";
      rowClass += " bg-amber-50/20";
    }

    const tr = document.createElement("tr");
    tr.className = rowClass;
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-bold text-slate-700">${c.id}</td>
      <td class="py-2.5 px-3 whitespace-nowrap">${c.fechaCredito || '-'}</td>
      <td class="py-2.5 px-3 whitespace-nowrap ${c.fechaPago ? 'font-bold text-cyan-700' : 'text-slate-400'}">
        ${c.fechaPago || '<span class="text-slate-400 italic">Abierto</span>'}
      </td>
      <td class="py-2.5 px-2 text-center font-semibold text-slate-600">${m.dias}</td>
      <td class="py-2.5 px-3 text-right font-medium text-slate-800">${formatCurrency(c.capital)}</td>
      <td class="py-2.5 px-2 text-center text-slate-500">${((c.tasa || 0.005) * 100).toFixed(1)}%</td>
      <td class="py-2.5 px-3 text-right text-slate-600">${formatCurrency(m.interesesHoy)}</td>
      <td class="py-2.5 px-3 text-right ${c.fechaPago ? 'font-bold text-cyan-700' : 'text-slate-400'}">
        ${c.fechaPago ? formatCurrency(m.interesesFechaPago) : '-'}
      </td>
      <td class="py-2.5 px-3 text-right text-emerald-600 font-medium">${formatCurrency(m.totalAbonoInteres)}</td>
      <td class="py-2.5 px-3 text-right font-bold text-indigo-700">${formatCurrency(m.saldoInteres)}</td>
      <td class="py-2.5 px-3 text-right text-emerald-600 font-medium">${formatCurrency(m.totalAbonoCapital)}</td>
      <td class="py-2.5 px-3 text-right font-bold text-amber-600">${formatCurrency(m.saldoCapital)}</td>
      <td class="py-2.5 px-3 text-right font-extrabold ${m.totalPagar > 0 ? 'text-rose-600' : 'text-emerald-700'}">${formatCurrency(m.totalPagar)}</td>
      <td class="py-2.5 px-2 text-center">
        <span class="badge ${badgeClass}">${m.estado}</span>
      </td>
      <td class="py-2.5 px-3 text-center no-print whitespace-nowrap">
        <div class="flex items-center justify-center space-x-1">
          <button onclick="openModalLiquidar('${socio.id}', ${c.id})" title="${c.fechaPago ? 'Editar fecha de liquidación' : 'Liquidar y congelar intereses'}" class="p-1.5 rounded-lg ${c.fechaPago ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'} transition text-xs">
            <i class="fa-solid fa-snowflake"></i>
          </button>
          <button onclick="openModalAbonarDirecto('${socio.id}', ${c.id})" title="Abonar a este crédito" class="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-xs">
            <i class="fa-solid fa-plus"></i>
          </button>
          <button onclick="eliminarCredito('${socio.id}', ${c.id})" title="Eliminar crédito" class="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition text-xs">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Footer totals row (Excel Row 29)
  if (tfoot) {
    tfoot.innerHTML = `
      <td class="py-3 px-3" colspan="4">TOTAL GENERAL CRÉDITOS</td>
      <td class="py-3 px-3 text-right text-slate-100 font-bold">${formatCurrency(sumCap)}</td>
      <td class="py-3 px-2 text-center">-</td>
      <td class="py-3 px-3 text-right text-slate-300 font-medium">${formatCurrency(sumIntHoy)}</td>
      <td class="py-3 px-3 text-right text-cyan-300 font-bold">${formatCurrency(sumIntPago)}</td>
      <td class="py-3 px-3 text-right text-emerald-400 font-medium">${formatCurrency(sumAbInt)}</td>
      <td class="py-3 px-3 text-right text-indigo-300 font-bold">${formatCurrency(sumSaldoInt)}</td>
      <td class="py-3 px-3 text-right text-emerald-400 font-medium">${formatCurrency(sumAbCap)}</td>
      <td class="py-3 px-3 text-right text-amber-300 font-bold">${formatCurrency(sumSaldoCap)}</td>
      <td class="py-3 px-3 text-right text-rose-300 font-extrabold">${formatCurrency(sumTotalPagar)}</td>
      <td class="py-3 px-2 text-center">-</td>
      <td class="py-3 px-3 no-print"></td>
    `;
  }
}

function renderSocioAbonosTable(socio) {
  const tbody = document.getElementById("tbodySocioAbonos");
  const tfoot = document.getElementById("tfootSocioAbonos");
  if (!tbody) return;

  tbody.innerHTML = "";
  const abonos = socio.abonos || [];

  if (abonos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-6 text-center text-slate-400">
          No hay abonos registrados para este socio.
        </td>
      </tr>
    `;
    if (tfoot) tfoot.innerHTML = "";
    return;
  }

  let sumAbInt = 0;
  let sumAbCap = 0;
  let sumTotal = 0;

  abonos.forEach(a => {
    const ai = Number(a.abonoInteres) || 0;
    const ac = Number(a.abonoCapital) || 0;
    const tot = ai + ac;
    sumAbInt += ai;
    sumAbCap += ac;
    sumTotal += tot;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">${a.fechaPago}</td>
      <td class="py-2.5 px-2 text-center">
        <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[11px]">Crédito ${a.creditoId}</span>
      </td>
      <td class="py-2.5 px-3 text-right text-slate-600 font-medium">${formatCurrency(ai)}</td>
      <td class="py-2.5 px-3 text-right text-slate-600 font-medium">${formatCurrency(ac)}</td>
      <td class="py-2.5 px-3 text-right font-bold text-emerald-600">${formatCurrency(tot)}</td>
      <td class="py-2.5 px-4 text-slate-600 text-xs">${a.comprobante || '<span class="text-slate-400 italic">-</span>'}</td>
      <td class="py-2.5 px-3 text-center no-print whitespace-nowrap">
        <div class="flex items-center justify-center space-x-1">
          <button onclick="copiarComprobanteAbono('${socio.id}', '${a.id}')" title="Compartir comprobante por WhatsApp" class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition text-xs">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
          <button onclick="eliminarAbono('${socio.id}', '${a.id}')" title="Eliminar abono" class="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition text-xs">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <td class="py-3 px-3" colspan="2">TOTAL ABONOS REGISTRADOS</td>
      <td class="py-3 px-3 text-right font-bold text-slate-800">${formatCurrency(sumAbInt)}</td>
      <td class="py-3 px-3 text-right font-bold text-slate-800">${formatCurrency(sumAbCap)}</td>
      <td class="py-3 px-3 text-right font-bold text-emerald-700">${formatCurrency(sumTotal)}</td>
      <td class="py-3 px-4" colspan="2"></td>
    `;
  }
}

/**
 * ----------------------------------------------------
 * ACCIONES Y MODALES DE CRÉDITO Y ABONOS
 * ----------------------------------------------------
 */
function openModalCreditoForCurrentSocio() {
  populateSocioSelects();
  const sel = document.getElementById("ncSocioId");
  if (sel && state.currentSocioId) {
    sel.value = state.currentSocioId;
  }
  document.getElementById("ncFechaCredito").value = state.systemDate;
  openModal("modalNuevoCredito");
}

function handleNuevoCreditoSubmit(e) {
  e.preventDefault();
  const socioId = document.getElementById("ncSocioId").value;
  const capital = parseFloat(document.getElementById("ncCapital").value);
  const fechaCredito = document.getElementById("ncFechaCredito").value;
  const tasaPct = parseFloat(document.getElementById("ncTasa").value) || 0.5;
  const tasa = tasaPct / 100.0;

  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;

  const nextId = socio.creditos.length > 0 
    ? Math.max(...socio.creditos.map(c => Number(c.id))) + 1 
    : 1;

  socio.creditos.push({
    id: nextId,
    socio: socio.name,
    fechaCredito,
    fechaPago: null,
    capital,
    tasa
  });

  saveData();
  closeModal("modalNuevoCredito");
  document.getElementById("formNuevoCredito").reset();
  showToast(`Crédito N° ${nextId} registrado para ${socio.name}`);
  renderAll();
}

function eliminarCredito(socioId, creditoId) {
  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;

  if (!confirm(`¿Estás seguro de eliminar el Crédito N° ${creditoId} de ${socio.name}? Se conservarán o eliminarán sus abonos asociados.`)) {
    return;
  }

  socio.creditos = socio.creditos.filter(c => Number(c.id) !== Number(creditoId));
  saveData();
  showToast(`Crédito N° ${creditoId} eliminado`);
  renderAll();
}

function openModalAbonoForCurrentSocio() {
  populateSocioSelects();
  const sel = document.getElementById("abSocioId");
  if (sel && state.currentSocioId) {
    sel.value = state.currentSocioId;
  }
  onAbonoSocioChange(state.currentSocioId);
  document.getElementById("abFechaPago").value = state.systemDate;
  openModal("modalRegistrarAbono");
}

function openModalAbonarDirecto(socioId, creditoId) {
  state.currentSocioId = socioId;
  openModalAbonoForCurrentSocio();
  const cSel = document.getElementById("abCreditoId");
  if (cSel) {
    cSel.value = creditoId;
    onAbonoCreditoChange(creditoId);
  }
}

function onAbonoSocioChange(socioId) {
  const socio = state.socios.find(s => s.id === socioId);
  const credSelect = document.getElementById("abCreditoId");
  if (!credSelect) return;

  credSelect.innerHTML = "";
  if (!socio || (socio.creditos || []).length === 0) {
    credSelect.innerHTML = `<option value="">Sin créditos registrados</option>`;
    return;
  }

  socio.creditos.forEach(c => {
    const m = calculateLoanMetrics(c, socio.abonos || [], state.systemDate);
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `Crédito N° ${c.id} - Saldo: ${formatCurrency(m.totalPagar)} (${m.estado})`;
    credSelect.appendChild(opt);
  });

  if (socio.creditos.length > 0) {
    onAbonoCreditoChange(socio.creditos[0].id);
  }
}

function onAbonoCreditoChange(creditoId) {
  const socioId = document.getElementById("abSocioId").value;
  const socio = state.socios.find(s => s.id === socioId);
  const info = document.getElementById("abCreditoInfo");
  if (!socio || !info) return;

  const credito = socio.creditos.find(c => Number(c.id) === Number(creditoId));
  if (!credito) {
    info.textContent = "";
    return;
  }

  const m = calculateLoanMetrics(credito, socio.abonos || [], state.systemDate);
  info.innerHTML = `Capital restante: <strong>${formatCurrency(m.saldoCapital)}</strong> | Interés pendiente: <strong>${formatCurrency(m.saldoInteres)}</strong> | Total: <strong>${formatCurrency(m.totalPagar)}</strong>`;
}

function handleRegistrarAbonoSubmit(e) {
  e.preventDefault();
  const socioId = document.getElementById("abSocioId").value;
  const creditoId = parseInt(document.getElementById("abCreditoId").value);
  const fechaPago = document.getElementById("abFechaPago").value;
  const abonoInteres = parseFloat(document.getElementById("abMontoInteres").value) || 0;
  const abonoCapital = parseFloat(document.getElementById("abMontoCapital").value) || 0;
  const comprobante = document.getElementById("abComprobante").value.trim();

  if (abonoInteres <= 0 && abonoCapital <= 0) {
    alert("Debes ingresar un valor a abonar en Intereses o en Capital.");
    return;
  }

  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;

  const abonoId = `${socio.id}_abono_${Date.now()}`;
  socio.abonos = socio.abonos || [];
  socio.abonos.push({
    id: abonoId,
    fechaPago,
    creditoId,
    abonoInteres,
    abonoCapital,
    comprobante
  });

  saveData();
  closeModal("modalRegistrarAbono");
  document.getElementById("formRegistrarAbono").reset();
  showToast(`Abono de ${formatCurrency(abonoInteres + abonoCapital)} registrado con éxito`);
  renderAll();
}

function eliminarAbono(socioId, abonoId) {
  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;

  if (!confirm("¿Deseas eliminar este registro de abono?")) return;

  socio.abonos = socio.abonos.filter(a => a.id !== abonoId);
  saveData();
  showToast("Abono eliminado");
  renderAll();
}

/**
 * ----------------------------------------------------
 * LIQUIDACIÓN Y CONGELACIÓN DE INTERESES (Fórmula Excel)
 * ----------------------------------------------------
 */
function openModalLiquidar(socioId, creditoId) {
  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;
  const credito = socio.creditos.find(c => Number(c.id) === Number(creditoId));
  if (!credito) return;

  document.getElementById("liqSocioId").value = socioId;
  document.getElementById("liqCreditoId").value = creditoId;
  document.getElementById("liqCreditoTitle").textContent = `Crédito N° ${credito.id} - ${socio.name} (Desembolso: ${credito.fechaCredito})`;
  document.getElementById("liqCapitalOrig").textContent = formatCurrency(credito.capital);

  const m = calculateLoanMetrics(credito, socio.abonos || [], state.systemDate);
  document.getElementById("liqSaldoCapActual").textContent = formatCurrency(m.saldoCapital);

  // Set default liquidation date to existing fechaPago or systemDate
  document.getElementById("liqFechaPago").value = credito.fechaPago || state.systemDate;
  recalculateLiquidationPreview();

  openModal("modalLiquidarCredito");
}

function recalculateLiquidationPreview() {
  const socioId = document.getElementById("liqSocioId").value;
  const creditoId = document.getElementById("liqCreditoId").value;
  const fPago = document.getElementById("liqFechaPago").value;

  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;
  const credito = socio.creditos.find(c => Number(c.id) === Number(creditoId));
  if (!credito) return;

  const dummyCredito = { ...credito, fechaPago: fPago };
  const m = calculateLoanMetrics(dummyCredito, socio.abonos || [], state.systemDate);

  document.getElementById("liqPreviewDias").textContent = `${m.dias} días`;
  document.getElementById("liqPreviewInteres").textContent = formatCurrency(m.interesesFechaPago);
  document.getElementById("liqPreviewSaldoInt").textContent = formatCurrency(m.saldoInteres);
  document.getElementById("liqPreviewTotal").textContent = formatCurrency(m.totalPagar);
}

function confirmarLiquidacionCredito() {
  const socioId = document.getElementById("liqSocioId").value;
  const creditoId = document.getElementById("liqCreditoId").value;
  const fPago = document.getElementById("liqFechaPago").value;

  if (!fPago) {
    alert("Por favor selecciona una fecha de pago para congelar.");
    return;
  }

  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;
  const credito = socio.creditos.find(c => Number(c.id) === Number(creditoId));
  if (!credito) return;

  credito.fechaPago = fPago;
  saveData();
  closeModal("modalLiquidarCredito");
  showToast(`Crédito N° ${credito.id} liquidado y congelado al ${fPago}`);
  renderAll();
}

function desmarcarLiquidacionCredito() {
  const socioId = document.getElementById("liqSocioId").value;
  const creditoId = document.getElementById("liqCreditoId").value;

  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;
  const credito = socio.creditos.find(c => Number(c.id) === Number(creditoId));
  if (!credito) return;

  credito.fechaPago = null;
  saveData();
  closeModal("modalLiquidarCredito");
  showToast(`Crédito N° ${credito.id} reabierto con intereses en vivo`);
  renderAll();
}

/**
 * ----------------------------------------------------
 * NUEVO SOCIO
 * ----------------------------------------------------
 */
function handleNuevoSocioSubmit(e) {
  e.preventDefault();
  const nombre = document.getElementById("nsNombre").value.trim();
  if (!nombre) return;

  const id = nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (state.socios.some(s => s.id === id)) {
    alert("Ya existe un socio con este nombre o ID similar.");
    return;
  }

  const newSocio = {
    id,
    name: nombre,
    creditos: [],
    abonos: []
  };

  state.socios.push(newSocio);
  state.currentSocioId = id;
  saveData();
  closeModal("modalNuevoSocio");
  document.getElementById("formNuevoSocio").reset();
  showToast(`Socio ${nombre} creado con éxito`);
  renderAll();
  viewSocioDetail(id);
}

/**
 * ----------------------------------------------------
 * SIMULADOR DE CRÉDITOS
 * ----------------------------------------------------
 */
function recalculateSimulation() {
  const cap = parseFloat(document.getElementById("simCapital")?.value) || 0;
  const fInicio = document.getElementById("simFechaInicio")?.value;
  const fFin = document.getElementById("simFechaFin")?.value;
  const tasaPct = parseFloat(document.getElementById("simTasa")?.value) || 0.5;
  const tasa = tasaPct / 100.0;

  if (!fInicio || !fFin) return;

  const dias = Math.max(0, getDaysDiff(fInicio, fFin));
  const intDiario = Math.round(cap * (tasa / 30.0));
  const intTotal = Math.round(cap * (tasa / 30.0) * dias);
  const total = cap + intTotal;

  document.getElementById("simDias").textContent = `${dias} días`;
  document.getElementById("simIntDiario").textContent = `${formatCurrency(intDiario)} / día`;
  document.getElementById("simIntTotal").textContent = formatCurrency(intTotal);
  document.getElementById("simCapitalRes").textContent = formatCurrency(cap);
  document.getElementById("simTotalPagar").textContent = formatCurrency(total);
}

function convertirSimulacionACredito() {
  const cap = parseFloat(document.getElementById("simCapital").value);
  const fInicio = document.getElementById("simFechaInicio").value;
  const tasaPct = parseFloat(document.getElementById("simTasa").value) || 0.5;

  openModalCreditoForCurrentSocio();
  document.getElementById("ncCapital").value = cap;
  document.getElementById("ncFechaCredito").value = fInicio;
  document.getElementById("ncTasa").value = tasaPct;
}

/**
 * ----------------------------------------------------
 * GENERADOR DE RECIBOS Y WHATSAPP
 * ----------------------------------------------------
 */
function updateReceiptGenerator() {
  const socioId = document.getElementById("receiptSocioSelect")?.value || state.currentSocioId;
  const docType = document.getElementById("receiptTypeSelect")?.value || "estado_cuenta";
  const socio = state.socios.find(s => s.id === socioId);
  const preview = document.getElementById("receiptPreviewText");
  if (!socio || !preview) return;

  const tot = calculateSocioTotals(socio, state.systemDate);
  const creditos = socio.creditos || [];
  const abonos = socio.abonos || [];

  let text = "";

  if (docType === "estado_cuenta") {
    text += `💰 *ESTADO DE CUENTA - NATILLERA*\n`;
    text += `👤 *Socio:* ${socio.name}\n`;
    text += `📅 *Fecha de Corte:* ${state.systemDate}\n`;
    text += `🏷️ *Estado:* ${tot.estadoSocio}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💵 *Capital Prestado Total:* ${formatCurrency(tot.totalPrestado)}\n`;
    text += `📉 *Capital en la Calle:* ${formatCurrency(tot.capitalCalle)}\n`;
    text += `📊 *Intereses por Cobrar:* ${formatCurrency(tot.intCobrar)}\n`;
    text += `💳 *Total Recaudado en Abonos:* ${formatCurrency(tot.totalRecaudado)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔴 *TOTAL A PAGAR HOY:* ${formatCurrency(tot.totalPorCobrar)}\n\n`;

    if (creditos.length > 0) {
      text += `*📋 Detalle de Créditos:*\n`;
      creditos.forEach(c => {
        const m = calculateLoanMetrics(c, abonos, state.systemDate);
        text += `• *Crédito #${c.id}* (${c.fechaCredito}): Cap: ${formatCurrency(c.capital)} | Saldo Cap: ${formatCurrency(m.saldoCapital)} | Saldo Int: ${formatCurrency(m.saldoInteres)} ➔ *Total: ${formatCurrency(m.totalPagar)}* [${m.estado}]\n`;
      });
    }
    text += `\n_Administrador: ${state.config.adminName}_`;
  } else if (docType === "paz_y_salvo") {
    text += `📜 *CERTIFICADO DE PAZ Y SALVO*\n`;
    text += `*CONTROL DE CRÉDITOS NATILLERA*\n\n`;
    text += `Por medio del presente se certifica que el/la socio(a):\n`;
    text += `👤 *${socio.name.toUpperCase()}*\n\n`;
    if (tot.totalPorCobrar <= 0) {
      text += `Se encuentra a la fecha *PAZ Y SALVO* por todo concepto de capital e intereses en el sistema de créditos de la Natillera.\n\n`;
      text += `✅ Saldo Pendiente: *$0 COP*\n`;
      text += `📅 Fecha de Emisión: *${state.systemDate}*\n\n`;
      text += `_Certificado generado por ${state.config.adminName}_`;
    } else {
      text += `⚠️ *NO se encuentra a paz y salvo.*\n`;
      text += `Presenta un saldo pendiente por pagar de: *${formatCurrency(tot.totalPorCobrar)}*.\n`;
    }
  } else if (docType === "ultimo_abono") {
    const ultimoAbono = abonos[abonos.length - 1];
    if (ultimoAbono) {
      const totAbono = (Number(ultimoAbono.abonoInteres) || 0) + (Number(ultimoAbono.abonoCapital) || 0);
      text += `🧾 *COMPROBANTE DE ABONO - NATILLERA*\n\n`;
      text += `👤 *Socio:* ${socio.name}\n`;
      text += `📅 *Fecha:* ${ultimoAbono.fechaPago}\n`;
      text += `🔢 *Aplicado a Crédito N°:* ${ultimoAbono.creditoId}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🔸 *Abono a Intereses:* ${formatCurrency(ultimoAbono.abonoInteres)}\n`;
      text += `🔹 *Abono a Capital:* ${formatCurrency(ultimoAbono.abonoCapital)}\n`;
      text += `💵 *TOTAL ABONADO:* ${formatCurrency(totAbono)}\n`;
      if (ultimoAbono.comprobante) {
        text += `📝 *Detalle/Medio:* ${ultimoAbono.comprobante}\n`;
      }
      text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📉 *Saldo Total Restante por Pagar:* ${formatCurrency(tot.totalPorCobrar)}\n\n`;
      text += `_¡Muchas gracias por su cumplimiento!_\n_${state.config.adminName}_`;
    } else {
      text += `No hay abonos registrados para este socio.`;
    }
  }

  preview.textContent = text;
}

function copiarMensajeWhatsApp() {
  const text = document.getElementById("receiptPreviewText").textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast("¡Texto copiado al portapapeles! Listo para pegar en WhatsApp");
  });
}

function abrirWhatsAppWeb() {
  const text = encodeURIComponent(document.getElementById("receiptPreviewText").textContent);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function copiarComprobanteAbono(socioId, abonoId) {
  const socio = state.socios.find(s => s.id === socioId);
  if (!socio) return;
  const abono = (socio.abonos || []).find(a => a.id === abonoId);
  if (!abono) return;

  const tot = (Number(abono.abonoInteres) || 0) + (Number(abono.abonoCapital) || 0);
  const socioTot = calculateSocioTotals(socio, state.systemDate);

  let msg = `🧾 *COMPROBANTE DE ABONO - NATILLERA*\n\n`;
  msg += `👤 *Socio:* ${socio.name}\n`;
  msg += `📅 *Fecha:* ${abono.fechaPago}\n`;
  msg += `🔢 *Crédito:* #${abono.creditoId}\n`;
  msg += `🔸 *Abono a Interés:* ${formatCurrency(abono.abonoInteres)}\n`;
  msg += `🔹 *Abono a Capital:* ${formatCurrency(abono.abonoCapital)}\n`;
  msg += `💵 *TOTAL RECIBIDO:* ${formatCurrency(tot)}\n`;
  if (abono.comprobante) msg += `📝 *Nota:* ${abono.comprobante}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📉 *Saldo Pendiente Total:* ${formatCurrency(socioTot.totalPorCobrar)}\n`;
  msg += `_Administrador: ${state.config.adminName}_`;

  navigator.clipboard.writeText(msg).then(() => {
    showToast("Comprobante copiado para WhatsApp");
  });
}

function imprimirFichaSocio() {
  window.print();
}

function generarPazYSalvoCurrentSocio() {
  const sel = document.getElementById("receiptSocioSelect");
  if (sel) sel.value = state.currentSocioId;
  const tSel = document.getElementById("receiptTypeSelect");
  if (tSel) tSel.value = "paz_y_salvo";
  switchTab("recibos");
}

/**
 * ----------------------------------------------------
 * EXPORTAR A EXCEL (.xlsx) IDÉNTICO AL ORIGINAL
 * ----------------------------------------------------
 */
function exportToExcel() {
  try {
    if (typeof XLSX === "undefined") {
      alert("La biblioteca de Excel no está cargada en este momento.");
      return;
    }

    const wb = XLSX.utils.book_new();

    // 1. Sheet: Dashboard
    const dashData = [
      ["📊 DASHBOARD GLOBAL - CONTROL GENERAL DE CRÉDITOS NATILLERA"],
      [`Administrador: ${state.config.adminName} | Fecha de Corte: ${state.systemDate} | Generado Automáticamente`],
      [],
      ["FECHA DE HOY", "", "TOTAL PRESTADO", "CAPITAL EN LA CALLE", "INTERESES LIQUIDADOS", "INTERESES POR COBRAR", "TOTAL POR COBRAR HOY", "", "TOTAL RECAUDADO EN ABONOS"]
    ];

    const g = calculateGlobalTotals(state.socios, state.systemDate);
    dashData.push([state.systemDate, "", g.gPrestado, g.gCalle, g.gIntLiquidados, g.gIntCobrar, g.gTotalCobrar, "", g.gTotalRecaudado]);
    dashData.push([]);
    dashData.push(["👥 CONSOLIDADO DE SOCIOS Y ESTADO DE CUENTA GENERAL"]);
    dashData.push([]);
    dashData.push(["N°", "Socio / Nombre", "Capital Prestado", "Capital en Calle", "Intereses Liquidados", "Intereses por Cobrar", "Total por Cobrar", "Total Abonado", "Estado Socio", "N° Créditos"]);

    state.socios.forEach((s, idx) => {
      const tot = calculateSocioTotals(s, state.systemDate);
      dashData.push([
        idx + 1,
        s.name,
        tot.totalPrestado,
        tot.capitalCalle,
        tot.intLiquidados,
        tot.intCobrar,
        tot.totalPorCobrar,
        tot.totalRecaudado,
        tot.estadoSocio,
        tot.numCreditos
      ]);
    });

    dashData.push([
      "TOTAL GENERAL NATILLERA",
      "",
      g.gPrestado,
      g.gCalle,
      g.gIntLiquidados,
      g.gIntCobrar,
      g.gTotalCobrar,
      g.gTotalRecaudado,
      "",
      state.socios.reduce((a, s) => a + (s.creditos || []).length, 0)
    ]);

    const wsDash = XLSX.utils.aoa_to_sheet(dashData);
    XLSX.utils.book_append_sheet(wb, wsDash, "Dashboard");

    // 2. Sheets: Cada Socio
    state.socios.forEach(s => {
      const sTot = calculateSocioTotals(s, state.systemDate);
      const sRows = [
        ["💰 SISTEMA DE CONTROL DE CRÉDITOS, INTERESES Y ABONOS - NATILLERA"],
        [`Administrador: ${state.config.adminName} | Socio: ${s.name} | Fecha: ${state.systemDate}`],
        [],
        ["", "FECHA DE HOY", "", "TOTAL PRESTADO", "", "CAPITAL EN LA CALLE", "", "INTERESES A FECHA DE PAGO", "", "INTERESES POR COBRAR", "", "TOTAL POR COBRAR GENERAL", "", "", "", "", "ABONOS A INTERÉS", "", "ABONOS A CAPITAL", "", "TOTAL RECAUDADO EN ABONOS"],
        ["", state.systemDate, "", sTot.totalPrestado, "", sTot.capitalCalle, "", sTot.intLiquidados, "", sTot.intCobrar, "", sTot.totalPorCobrar, "", "", "", "", sTot.abonosInteres, "", sTot.abonosCapital, "", sTot.totalRecaudado],
        [],
        ["📋 TABLA DE CRÉDITOS Y LIQUIDACIÓN (Lado Izquierdo)", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "💳 REGISTRO DE ABONOS RECIBIDOS (Lado Derecho)"],
        [
          "N°", "Nombre del Socio / Deudor", "Fecha Crédito", "Fecha Pago / Liquidación", "Días", "Valor Crédito (Capital)", "Tasa Mes", "Intereses a Hoy (En Vivo)", "Intereses a Fecha Pago", "Total Abono Interés", "Saldo Interés", "Total Abono Capital", "Saldo Capital", "Total a Pagar Hoy", "Estado",
          "",
          "Fecha Pago", "N° Crédito", "Socio (Automático)", "Abono a Intereses", "Abono a Capital", "Total Abonado", "Medio / Comprobante"
        ]
      ];

      const maxRows = Math.max((s.creditos || []).length, (s.abonos || []).length);
      for (let i = 0; i < maxRows; i++) {
        const c = s.creditos[i];
        const a = s.abonos[i];

        let cCols = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
        if (c) {
          const m = calculateLoanMetrics(c, s.abonos || [], state.systemDate);
          cCols = [
            c.id,
            s.name,
            c.fechaCredito,
            c.fechaPago || "",
            m.dias,
            c.capital,
            c.tasa,
            m.interesesHoy,
            c.fechaPago ? m.interesesFechaPago : "-",
            m.totalAbonoInteres,
            m.saldoInteres,
            m.totalAbonoCapital,
            m.saldoCapital,
            m.totalPagar,
            m.estado
          ];
        }

        let aCols = ["", "", "", "", "", "", ""];
        if (a) {
          const totA = (Number(a.abonoInteres) || 0) + (Number(a.abonoCapital) || 0);
          aCols = [
            a.fechaPago,
            a.creditoId,
            s.name,
            a.abonoInteres,
            a.abonoCapital,
            totA,
            a.comprobante || ""
          ];
        }

        sRows.push([...cCols, "", ...aCols]);
      }

      // Totals Row
      sRows.push([
        "TOTAL GENERAL CRÉDITOS", "", "", "", "",
        sTot.totalPrestado, "", "", sTot.intLiquidados, sTot.abonosInteres, sTot.intCobrar, sTot.abonosCapital, sTot.capitalCalle, sTot.totalPorCobrar, "",
        "",
        "TOTAL ABONOS REGISTRADOS", "", "", sTot.abonosInteres, sTot.abonosCapital, sTot.totalRecaudado, ""
      ]);

      const ws = XLSX.utils.aoa_to_sheet(sRows);
      const safeSheetName = s.name.substring(0, 31).replace(/[\\/?*[\]]/g, '');
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });

    // Write file
    const filename = `Control_Creditos_Natillera_${state.systemDate}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Archivo Excel descargado: ${filename}`);
  } catch (err) {
    console.error("Error al exportar a Excel:", err);
    alert("Ocurrió un error al generar el archivo Excel.");
  }
}

/**
 * ----------------------------------------------------
 * CONFIGURACIÓN, RESPALDOS JSON Y FACTORY RESET
 * ----------------------------------------------------
 */
function renderConfig() {
  document.getElementById("configAdminName").value = state.config.adminName || "Santiago";
  document.getElementById("configDefaultRate").value = (state.config.defaultInterestRate || 0.005) * 100;
}

function saveSystemConfig() {
  const admin = document.getElementById("configAdminName").value.trim() || "Santiago";
  const ratePct = parseFloat(document.getElementById("configDefaultRate").value) || 0.5;
  state.config.adminName = admin;
  state.config.defaultInterestRate = ratePct / 100.0;
  saveData();
  renderAll();
  showToast("Configuración guardada correctamente");
}

function exportBackupJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `respaldo_natillera_${state.systemDate}.json`);
  dlAnchorElem.click();
  showToast("Copia de seguridad JSON descargada");
}

function importBackupJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (parsed.socios && Array.isArray(parsed.socios)) {
        state.socios = parsed.socios;
        if (parsed.config) state.config = parsed.config;
        if (parsed.systemDate) state.systemDate = parsed.systemDate;
        saveData();
        renderAll();
        showToast("¡Copia de seguridad restaurada con éxito!");
      } else {
        alert("El archivo no tiene el formato válido de respaldo de la Natillera.");
      }
    } catch (err) {
      alert("Error al leer el archivo JSON.");
    }
  };
  reader.readAsText(file);
}

function confirmResetToInitialData() {
  if (confirm("⚠️ ¿Estás seguro de restablecer los datos a la versión original del Excel? Se perderán los cambios locales no respaldados.")) {
    loadInitialData();
    renderAll();
    showToast("Datos restablecidos al estado original de la plantilla Excel.");
  }
}

/**
 * ----------------------------------------------------
 * HELPERS: MODAL Y TOAST
 * ----------------------------------------------------
 */
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.remove("hidden");
    m.classList.add("fade-in");
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add("hidden");
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}
