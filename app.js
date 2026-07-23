/**
 * GoFound Quant Platform — Frontend v2
 * Connects to FastAPI backend with real TimescaleDB data
 */

const API_BASE = "http://localhost:8000";

// ── State ─────────────────────────────────────────────────────────────────────
let authToken   = localStorage.getItem("gfq_token") || null;
let currentUser = null;
let tickerTimer = null;

// ── DOM Refs ──────────────────────────────────────────────────────────────────
const authOverlay   = document.getElementById("authOverlay");
const loginForm     = document.getElementById("loginForm");
const registerForm  = document.getElementById("registerForm");
const authError     = document.getElementById("authError");
const regError      = document.getElementById("regError");
const userEmailDisp = document.getElementById("userEmailDisplay");
const userAvatar    = document.getElementById("userAvatar");
const btnLogout     = document.getElementById("btnLogout");
const mainNav       = document.getElementById("mainNav");
const tabPanes      = document.querySelectorAll(".tab-pane");

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    setupAuth();
    setupNav();

    if (authToken) {
        verifySession();
    } else {
        showAuth(true);
    }
});

// ── Auth ──────────────────────────────────────────────────────────────────────
function showAuth(show) {
    authOverlay.classList.toggle("active", show);
}

function setupAuth() {
    document.getElementById("linkToRegister").addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.remove("active");
        registerForm.classList.add("active");
        clearErrors();
    });
    document.getElementById("linkToLogin").addEventListener("click", e => {
        e.preventDefault();
        registerForm.classList.remove("active");
        loginForm.classList.add("active");
        clearErrors();
    });

    loginForm.addEventListener("submit", async e => {
        e.preventDefault();
        clearErrors();
        const email    = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        try {
            const res  = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) { showError(authError, data.detail || "Error al iniciar sesión"); return; }
            onAuthSuccess(data);
        } catch {
            showError(authError, "No se pudo conectar con el backend. ¿Está corriendo en localhost:8000?");
        }
    });

    registerForm.addEventListener("submit", async e => {
        e.preventDefault();
        clearErrors();
        const full_name = document.getElementById("regName").value.trim();
        const email     = document.getElementById("regEmail").value.trim();
        const password  = document.getElementById("regPassword").value;
        try {
            const res  = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) { showError(regError, data.detail || "Error al registrar usuario"); return; }
            onAuthSuccess(data);
        } catch {
            showError(regError, "No se pudo conectar con el backend.");
        }
    });

    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("gfq_token");
        authToken   = null;
        currentUser = null;
        if (tickerTimer) clearInterval(tickerTimer);
        showAuth(true);
    });
}

function onAuthSuccess(data) {
    authToken   = data.access_token;
    currentUser = { email: data.email, full_name: data.full_name, role: data.role };
    localStorage.setItem("gfq_token", authToken);
    userEmailDisp.textContent = currentUser.email;
    userAvatar.textContent    = (currentUser.full_name || currentUser.email).charAt(0).toUpperCase();
    showAuth(false);
    onDashboardReady();
}

async function verifySession() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
            const data = await res.json();
            currentUser = data;
            userEmailDisp.textContent = data.email;
            userAvatar.textContent    = (data.full_name || data.email).charAt(0).toUpperCase();
            showAuth(false);
            onDashboardReady();
        } else {
            showAuth(true);
        }
    } catch {
        showAuth(true);
    }
}

function showError(el, msg) { el.textContent = msg; el.classList.add("visible"); }
function clearErrors() { authError.classList.remove("visible"); regError.classList.remove("visible"); }

// ── Navigation ────────────────────────────────────────────────────────────────
function setupNav() {
    mainNav.addEventListener("click", e => {
        const btn = e.target.closest(".nav-btn");
        if (!btn) return;
        const tab = btn.dataset.tab;

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        tabPanes.forEach(p => p.classList.toggle("active", p.id === `tab-${tab}`));

        if (tab === "committee") loadCommittee();
        if (tab === "coverage")  loadCoverage();
        if (tab === "backtest")  setupBacktest();
    });
}

// ── After auth: bootstrap everything ─────────────────────────────────────────
function onDashboardReady() {
    loadTicker();
    tickerTimer = setInterval(loadTicker, 30_000); // refresh ticker every 30s

    loadCommittee();
    setupBacktest();

    // Refresh buttons
    document.getElementById("btnRefreshCommittee").addEventListener("click", loadCommittee);
    document.getElementById("btnRefreshCoverage").addEventListener("click", loadCoverage);
}

// ── Authenticated fetch helper ────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            ...(opts.headers || {}),
        },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

// ── Ticker ────────────────────────────────────────────────────────────────────
async function loadTicker() {
    try {
        const data = await apiFetch("/api/market/ticker");
        const items = data.data || [];

        // Duplicate ticker items for seamless infinite scroll
        const track = document.getElementById("tickerTrack");

        items.forEach(item => {
            const sym = item.symbol;
            const priceEl = document.getElementById(`tk-${sym}-price`);
            const chgEl   = document.getElementById(`tk-${sym}-chg`);

            if (priceEl && item.current_price !== null) {
                const digits = (sym.includes("JPY") || sym.includes("XAU") || sym.includes("XAG")) ? 2 : 5;
                priceEl.textContent = item.current_price.toFixed(digits);
            }

            if (chgEl && item.change_pct_24h !== null) {
                const pct = item.change_pct_24h;
                chgEl.textContent  = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
                chgEl.className    = `change ${pct >= 0 ? "positive" : "negative"}`;
            }
        });

        // Update collector status badge using freshness from first M1 candle
        const freshItem = items.find(i => i.last_update);
        if (freshItem) {
            const lastUpdate  = new Date(freshItem.last_update);
            const staleMin    = (Date.now() - lastUpdate.getTime()) / 60_000;
            const badge       = document.getElementById("collectorStatusBadge");
            const statusText  = document.getElementById("collectorStatusText");
            if (staleMin < 10) {
                badge.textContent = "● COLLECTOR";
                badge.style.color = "#10b981";
                statusText.textContent = `Activo · hace ${Math.round(staleMin)}m`;
            } else {
                badge.textContent = "○ COLLECTOR";
                badge.style.color = "#f59e0b";
                statusText.textContent = `Última vela hace ${Math.round(staleMin)}m`;
            }
        }
    } catch (e) {
        console.warn("Ticker load failed:", e.message);
    }
}

// ── Committee ─────────────────────────────────────────────────────────────────
async function loadCommittee() {
    await Promise.all([loadAnalystStatus(), loadDecisions(), loadSignals()]);
}

async function loadAnalystStatus() {
    const grid = document.getElementById("analystGrid");
    try {
        const data     = await apiFetch("/api/committee/status");
        const analysts = data.data || [];

        grid.innerHTML = "";
        analysts.forEach(a => {
            const sig     = a.last_signal || "none";
            const score   = a.score !== null ? a.score : "—";
            const timeStr = a.last_signal_time ? relativeTime(a.last_signal_time) : "Sin señal";
            const pair    = a.last_symbol || "—";
            const tf      = a.last_timeframe || "";

            const cardClass = a.is_active
                ? (sig === "BUY" ? "active buy" : sig === "SELL" ? "active sell" : sig === "VETO" ? "active veto" : "active")
                : "";

            grid.innerHTML += `
                <div class="analyst-card ${cardClass}">
                    <div class="analyst-status-row">
                        <span class="analyst-status-label ${a.is_active ? "" : "inactive"}">
                            <span class="analyst-status-dot"></span>
                            ${a.is_active ? "ACTIVO" : "SIN SEÑAL"}
                        </span>
                        <span class="analyst-score">${score}</span>
                    </div>
                    <div class="analyst-name">${a.name}</div>
                    <div class="analyst-desc">${a.description}</div>
                    <div class="analyst-last-signal">
                        <span>${timeStr} · ${pair} ${tf}</span>
                        <span class="signal-badge ${sig}">${sig.toUpperCase()}</span>
                    </div>
                </div>
            `;
        });

        if (!analysts.length) {
            grid.innerHTML = `<div class="empty-row" style="grid-column:1/-1;">No hay analistas registrados en la base de datos.</div>`;
        }
    } catch (e) {
        grid.innerHTML = `<div class="empty-row" style="grid-column:1/-1; color:#ef4444;">Error al cargar el comité: ${e.message}</div>`;
    }
}

async function loadDecisions() {
    const tbody = document.getElementById("decisionsBody");
    try {
        const data      = await apiFetch("/api/committee/decisions?limit=50");
        const decisions = data.data || [];
        if (!decisions.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Sin decisiones registradas aún. Ejecuta el orquestador primero.</td></tr>`;
            return;
        }
        tbody.innerHTML = decisions.map(d => {
            const dt      = new Date(d.time);
            const timeStr = dt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
            const dateStr = dt.toLocaleDateString("es", { month: "short", day: "numeric" });
            const rec     = d.recommendation || "WAIT";
            return `
                <tr>
                    <td style="color:var(--text-muted)">${dateStr} ${timeStr}</td>
                    <td style="color:var(--text-primary);font-weight:600">${d.symbol}</td>
                    <td style="color:var(--text-secondary)">${d.timeframe}</td>
                    <td><span class="rec-${rec}">${rec}</span></td>
                    <td style="color:var(--accent)">${d.consensus_score || "—"}</td>
                    <td class="reasoning-cell">${d.reasoning || "—"}</td>
                </tr>
            `;
        }).join("");
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-row" style="color:#ef4444;">Error: ${e.message}</td></tr>`;
    }
}

async function loadSignals() {
    const feed = document.getElementById("signalsFeed");
    try {
        const data    = await apiFetch("/api/committee/signals?limit=80");
        const signals = data.data || [];
        if (!signals.length) {
            feed.innerHTML = `<div class="empty-row">Sin señales activas BUY/SELL/VETO registradas.</div>`;
            return;
        }
        feed.innerHTML = signals.map(s => {
            const dt      = new Date(s.time);
            const timeStr = dt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
            return `
                <div class="signal-feed-item">
                    <span class="signal-feed-time">${timeStr}</span>
                    <span class="signal-feed-analyst">${s.analyst_name}</span>
                    <span class="signal-feed-pair">${s.symbol} ${s.timeframe}</span>
                    <span class="signal-badge ${s.raw_signal}">${s.raw_signal}</span>
                </div>
            `;
        }).join("");
    } catch (e) {
        feed.innerHTML = `<div class="empty-row" style="color:#ef4444;">Error: ${e.message}</div>`;
    }
}

// ── Coverage ──────────────────────────────────────────────────────────────────
async function loadCoverage() {
    const thead = document.getElementById("coverageHead");
    const tbody = document.getElementById("coverageBody");
    try {
        const data  = await apiFetch("/api/market/coverage");
        const items = data.data || [];

        if (!items.length) {
            tbody.innerHTML = `<tr><td class="empty-row">Sin datos de cobertura.</td></tr>`;
            return;
        }

        // Get unique timeframes and symbols
        const tfOrder  = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];
        const tfs      = [...new Set(items.map(i => i.timeframe))].sort((a, b) => tfOrder.indexOf(a) - tfOrder.indexOf(b));
        const symbols  = [...new Set(items.map(i => i.symbol))].sort();

        // Build lookup map: symbol+tf → item
        const map = {};
        items.forEach(i => { map[`${i.symbol}_${i.timeframe}`] = i; });

        // Build header
        thead.innerHTML = `<tr>
            <th>Par</th>
            ${tfs.map(tf => `<th>${tf}</th>`).join("")}
        </tr>`;

        // Build rows
        tbody.innerHTML = symbols.map(sym => {
            const cells = tfs.map(tf => {
                const item = map[`${sym}_${tf}`];
                if (!item) return `<td><div class="cov-cell"><span class="cov-indicator cov-empty"></span><span class="cov-dates">Sin datos</span></div></td>`;

                const from    = item.min_date ? new Date(item.min_date).toLocaleDateString("es", { year: "2-digit", month: "numeric", day: "numeric" }) : "—";
                const to      = item.max_date ? new Date(item.max_date).toLocaleDateString("es", { year: "2-digit", month: "numeric", day: "numeric" }) : "—";
                const count   = item.candle_count ? formatNumber(item.candle_count) : "—";
                const indCls  = item.is_fresh ? "cov-fresh" : item.staleness_minutes < 60 ? "cov-stale" : "cov-stale";
                const stale   = item.staleness_minutes !== null ? ` · ${item.staleness_minutes < 60 ? Math.round(item.staleness_minutes) + "m" : Math.round(item.staleness_minutes / 60) + "h"}` : "";

                return `<td>
                    <div class="cov-cell">
                        <span class="cov-indicator ${indCls}"></span>
                        <span class="cov-count">${count} velas</span>
                        <span class="cov-dates">${from}</span>
                        <span class="cov-dates" style="color:var(--accent-green);font-size:9px">${to}${stale}</span>
                    </div>
                </td>`;
            }).join("");

            return `<tr><td>${sym}</td>${cells}</tr>`;
        }).join("");

    } catch (e) {
        tbody.innerHTML = `<tr><td class="empty-row" style="color:#ef4444;">Error al cargar cobertura: ${e.message}</td></tr>`;
    }
}

// ── Backtest ──────────────────────────────────────────────────────────────────
function setupBacktest() {
    const btn = document.getElementById("btnRunBacktest");
    if (btn._initialized) return;
    btn._initialized = true;

    btn.addEventListener("click", runBacktest);
}

async function runBacktest() {
    const symbol    = document.getElementById("bt-symbol").value;
    const timeframe = document.getElementById("bt-timeframe").value;
    const days      = parseInt(document.getElementById("bt-days").value);
    const balance   = parseFloat(document.getElementById("bt-balance").value);
    const risk      = parseFloat(document.getElementById("bt-risk").value);

    const spinner  = document.getElementById("backtestSpinner");
    const resultsEl = document.getElementById("backtestResults");
    const btn      = document.getElementById("btnRunBacktest");

    btn.disabled     = true;
    spinner.classList.remove("hidden");
    resultsEl.innerHTML = `<div class="results-placeholder"><div class="spinner" style="width:36px;height:36px"></div><p>Simulando el comité en ${days} días de historia...</p></div>`;

    try {
        const data = await apiFetch("/api/backtest/run", {
            method: "POST",
            body: JSON.stringify({ symbol, timeframe, days, balance, risk }),
        });

        renderBacktestReport(data);
    } catch (e) {
        resultsEl.innerHTML = `<div class="results-placeholder" style="color:#ef4444;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>Error en la simulación: ${e.message}</p>
        </div>`;
    } finally {
        btn.disabled = false;
        spinner.classList.add("hidden");
    }
}

function renderBacktestReport(data) {
    const s  = data.summary;
    const eq = data.equity_curve || [];
    const trades = data.trades || [];
    const resultsEl = document.getElementById("backtestResults");

    const isProfit = s.net_profit >= 0;
    const netClass = isProfit ? "positive" : "negative";

    resultsEl.innerHTML = `
        <div class="bt-report">

            <div class="bt-stats-grid">
                <div class="bt-stat-card">
                    <div class="bt-stat-val ${netClass}">${isProfit ? "+" : ""}${s.net_profit_pct.toFixed(2)}%</div>
                    <div class="bt-stat-label">Retorno Neto</div>
                </div>
                <div class="bt-stat-card">
                    <div class="bt-stat-val ${isProfit ? "positive" : "negative"}">$${formatNumber(Math.abs(s.net_profit))}</div>
                    <div class="bt-stat-label">P&L Neto · ${s.symbol} ${s.timeframe}</div>
                </div>
                <div class="bt-stat-card">
                    <div class="bt-stat-val neutral">${s.win_rate}%</div>
                    <div class="bt-stat-label">Win Rate · ${s.win_count}W / ${s.loss_count}L</div>
                </div>
                <div class="bt-stat-card">
                    <div class="bt-stat-val neutral">${s.profit_factor !== null ? s.profit_factor : "N/A"}</div>
                    <div class="bt-stat-label">Profit Factor</div>
                </div>
                <div class="bt-stat-card">
                    <div class="bt-stat-val neutral">${s.sharpe_ratio}</div>
                    <div class="bt-stat-label">Sharpe Ratio</div>
                </div>
                <div class="bt-stat-card">
                    <div class="bt-stat-val warning">${s.max_drawdown_pct}%</div>
                    <div class="bt-stat-label">Max Drawdown</div>
                </div>
                <div class="bt-stat-card">
                    <div class="bt-stat-val neutral">${s.total_trades}</div>
                    <div class="bt-stat-label">Total Operaciones</div>
                </div>
                <div class="bt-stat-card">
                    <div class="bt-stat-val neutral">$${formatNumber(s.final_balance)}</div>
                    <div class="bt-stat-label">Balance Final</div>
                </div>
            </div>

            <div class="bt-chart-container">
                <div class="bt-chart-title">Curva de Equity — ${s.symbol} ${s.timeframe} (${s.days} días)</div>
                <canvas id="equityCanvas"></canvas>
            </div>

            ${trades.length > 0 ? `
            <div class="glass-panel" style="padding:0;overflow:hidden">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                    <h3 style="font-size:14px;font-weight:600;color:var(--text-primary)">Últimas ${Math.min(trades.length, 50)} Operaciones</h3>
                </div>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Entrada</th>
                                <th>Salida</th>
                                <th>Dir.</th>
                                <th>Precio Entrada</th>
                                <th>Precio Salida</th>
                                <th>Lotes</th>
                                <th>P&L</th>
                                <th>Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trades.map(t => {
                                const pnlCls = t.pnl >= 0 ? "color:var(--accent-green)" : "color:var(--accent-red)";
                                const resCls = t.result === "TP" ? "color:var(--accent-green)" : "color:var(--accent-red)";
                                const entryDt = new Date(t.entry_time);
                                const exitDt  = new Date(t.exit_time);
                                return `<tr>
                                    <td>${entryDt.toLocaleDateString("es",{month:"short",day:"numeric"})} ${entryDt.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</td>
                                    <td>${exitDt.toLocaleDateString("es",{month:"short",day:"numeric"})} ${exitDt.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</td>
                                    <td><span class="signal-badge ${t.direction}">${t.direction}</span></td>
                                    <td>${t.entry_price}</td>
                                    <td>${t.exit_price}</td>
                                    <td>${t.size}</td>
                                    <td style="${pnlCls};font-weight:600">${t.pnl >= 0 ? "+" : ""}$${t.pnl.toFixed(2)}</td>
                                    <td style="${resCls};font-weight:700">${t.result}</td>
                                </tr>`;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>` : ""}
        </div>
    `;

    // Draw equity curve
    drawEquityCurve(eq, s.initial_balance);
}

function drawEquityCurve(curve, initialBalance) {
    const canvas = document.getElementById("equityCanvas");
    if (!canvas || !curve.length) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top  - PAD.bottom;

    const equities = curve.map(p => p.equity);
    const minEq    = Math.min(...equities) * 0.999;
    const maxEq    = Math.max(...equities) * 1.001;
    const range    = maxEq - minEq || 1;

    // Normalise a value to canvas Y
    const toX = i  => PAD.left + (i / (curve.length - 1)) * plotW;
    const toY = eq => PAD.top  + plotH - ((eq - minEq) / range) * plotH;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
        const y = PAD.top + (i / 4) * plotH;
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();

        const val = maxEq - (i / 4) * range;
        ctx.fillStyle = "rgba(122,142,168,0.6)";
        ctx.font      = `10px Inter, sans-serif`;
        ctx.fillText(`$${Math.round(val).toLocaleString()}`, 4, y + 4);
    }

    // Draw initial balance line
    const baseY = toY(initialBalance);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, baseY);
    ctx.lineTo(W - PAD.right, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Build path
    ctx.beginPath();
    curve.forEach((pt, i) => {
        const x = toX(i);
        const y = toY(pt.equity);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    // Stroke
    const lastEq = equities[equities.length - 1];
    const lineColor = lastEq >= initialBalance ? "#10b981" : "#ef4444";

    ctx.strokeStyle = lineColor;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = "round";
    ctx.stroke();

    // Fill gradient
    ctx.lineTo(toX(curve.length - 1), PAD.top + plotH);
    ctx.lineTo(PAD.left, PAD.top + plotH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
    grad.addColorStop(0,   lastEq >= initialBalance ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)");
    grad.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fill();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(isoStr) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const min  = Math.round(diff / 60_000);
    if (min < 1)   return "ahora";
    if (min < 60)  return `hace ${min}m`;
    const hrs = Math.round(min / 60);
    if (hrs < 24)  return `hace ${hrs}h`;
    return `hace ${Math.round(hrs / 24)}d`;
}

function formatNumber(n) {
    if (n === undefined || n === null) return "—";
    return Number(n).toLocaleString("es");
}
