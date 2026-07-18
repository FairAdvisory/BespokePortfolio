import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LabelList, ReferenceLine, Legend,
  ComposedChart, Area, Line,
} from "recharts";

/* ============================================================
   Portfolio Blend — AIA ILP funds
   Tab 1: Core & Satellite blend builder
   Tab 2: Individual fund performance vs benchmark
   All data: AIA / Morningstar factsheets, 31 May 2026, SGD, bid-to-bid.
   ============================================================ */

const C = {
  paper: "#F6F4EE", ink: "#16261E", inkSoft: "#55655C",
  green: "#1E5C44", greenDeep: "#143F2F", greenTint: "#E7EFE8",
  gold: "#B6862C", goldSoft: "#F3E6C6", red: "#B04A38",
  line: "#DBD9D0", surface: "#FFFFFF", satTint: "#FBF1DC", bm: "#9AA7A0",
};
const CORE_COL = ["#1E5C44", "#2E8B63", "#5BA981"];
const SAT_COL  = ["#B6862C", "#D8A93E", "#C77D3A", "#3C6E9A"];

const PERIODS = [
  { key: "m6",    label: "6 Months",        ann: false, gy: null, growth: true  },
  { key: "y1",    label: "1 Year",          ann: false, gy: 1,    growth: true  },
  { key: "y3",    label: "3 Years",         ann: true,  gy: 3,    growth: true  },
  { key: "y5",    label: "5 Years",         ann: true,  gy: 5,    growth: true  },
  { key: "y10",   label: "10 Years",        ann: true,  gy: 10,   growth: true  },
  { key: "incep", label: "Since inception", ann: true,  gy: null, growth: false },
];
const ALLP = [
  { key: "m1", label: "1 Month", ann: false }, { key: "m3", label: "3 Months", ann: false },
  { key: "m6", label: "6 Months", ann: false }, { key: "y1", label: "1 Year", ann: false },
  { key: "y3", label: "3 Years", ann: true }, { key: "y5", label: "5 Years", ann: true },
  { key: "y10", label: "10 Years", ann: true }, { key: "incep", label: "Since incep.", ann: true },
];

const DATA = [
  { name: "AIA Adventurous Index Fund", sleeve: "core", include: true,
    price: "1.292", fee: "1.00%", risk: "Higher Risk", launch: "4 Oct 2024", sub: "Cash",
    underlying: "Global ETF / index basket (equity, bond, commodity)", note: "Diversified multi-asset index — <2 yr history",
    ret: { m1: 5.64, m3: 8.57, m6: 11.28, y1: 29.20, y3: null, y5: null, y10: null, incep: 16.76 },
    bm:  { m1: null, m3: null, m6: null, y1: null, y3: null, y5: null, y10: null, incep: null },
    holdings: [["iShares Core S&P 500 ETF", 18.79], ["SPDR S&P 500 ETF", 18.73], ["Vanguard S&P 500 ETF", 18.65]],
    sectors: null, countries: [["United States (heavy)", null]] },

  { name: "AIA Elite Adventurous Fund", sleeve: "core", include: true,
    price: "1.844", fee: "1.45%", risk: "Higher Risk", launch: "19 Jul 2019", sub: "Cash, SRS",
    underlying: "AIA multi-manager global funds (~90% equity / 10% bond)", note: "Broadly diversified global fund-of-funds",
    ret: { m1: 4.65, m3: 5.01, m6: 6.41, y1: 18.59, y3: 13.42, y5: 4.98, y10: null, incep: 9.34 },
    bm:  { m1: 4.31, m3: 7.35, m6: 8.64, y1: 23.80, y3: 17.87, y5: 10.02, y10: null, incep: 11.61 },
    holdings: [["Alphabet Inc", 3.87], ["Taiwan Semiconductor", 3.41], ["Microsoft Corp", 3.30]],
    sectors: [["Info Technology", 27.55], ["Health Care", 14.35], ["Financials", 14.10]],
    countries: [["Americas", 72.81], ["Europe", 17.14], ["Asia", 9.09]] },

  { name: "AIA Acorns of Asia Fund", sleeve: "core", include: true,
    price: "4.784", fee: "1.50%", risk: "Medium to High Risk", launch: "31 Aug 2001", sub: "Cash, CPF(OA & SA), SRS",
    underlying: "Asian ex-Japan equity + SGD fixed income (balanced)", note: "Balanced multi-asset — steadier core holding",
    ret: { m1: 8.04, m3: 7.97, m6: 18.68, y1: 36.61, y3: 14.10, y5: 4.01, y10: 7.29, incep: 6.77 },
    bm:  { m1: 7.10, m3: 8.07, m6: 18.01, y1: 33.89, y3: 16.22, y5: 5.27, y10: 7.58, incep: 7.24 },
    holdings: [["Taiwan Semiconductor", 11.12], ["Samsung Electronics", 7.46], ["SK Hynix", 4.96]],
    sectors: [["Info Technology", 52.60], ["Financials", 11.70], ["Consumer Disc.", 11.40]],
    countries: [["Taiwan", 29.00], ["Korea", 27.50], ["China", 21.40]] },

  { name: "AIA Global Technology Fund", sleeve: "satellite", include: true,
    price: "7.046", fee: "1.50%", risk: "Higher Risk", launch: "11 Dec 2000", sub: "Cash, CPF(OA), SRS",
    underlying: "Franklin Technology Fund", note: "Sector bet — 41% semiconductors, US-heavy",
    ret: { m1: 16.41, m3: 33.02, m6: 25.87, y1: 52.44, y3: 29.04, y5: 13.00, y10: 20.24, incep: 8.19 },
    bm:  { m1: 16.15, m3: 31.17, m6: 22.01, y1: 52.72, y3: 31.16, y5: 20.92, y10: 23.73, incep: 9.76 },
    holdings: [["NVIDIA Corp", 7.72], ["Broadcom Inc", 7.61], ["Taiwan Semiconductor", 5.38]],
    sectors: [["Semiconductors", 41.30], ["Systems Software", 8.71], ["Semicon Materials", 8.56]],
    countries: [["United States", 80.11], ["Taiwan", 5.40], ["South Korea", 5.15]] },

  { name: "AIA Japan Equity Fund", sleeve: "satellite", include: true,
    price: "1.417", fee: "1.50%", risk: "Higher Risk", launch: "9 Mar 2006", sub: "Cash, CPF(OA), SRS",
    underlying: "Amova Japan Equity Fund", note: "Single-country — Japanese equities",
    ret: { m1: 5.83, m3: -0.14, m6: 17.99, y1: 40.30, y3: 24.57, y5: 12.40, y10: 10.72, incep: 2.00 },
    bm:  { m1: 4.71, m3: 0.23, m6: 14.21, y1: 29.12, y3: 17.66, y5: 8.64, y10: 8.52, incep: 3.71 },
    holdings: [["Mitsubishi UFJ Financial", 4.20], ["Sony Group", 3.20], ["Sumitomo Mitsui Fin.", 3.10]],
    sectors: [["Industrials", 29.20], ["Consumer Disc.", 15.70], ["Info Technology", 15.10]],
    countries: [["Japan", 100]] },

  { name: "AIA Emerging Markets Equity Fund", sleeve: "satellite", include: true,
    price: "2.294", fee: "1.50%", risk: "Higher Risk", launch: "11 Apr 2006", sub: "Cash, CPF(OA), SRS",
    underlying: "Schroder ISF Global EM Opportunities", note: "EM equity — Taiwan / China / Korea",
    ret: { m1: 10.93, m3: 16.21, m6: 35.18, y1: 68.43, y3: 24.07, y5: 7.40, y10: 11.29, incep: 4.48 },
    bm:  { m1: 9.71, m3: 9.91, m6: 26.30, y1: 51.28, y3: 22.34, y5: 6.61, y10: 9.73, incep: 5.13 },
    holdings: [["Taiwan Semiconductor", 9.50], ["Samsung Electronics", 9.39], ["SK Hynix", 8.45]],
    sectors: [["Info Technology", 45.14], ["Industrials", 13.77], ["Consumer Disc.", 13.37]],
    countries: [["Taiwan", 24.60], ["China", 22.26], ["South Korea", 21.31]] },

  { name: "AIA Regional Equity Fund", sleeve: "satellite", include: true,
    price: "10.327", fee: "1.25%", risk: "Higher Risk", launch: "2 Sep 1997", sub: "Cash, CPF(OA), SRS",
    underlying: "Fidelity Asia Equity II ESG Fund", note: "Asia ex-Japan equity — regional tilt",
    ret: { m1: 10.73, m3: 10.17, m6: 23.59, y1: 49.36, y3: 16.29, y5: 2.67, y10: 8.32, incep: 8.66 },
    bm:  { m1: 11.41, m3: 12.54, m6: 29.32, y1: 54.89, y3: 23.48, y5: 6.84, y10: 10.45, incep: 5.97 },
    holdings: [["Samsung Electronics", 10.24], ["Taiwan Semiconductor", 9.85], ["SK Hynix", 6.04]],
    sectors: [["Info Technology", 41.83], ["Financials", 19.48], ["Consumer Disc.", 13.11]],
    countries: [["Taiwan", 22.30], ["China", 21.37], ["Korea", 19.74]] },
].map((f, i) => ({ id: i, asOf: "31 May 2026", ...f }));

const equalWeights = (list) => {
  const n = list.filter((f) => f.include).length || 1;
  return list.map((f) => ({ ...f, w: f.include ? +(100 / n).toFixed(2) : 0 }));
};
const fmtPct = (v) => (v === null || v === undefined || Number.isNaN(v) ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`);
const fmtMoney = (v) => "S$" + Math.round(v).toLocaleString("en-SG");
const toN = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const clr = (v) => (v === null || v === undefined ? C.inkSoft : v >= 0 ? C.green : C.red);

// shared blend maths (used by blend builder + monthly plan)
const sleeveSumW = (funds, sleeve) => funds.filter((f) => f.sleeve === sleeve && f.include).reduce((a, f) => a + (toN(f.w, 0)), 0);
const effW = (funds, coreShare, f) => {
  if (!f.include) return 0;
  const denom = sleeveSumW(funds, f.sleeve);
  if (!denom) return 0;
  const share = f.sleeve === "core" ? coreShare : 100 - coreShare;
  return (share / 100) * (toN(f.w, 0) / denom);
};
const blendFor = (funds, coreShare, key) => {
  const wd = funds.filter((f) => f.include && typeof f.ret[key] === "number");
  const s = wd.reduce((a, f) => a + effW(funds, coreShare, f), 0);
  if (!wd.length || s === 0) return null;
  return wd.reduce((a, f) => a + f.ret[key] * (effW(funds, coreShare, f) / s), 0);
};

// ---- product wrappers ----
const welcomeAPA = (a) => { if (a < 2400) return [0, 0, 0]; if (a < 4800) return [0.05, 0, 0]; if (a < 7200) return [0.05, 0.08, 0.10]; if (a < 12000) return [0.10, 0.13, 0.15]; return [0.15, 0.18, 0.20]; };
const bandAPA = (a) => a < 2400 ? "below minimum" : a < 4800 ? "S$2,400–4,799" : a < 7200 ? "S$4,800–7,199" : a < 12000 ? "S$7,200–11,999" : "≥ S$12,000";
const welcomePWV = (a) => { if (a < 24000) return [0, 0, 0]; if (a < 42000) return [0.03, 0, 0]; return [0.03, 0.04, 0.05]; };
const bandPWV = (a) => a < 18000 ? "below minimum" : a < 24000 ? "S$18,000–23,999" : a < 42000 ? "S$24,000–41,999" : "≥ S$42,000";

// AIA Global Adventurous Income Fund — quarterly distributions (from AIA DD sheet)
const GAIF = {
  name: "Global Adventurous Income Fund", launch: "5 Oct 2023", yield: 0.070,
  history: [
    ["Mar 2025", 0.01780, 6.99], ["Jun 2025", 0.01755, 7.03], ["Sep 2025", 0.01840, 7.04],
    ["Dec 2025", 0.01875, 7.10], ["Mar 2026", 0.01810, 7.03], ["Jun 2026", 0.01900, 7.00],
  ],
};

const PRODUCTS = {
  apa3: {
    key: "apa3", name: "AIA Pro Achiever 3.0", short: "Pro Achiever 3.0",
    chargeRate: 0.039, chargeYears: 10, premiumYears: null, minMonthly: 200,
    welcome: welcomeAPA, band: bandAPA, invBonus: 0, invBonusYears: [], perfBonus: 0,
    tag: "Regular-premium ILP · premiums throughout",
  },
  pwv2: {
    key: "pwv2", name: "AIA Platinum Wealth Venture 2.0", short: "Platinum Wealth Venture 2.0",
    chargeRate: 0.036, chargeYears: 7, premiumYears: 5, minMonthly: 1500, minAnnual: 18000, lockYears: 7,
    topupCharge: 0.03, minTopup: 1000,
    welcome: welcomePWV, band: bandPWV, invBonus: 0.025, invBonusYears: [8, 9, 10, 11], perfBonus: 0.004,
    fund: GAIF, tag: "5-year premium term · income focus",
  },
};

// policy-value projection for a chosen product
// premium: amount; freq: "monthly" | "annual"; opts.reinvest: dividend handling (income funds)
const projectProduct = (premium, freq, years, rGrossPct, key, opts = {}) => {
  const cfg = PRODUCTS[key];
  const divYield = cfg.fund ? cfg.fund.yield : 0;
  const isIncome = !!cfg.fund;
  const withdraw = isIncome && opts.reinvest === false;            // take dividends as cash
  // the assumed return is the fund's capital/price growth. For an income fund the ~divYield
  // distribution is paid from income ON TOP of that: reinvested it adds to growth; withdrawn
  // it is paid as cash and the capital keeps growing at the input rate (principal is not consumed).
  const effReturn = isIncome && !withdraw ? rGrossPct + divYield * 100 : rGrossPct;
  const i = Math.pow(1 + effReturn / 100, 1 / 12) - 1;
  const N = years * 12;
  const premMonths = cfg.premiumYears ? Math.min(cfg.premiumYears * 12, N) : N;
  const annualised = freq === "annual" ? premium : premium * 12;
  const wr = cfg.welcome(annualised);
  // ad-hoc top-up: invested on day 1 (net of top-up charge), earns growth + distribution immediately
  const topup = opts.topup || 0;
  const topupNet = topup * (1 - (cfg.topupCharge || 0));
  let val = topupNet, contributed = topup, wbonus = 0, ibonus = 0, income = 0;
  const pts = [{ year: "Y0", Contributions: Math.round(topup), Value: Math.round(topupNet), Income: 0 }];
  for (let m = 1; m <= N; m++) {
    const atStart = (m - 1) % 12 === 0;
    const py = Math.floor((m - 1) / 12) + 1;
    const pay = m <= premMonths;
    let contrib = 0;
    if (freq === "annual") { if (pay && atStart) contrib = premium; } else if (pay) contrib = premium;
    const wb = contrib > 0 && py <= 3 ? wr[py - 1] : 0;
    if (contrib > 0) { contributed += contrib; wbonus += contrib * wb; val += contrib * (1 + wb); }
    val *= (1 + i);
    if (m <= cfg.chargeYears * 12) val *= (1 - cfg.chargeRate / 12);
    if (withdraw && m % 3 === 0) income += val * divYield / 4;   // quarterly cash payout
    if (cfg.invBonus && atStart && cfg.invBonusYears.includes(py)) { const ib = cfg.invBonus * annualised; val += ib; ibonus += ib; }
    if (cfg.perfBonus && atStart && py >= 8) val += cfg.perfBonus * val;
    if (m % 12 === 0) pts.push({ year: "Y" + m / 12, Contributions: Math.round(contributed), Value: Math.round(val), Income: Math.round(income) });
  }
  return { fv: val, contributed, wbonus, ibonus, bonus: wbonus + ibonus, income, wr, pts, premMonths, cfg, withdraw, divYield, topup, topupNet };
};

const RATE_PERIODS = [["y1", "1Y"], ["y3", "3Y"], ["y5", "5Y"], ["y10", "10Y"]];
const assumedRate = (funds, coreShare, ratePeriod, manual) => {
  let live = blendFor(funds, coreShare, ratePeriod);
  let src = (RATE_PERIODS.find((p) => p[0] === ratePeriod) || ["", "5Y"])[1];
  if (live === null) {
    for (const [k, l] of [["y5", "5Y"], ["y3", "3Y"], ["y1", "1Y"]]) {
      const v = blendFor(funds, coreShare, k);
      if (v !== null) { live = v; src = l; break; }
    }
  }
  if (live === null) live = 5;
  const rounded = Math.round(live * 100) / 100;
  const useManual = manual != null && manual !== "" && Number.isFinite(+manual);
  return { rate: useManual ? +manual : rounded, live: rounded, src };
};

// ---- live one-pager (print → Save as PDF), no external libraries ----
const buildOnePagerHTML = (d) => {
  const money = (v) => "S$" + Math.round(v).toLocaleString("en-SG");
  const inc = d.funds.filter((f) => f.include);
  const eff = (f) => effW(d.funds, d.coreShare, f) * 100;
  const maxEff = Math.max(...inc.map(eff), 1);
  const per = (k) => { const v = blendFor(d.funds, d.coreShare, k); return v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%"; };
  const proj = projectProduct(d.premium, d.freq, d.years, d.rate, d.product, { reinvest: d.reinvest, topup: d.topup || 0 });
  const growthPct = proj.fv > 0 ? (proj.fv - proj.contributed) / proj.fv * 100 : 0;
  const CO = ["#1E5C44", "#2E8B63", "#5BA981"], SA = ["#B6862C", "#D8A93E", "#C77D3A", "#3C6E9A"];
  const colorOf = (f) => { const arr = f.sleeve === "core" ? CO : SA; const i = inc.filter((x) => x.sleeve === f.sleeve).findIndex((x) => x.id === f.id); return arr[(i < 0 ? 0 : i) % arr.length]; };
  const row = (f) => `<div class="frow"><span class="dot" style="background:${colorOf(f)}"></span>
    <span class="fn">${f.name.replace(/^AIA /, "")}</span>
    <span class="track"><span class="fill" style="width:${eff(f) / maxEff * 100}%;background:${colorOf(f)}"></span></span>
    <b class="fw">${eff(f).toFixed(1)}%</b></div>`;
  const core = inc.filter((f) => f.sleeve === "core"), sat = inc.filter((f) => f.sleeve === "satellite");
  const stat = (p, v, pa) => `<div class="stat"><div class="sp">${p}</div><div class="sv">${v}<span>${pa || ""}</span></div></div>`;
  const bonusLine = proj.bonus > 0 ? `<div class="sub2">Includes ${money(proj.bonus)} in bonuses.</div>` : "";
  const topupLine = proj.topup > 0 ? `<div class="sub2">Includes a ${money(proj.topup)} day-1 top-up (${money(proj.topupNet)} invested), earning income immediately.</div>` : "";
  const incomeLine = d.product === "pwv2"
    ? (proj.withdraw
        ? `<div class="sub2">Plus ${money(proj.income)} of quarterly income drawn as cash over ${d.years} years.</div>`
        : `<div class="sub2">Via ${GAIF.name}: ≈ ${money(proj.fv * GAIF.yield / 4)}/quarter income at ~${(GAIF.yield * 100).toFixed(1)}% p.a. if taken as cash (non-guaranteed).</div>`)
    : "";
  const wrapName = proj.cfg.name;
  const freqWord = d.freq === "annual" ? "year" : "month";
  const cadence = d.freq === "annual" ? `ANNUAL · ${d.years} YEARS` : `MONTHLY · ${d.years} YEARS`;
  const productDisc = d.product === "pwv2"
    ? " inside AIA Platinum Wealth Venture 2.0 (5-year premium term, 100% allocation, 3.6% p.a. supplementary charge for the first 7 years, welcome bonus for the premium band, investment bonus in years 8–11 and performance bonus from year 8; benefit charge, rider premiums and surrender charges excluded)"
    : " inside AIA Pro Achiever 3.0 (premiums throughout, 100% allocation, 3.9% p.a. supplementary charge for the first 10 years and welcome bonus for the premium band; benefit charge, rider premiums and surrender charges excluded)";

  return `<!doctype html><html><head><meta charset="utf-8"><title>Bespoke Portfolio — ${d.clientName || "Summary"}</title>
  <style>
    @page{size:A4;margin:13mm} *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16261E;font-variant-numeric:tabular-nums}
    .band{background:#143F2F;color:#fff;padding:16px 20px;border-radius:8px}
    .eye{color:#B6862C;font-size:9px;letter-spacing:.14em;font-weight:700}
    .h1{font-family:Georgia,serif;font-size:26px;margin-top:2px}
    .band .r{float:right;text-align:right;color:#F3E6C6;font-size:9px}
    .meta{display:flex;justify-content:space-between;font-size:11px;color:#55655C;margin:12px 2px;border-bottom:1px solid #DBD9D0;padding-bottom:10px}
    h2{font-size:8.5px;letter-spacing:.08em;color:#B6862C;text-transform:uppercase;margin:16px 0 3px}
    .sub{font-family:Georgia,serif;font-size:14px;font-weight:600}
    .split{display:flex;height:16px;border-radius:4px;overflow:hidden;margin:8px 0 12px;font-size:8.5px;font-weight:700;color:#fff;line-height:16px}
    .split .c{background:#1E5C44;padding-left:6px} .split .s{background:#B6862C;text-align:right;padding-right:6px}
    .slab{font-size:8px;font-weight:700;color:#55655C;text-transform:uppercase;margin:8px 0 4px}
    .frow{display:flex;align-items:center;gap:8px;font-size:9.5px;padding:2px 0}
    .dot{width:9px;height:9px;border-radius:2px;flex:none}.fn{width:170px}.fw{width:42px;text-align:right}
    .track{flex:1;height:7px;background:#EDEAE1;border-radius:3px;overflow:hidden}.fill{display:block;height:7px}
    .stats{display:flex;gap:8px;margin:6px 0}
    .stat{flex:1;background:#E7EFE8;border-radius:6px;padding:8px 10px}
    .sp{font-size:8px;color:#55655C}.sv{font-family:Georgia,serif;font-size:16px;color:#1E5C44;font-weight:700}.sv span{font-size:8px;color:#55655C;margin-left:3px}
    .note{font-size:7.6px;color:#55655C;font-style:italic;margin-top:2px}
    .cards{display:flex;gap:12px;margin-top:6px}
    .card{flex:1;border:1px solid #DBD9D0;border-radius:8px;padding:12px}
    .ct{font-size:8px;font-weight:700;color:#55655C;letter-spacing:.04em}.cl{font-size:9px;margin-top:4px}
    .cv{font-family:Georgia,serif;font-size:22px;color:#1E5C44;font-weight:700}
    .bar{display:flex;height:7px;border-radius:4px;overflow:hidden;margin:8px 0 4px}
    .sub2{font-size:8px;color:#55655C;margin-top:3px}
    .foot{margin-top:14px;border-top:1px solid #DBD9D0;padding-top:10px;font-size:7.4px;color:#55655C;line-height:1.5}
    .foot b{color:#16261E}
    .toolbar{position:fixed;top:8px;right:8px}
    .toolbar button{font:inherit;background:#1E5C44;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-weight:600;cursor:pointer}
    @media print{.toolbar{display:none}}
  </style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="band"><div class="r">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}<br>A core &amp; satellite illustration</div>
    <div class="eye">AIA ILP FUNDS · BESPOKE MANAGEMENT</div><div class="h1">Bespoke Portfolio</div></div>
  <div class="meta"><span>Prepared for: <b>${d.clientName || "________________"}</b></span><span>Adviser: Darren · Advisors Alliance Group</span></div>

  <h2>Your proposed blend</h2><div class="sub">${d.coreShare}% core · ${100 - d.coreShare}% satellite</div>
  <div class="split"><div class="c" style="width:${d.coreShare}%">CORE ${d.coreShare}%</div><div class="s" style="width:${100 - d.coreShare}%">SATELLITE ${100 - d.coreShare}%</div></div>
  ${core.length ? `<div class="slab">Core — diversified foundation</div>${core.map(row).join("")}` : ""}
  ${sat.length ? `<div class="slab">Satellite — higher-conviction tilts</div>${sat.map(row).join("")}` : ""}

  <h2>How this blend has performed</h2><div class="sub">Blended return by period</div>
  <div class="stats">${stat("1 Year", per("y1"), "")}${stat("3 Years", per("y3"), "p.a.")}${stat("5 Years", per("y5"), "p.a.")}${stat("10 Years", per("y10"), "p.a.")}</div>
  <div class="note">Weighted average across the funds, SGD bid-to-bid, dividends reinvested, before policy fees. Annualised where marked p.a. Backward-looking, not a forecast.</div>

  <h2>Bringing it to life</h2><div class="sub">A regular-investing illustration</div>
  <div class="cards">
    <div class="card"><div class="ct">${cadence} · ${wrapName}</div>
      <div class="cl">${money(d.premium)} / ${freqWord} at ${d.rate.toFixed(2)}% p.a. could grow to</div>
      <div class="cv">${money(proj.fv)}</div>
      <div class="bar"><span style="width:${100 - growthPct}%;background:#F3E6C6"></span><span style="width:${growthPct}%;background:#5BA981"></span></div>
      <div class="sub2">You put in ${money(proj.contributed)} · Growth ${money(proj.fv - proj.contributed)} (${growthPct.toFixed(0)}%)</div>${bonusLine}${topupLine}${incomeLine}
    </div>
    <div class="card"><div class="ct">THE IDEA</div>
      <div class="cl" style="margin-top:8px;line-height:1.5">${d.product === "pwv2"
        ? "Commit for 5 years, stay invested for the long term. The Global Adventurous Income Fund aims to pay a steady quarterly income you can reinvest or draw as cash."
        : "A steady core does the compounding; focused satellites add conviction. Regular monthly investing keeps you in the market through the ups and downs — built for the long term."}</div>
    </div>
  </div>

  <div class="foot"><b>Important.</b> For illustration and discussion only; not financial advice, a recommendation, or an offer. The blended return is a weighted
  average of each fund's stated period return and assumes rebalancing to the shown weights; actual returns differ. The value illustration applies one assumed
  return, compounded monthly, to level premiums${productDisc}.${d.product === "pwv2" ? " Distribution yield shown is from recent history; dividends are non-guaranteed and may be paid out of capital, which can reduce the investment." : ""}
  Figures are SGD, bid-to-bid, dividends reinvested unless taken as cash. Verify against AIA's current published data and the relevant Product Summary before acting. ILP sub-funds
  carry risk including possible loss of principal; unit values may rise or fall. <b>Past performance is not necessarily indicative of future performance.</b></div>
  </body></html>`;
};

const exportOnePager = (d) => {
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups for this page to export the summary as a PDF."); return; }
  w.document.open(); w.document.write(buildOnePagerHTML(d)); w.document.close(); w.focus();
  setTimeout(() => { try { w.print(); } catch (e) {} }, 400);
};

/* ---- goal-based front door ---- */
// CPF 2026 (Standard Plan, payouts from age 65; official figures, payouts are estimates)
const CPF = {
  year: 2026, payoutAge: 65,
  tiers: [
    { key: "brs", name: "Basic Retirement Sum", short: "Basic (BRS)", sum: 110200, payout: 950 },
    { key: "frs", name: "Full Retirement Sum", short: "Full (FRS)", sum: 220400, payout: 1730 },
    { key: "ers", name: "Enhanced Retirement Sum", short: "Enhanced (ERS)", sum: 440800, payout: 3440 },
  ],
};
const PLAN = { growth: { low: 3, mid: 6, high: 9 }, income: { low: 5, mid: 7, high: 9 } };
const INFLATION = 0.03;

const GOALS = [
  { key: "nest",   label: "Retire with a Goal",           kind: "growth", to: 65, defTarget: 1000000, product: "apa3", freq: "monthly", tag: "The classic “$1M by 65”." },
  { key: "income", label: "Retire with a Monthly Income", kind: "income", to: 65, defIncome: 3000,     product: "pwv2", freq: "annual",  tag: "A paycheck for life, on top of CPF." },
  { key: "child",  label: "A head start for my Child",    kind: "growth", childTo: 25, defTarget: 200000, product: "apa3", freq: "monthly", tag: "University, first home, a wedding." },
  { key: "grow",   label: "Build Long Term Wealth",       kind: "growth", defYears: 15, defTarget: 250000, product: "apa3", freq: "monthly", tag: "A disciplined, long-horizon plan." },
];

// invert the projection: smallest premium that reaches a target value (fv is monotonic in premium)
const solvePremium = (targetFV, freq, years, rate, key, opts = {}) => {
  if (years <= 0 || targetFV <= 0) return 0;
  let lo = 0, hi = freq === "annual" ? 2000000 : 200000;
  for (let k = 0; k < 46; k++) { const mid = (lo + hi) / 2; const fv = projectProduct(mid, freq, years, rate, key, opts).fv; if (fv < targetFV) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};
const realValue = (v, years) => v / Math.pow(1 + INFLATION, years);

/* ---------- shared style block ---------- */
const StyleBlock = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap');
    * { box-sizing: border-box; }
    .pb-input { font: inherit; color:${C.ink}; background:${C.surface}; border:1px solid ${C.line}; border-radius:7px; width:100%; outline:none; }
    .pb-input:focus { border-color:${C.green}; box-shadow:0 0 0 3px ${C.greenTint}; }
    .pb-btn { font:inherit; font-weight:600; cursor:pointer; border-radius:8px; border:1px solid ${C.green}; background:${C.green}; color:#fff; padding:9px 14px; transition:.15s; }
    .pb-btn:hover { background:${C.greenDeep}; }
    .pb-btn.ghost { background:transparent; color:${C.green}; }
    .pb-btn.ghost:hover { background:${C.greenTint}; }
    .pb-chip { font:inherit; font-weight:500; cursor:pointer; border:1px solid ${C.line}; background:${C.surface}; color:${C.inkSoft}; padding:7px 12px; border-radius:999px; transition:.15s; }
    .pb-chip[data-on="true"] { background:${C.green}; color:#fff; border-color:${C.green}; }
    .pb-row:hover { background:${C.greenTint}44; }
    input[type=range]{ -webkit-appearance:none; height:6px; border-radius:999px; outline:none; }
    input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none; width:22px; height:22px; border-radius:50%; background:#fff; border:3px solid ${C.green}; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,.2); }
    .pb-tab { font:inherit; font-weight:600; cursor:pointer; border:none; background:none; padding:10px 4px; color:${C.inkSoft}; border-bottom:2px solid transparent; }
    .pb-tab[data-on="true"] { color:${C.green}; border-bottom-color:${C.green}; }
    @keyframes hdrFade { from { opacity:0; transform:translateY(11px); } to { opacity:1; transform:none; } }
    @media (max-width: 880px){ .pb-grid{ grid-template-columns:1fr !important; } }
  `}</style>
);

/* ============================================================
   FUND PERFORMANCE PAGE
   ============================================================ */
function FundPage({ funds }) {
  const [sel, setSel] = useState(funds[0].id);
  const f = funds.find((x) => x.id === sel);

  const chartData = ["y1", "y3", "y5", "y10", "incep"]
    .filter((k) => typeof f.ret[k] === "number")
    .map((k) => ({
      period: ALLP.find((p) => p.key === k).label,
      Fund: f.ret[k], Benchmark: typeof f.bm[k] === "number" ? f.bm[k] : null,
    }));

  const AllocCol = ({ title, rows }) => (
    <div style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {rows ? rows.map(([n, v], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}>
          <span style={{ color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>{n}</span>
          {v !== null && <b>{v}%</b>}
        </div>
      )) : <div style={{ fontSize: 12.5, color: C.inkSoft }}>n/a for this fund</div>}
    </div>
  );

  return (
    <div>
      <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}55`, color: "#6b5010", borderRadius: 10, padding: "9px 14px", fontSize: 13, margin: "6px 0 18px" }}>
        Each fund’s own figures, shown against its benchmark. Source: AIA / Morningstar factsheets, 31 May 2026, SGD, bid-to-bid.
      </div>

      {/* fund selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {funds.map((x) => (
          <button key={x.id} className="pb-chip" data-on={x.id === sel} onClick={() => setSel(x.id)}>
            {x.name.replace(/^AIA /, "")}
          </button>
        ))}
      </div>

      {/* detail */}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 24, margin: 0 }}>{f.name}</h2>
            <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 4 }}>{f.note}</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: f.sleeve === "core" ? C.greenDeep : "#7a5a12", background: f.sleeve === "core" ? C.greenTint : C.satTint, borderRadius: 999, padding: "5px 12px" }}>
            {f.sleeve === "core" ? "Core" : "Satellite"} · {f.risk}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 22px", marginTop: 12, fontSize: 12.5, color: C.inkSoft }}>
          <span>Launched <b style={{ color: C.ink }}>{f.launch}</b></span>
          <span>Bid <b style={{ color: C.ink }}>SGD {f.price}</b></span>
          <span>Fee <b style={{ color: C.ink }}>{f.fee}</b></span>
          <span>Buy with <b style={{ color: C.ink }}>{f.sub}</b></span>
          <span>Underlying <b style={{ color: C.ink }}>{f.underlying}</b></span>
        </div>

        {/* performance table */}
        <div style={{ overflowX: "auto", marginTop: 18 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 620, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: `2px solid ${C.line}`, color: C.inkSoft, fontWeight: 600 }}>Period</th>
                {ALLP.map((p) => (
                  <th key={p.key} style={{ textAlign: "right", padding: "8px 8px", borderBottom: `2px solid ${C.line}`, color: C.inkSoft, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {p.label}{p.ann ? " ^" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "8px 10px", fontWeight: 600 }}>Fund</td>
                {ALLP.map((p) => (
                  <td key={p.key} style={{ textAlign: "right", padding: "8px 8px", fontWeight: 600, color: clr(f.ret[p.key]) }}>{fmtPct(f.ret[p.key])}</td>
                ))}
              </tr>
              <tr style={{ background: "#FBFAF6" }}>
                <td style={{ padding: "8px 10px", color: C.inkSoft }}>Benchmark</td>
                {ALLP.map((p) => (
                  <td key={p.key} style={{ textAlign: "right", padding: "8px 8px", color: C.inkSoft }}>{fmtPct(f.bm[p.key])}</td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: "8px 10px", fontSize: 12, color: C.inkSoft }}>vs benchmark</td>
                {ALLP.map((p) => {
                  const d = (typeof f.ret[p.key] === "number" && typeof f.bm[p.key] === "number") ? f.ret[p.key] - f.bm[p.key] : null;
                  return <td key={p.key} style={{ textAlign: "right", padding: "8px 8px", fontSize: 12, color: clr(d) }}>{d === null ? "—" : `${d >= 0 ? "+" : ""}${d.toFixed(2)}`}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 4 }}>^ annualised (per year). Others are cumulative for the period.</div>

        {/* chart */}
        <div style={{ width: "100%", height: 260, marginTop: 16 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ left: 4, right: 8, top: 12, bottom: 4 }}>
              <XAxis dataKey="period" tick={{ fontSize: 11.5, fill: C.ink }} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: C.inkSoft }} />
              <Tooltip formatter={(v) => (v === null ? "—" : `${(+v).toFixed(2)}%`)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke={C.line} />
              <Bar dataKey="Fund" fill={C.green} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Benchmark" fill={C.bm} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* allocations */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 12, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          <AllocCol title="Top holdings" rows={f.holdings} />
          <AllocCol title="Top sectors" rows={f.sectors} />
          <AllocCol title={f.name.includes("Elite") ? "Regions" : "Top countries"} rows={f.countries} />
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 14, lineHeight: 1.55 }}>
        Figures are SGD, bid-to-bid, dividends reinvested, before policy fees and charges. Benchmarks per each fund’s factsheet.
        <b> Past performance is not necessarily indicative of future performance.</b>
      </div>
    </div>
  );
}

/* ---- stable sleeve card (module-level so inputs keep focus) ---- */
function SleeveCard({ sleeve, title, subtitle, share, list, tot, off, period, pMeta,
  expanded, setExpanded, colorOf, effWeight, totalEff, onW, onToggle, onSleeve, onEqual }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: sleeve === "core" ? C.greenTint : C.satTint }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: sleeve === "core" ? C.greenDeep : "#7a5a12" }}>{title} · {share}%</div>
          <div style={{ fontSize: 11.5, color: C.inkSoft }}>{subtitle}</div>
        </div>
        <button className="pb-btn ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => onEqual(sleeve)}>Equal</button>
      </div>
      <div>
        {list.map((f) => {
          const on = f.include, hasData = typeof f.ret[period] === "number", open = expanded === f.id;
          return (
            <div key={f.id} style={{ borderTop: `1px solid ${C.line}` }}>
              <div className="pb-row" style={{ display: "grid", gridTemplateColumns: "20px 1fr 78px 18px", gap: 8, alignItems: "center", padding: "9px 12px", opacity: on ? 1 : 0.55 }}>
                <input type="checkbox" checked={on} onChange={() => onToggle(f.id)} style={{ width: 15, height: 15, accentColor: C.green, cursor: "pointer" }} />
                <div style={{ minWidth: 0, cursor: "pointer" }} onClick={() => setExpanded(open ? null : f.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: on ? colorOf(f) : C.line, flex: "none" }} />
                    <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name.replace(/^AIA /, "")}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginLeft: 16 }}>
                    {on && hasData ? `→ ${(effWeight(f) / totalEff * 100).toFixed(1)}% of portfolio` : (on && !hasData ? `no ${pMeta.label} data — excluded` : "off")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, opacity: on ? 1 : 0.4 }}>
                  <input className="pb-input" style={{ padding: "5px 6px", textAlign: "right" }} type="number" min="0" disabled={!on} value={on ? (f.w ?? "") : ""} onChange={(e) => onW(f.id, e.target.value)} />
                  <span style={{ color: C.inkSoft, fontSize: 12 }}>%</span>
                </div>
                <button onClick={() => setExpanded(open ? null : f.id)} style={{ border: "none", background: "none", cursor: "pointer", color: C.inkSoft, fontSize: 13, transform: open ? "rotate(90deg)" : "none", transition: ".15s" }}>▸</button>
              </div>
              {open && (
                <div style={{ padding: "2px 14px 14px 40px", fontSize: 12.5, color: C.ink, background: "#FBFAF6" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {["core", "satellite"].map((s) => (
                      <button key={s} onClick={() => onSleeve(f.id, s)} style={{ font: "inherit", cursor: "pointer", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, fontWeight: 600, border: `1px solid ${f.sleeve === s ? C.green : C.line}`, background: f.sleeve === s ? C.green : "#fff", color: f.sleeve === s ? "#fff" : C.inkSoft }}>
                        {s === "core" ? "Core" : "Satellite"}
                      </button>
                    ))}
                    <span style={{ marginLeft: "auto", color: C.inkSoft, fontSize: 11.5, alignSelf: "center" }}>as of {f.asOf}</span>
                  </div>
                  <div style={{ lineHeight: 1.7 }}>
                    <b>{f.note}</b><br />
                    Risk: {f.risk} &nbsp;·&nbsp; Mgmt fee: {f.fee} &nbsp;·&nbsp; Launched: {f.launch}<br />
                    Bid: SGD {f.price} &nbsp;·&nbsp; Buy with: {f.sub}<br />Underlying: {f.underlying}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {off && <div style={{ padding: "6px 14px", fontSize: 11.5, color: C.red, borderTop: `1px solid ${C.line}` }}>Weights total {tot.toFixed(0)}% — normalised within the sleeve.</div>}
      </div>
    </div>
  );
}

/* ============================================================
   BLEND BUILDER PAGE
   ============================================================ */
function BlendPage({ funds, setFunds, coreShare, setCoreShare }) {
  const [period, setPeriod] = useState("y1");
  const [amount, setAmount] = useState(50000);
  const [expanded, setExpanded] = useState(null);
  const satShare = 100 - coreShare;
  const pMeta = PERIODS.find((p) => p.key === period);

  const bySleeve = (s) => funds.filter((f) => f.sleeve === s);
  const incIn = (s) => bySleeve(s).filter((f) => f.include);
  const sumW = (s) => incIn(s).reduce((a, f) => a + toN(f.w, 0), 0);
  const effWeight = (f) => {
    if (!f.include) return 0;
    const denom = sumW(f.sleeve);
    if (!denom) return 0;
    return ((f.sleeve === "core" ? coreShare : satShare) / 100) * (toN(f.w, 0) / denom);
  };
  const setW = (id, val) => setFunds(funds.map((f) => (f.id === id ? { ...f, w: val === "" ? "" : Math.max(0, +val) } : f)));
  const toggleInc = (id) => setFunds(funds.map((f) => (f.id === id ? { ...f, include: !f.include } : f)));
  const setSleeve = (id, sleeve) => setFunds(funds.map((f) => (f.id === id ? { ...f, sleeve } : f)));
  const equalize = (s) => setFunds(funds.map((f) => {
    if (f.sleeve !== s) return f;
    const n = incIn(s).length || 1;
    return { ...f, w: f.include ? +(100 / n).toFixed(2) : 0 };
  }));

  const included = funds.filter((f) => f.include);
  const withData = included.filter((f) => typeof f.ret[period] === "number");
  const excluded = included.filter((f) => typeof f.ret[period] !== "number");
  const effSum = withData.reduce((a, f) => a + effWeight(f), 0);
  const blended = useMemo(() => {
    if (!withData.length || effSum === 0) return null;
    return withData.reduce((a, f) => a + f.ret[period] * (effWeight(f) / effSum), 0);
  }, [funds, coreShare, period]);
  const endValue = useMemo(() => {
    if (blended === null || !pMeta.growth) return null;
    const r = blended / 100;
    return pMeta.ann ? amount * Math.pow(1 + r, pMeta.gy) : amount * (1 + r);
  }, [blended, amount, period]);

  const colorOf = (f) => {
    const arr = f.sleeve === "core" ? CORE_COL : SAT_COL;
    const idx = bySleeve(f.sleeve).filter((x) => x.include).findIndex((x) => x.id === f.id);
    return arr[(idx < 0 ? 0 : idx) % arr.length];
  };
  const totalEff = included.reduce((a, f) => a + effWeight(f), 0) || 1;
  const pieData = withData.map((f) => ({ name: f.name.replace(/^AIA /, ""), value: +(effWeight(f) / effSum * 100).toFixed(1), fill: colorOf(f) }));
  const barData = withData.map((f) => ({ name: f.name.replace(/^AIA /, "").replace(/ Fund$/, ""), ret: f.ret[period], fill: colorOf(f) }));

  const sleeveProps = (sleeve, share) => ({
    sleeve, share, list: bySleeve(sleeve), tot: sumW(sleeve),
    off: incIn(sleeve).length > 0 && Math.abs(sumW(sleeve) - 100) > 0.5,
    period, pMeta, expanded, setExpanded, colorOf, effWeight, totalEff,
    onW: setW, onToggle: toggleInc, onSleeve: setSleeve, onEqual: equalize,
  });

  return (
    <div>
      <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}55`, color: "#6b5010", borderRadius: 10, padding: "9px 14px", fontSize: 13, margin: "6px 0 22px" }}>
        All funds as of 31 May 2026, SGD, bid-to-bid. Build a steady core, add conviction with satellites.
      </div>
      <div className="pb-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr)", gap: 22, alignItems: "start" }}>
        <section style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft }}>Core / Satellite split</span>
              <span style={{ fontSize: 13 }}><b style={{ color: C.green }}>{coreShare}% core</b> · <b style={{ color: C.gold }}>{satShare}% satellite</b></span>
            </div>
            <input type="range" min="0" max="100" step="5" value={coreShare} onChange={(e) => setCoreShare(+e.target.value)} style={{ width: "100%", background: `linear-gradient(90deg, ${C.green} ${coreShare}%, ${C.gold} ${coreShare}%)` }} />
            {satShare > 40 && <div style={{ fontSize: 12, color: C.red, marginTop: 6 }}>Satellite above 40% — a high-conviction tilt. Check it fits the client’s risk profile.</div>}
          </div>
          <SleeveCard {...sleeveProps("core", coreShare)} title="Core" subtitle="Diversified, steadier foundation" />
          <SleeveCard {...sleeveProps("satellite", satShare)} title="Satellite" subtitle="Focused, higher-conviction tilts" />
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 8 }}>Time period</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PERIODS.map((p) => <button key={p.key} className="pb-chip" data-on={period === p.key} onClick={() => setPeriod(p.key)}>{p.label}</button>)}
            </div>
            {pMeta.ann && <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 8 }}>Multi-year figures are annualised (per year).</div>}
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          <div style={{ background: C.greenDeep, borderRadius: 14, padding: "22px 24px", color: "#fff" }}>
            <div style={{ fontSize: 12.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.goldSoft, fontWeight: 600 }}>Blended return · {pMeta.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
              <span style={{ fontFamily: "'Newsreader',serif", fontSize: "clamp(44px,8vw,64px)", fontWeight: 500, lineHeight: 1, color: blended === null ? "#cbd5cf" : (blended >= 0 ? "#fff" : "#F3B4A6") }}>
                {blended === null ? "—" : `${blended >= 0 ? "+" : ""}${blended.toFixed(2)}%`}
              </span>
              {pMeta.ann && blended !== null && <span style={{ color: C.goldSoft, fontSize: 15 }}>per year</span>}
            </div>
            <div style={{ fontSize: 13, color: "#B9CBC2", marginTop: 8 }}>
              {blended === null ? "Add a fund with data for this period." : `${coreShare}% core / ${satShare}% satellite across ${withData.length} funds. Backward-looking, not a forecast.`}
            </div>
            {excluded.length > 0 && <div style={{ fontSize: 12.5, color: "#F3D9A0", marginTop: 6 }}>No {pMeta.label} data: {excluded.map((f) => f.name.replace(/^AIA /, "")).join(", ")} — weights renormalised.</div>}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 18, margin: 0 }}>What that looks like</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.inkSoft, fontSize: 13 }}>Starting</span>
                <input className="pb-input" style={{ width: 120, textAlign: "right", padding: "7px 9px" }} type="number" min="0" step="1000" value={amount} onChange={(e) => setAmount(Math.max(0, +e.target.value || 0))} />
              </div>
            </div>
            {pMeta.growth && endValue !== null ? (
              <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ color: C.inkSoft, fontSize: 14 }}>{fmtMoney(amount)} over {pMeta.label.toLowerCase()} would have become</span>
                <span style={{ fontFamily: "'Newsreader',serif", fontSize: 30, fontWeight: 500, color: endValue >= amount ? C.green : C.red }}>{fmtMoney(endValue)}</span>
                <span style={{ fontSize: 13, color: C.inkSoft }}>({endValue >= amount ? "+" : ""}{fmtMoney(endValue - amount)})</span>
              </div>
            ) : <div style={{ marginTop: 12, color: C.inkSoft, fontSize: 14 }}>Pick a fixed period (6M–10Y) to see an illustrative value. Since-inception spans differ by fund.</div>}
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 10 }}>Illustration only — historical, before policy fees and charges. Not a projection.</div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 18, margin: "0 0 6px" }}>Allocation</h3>
            {pieData.length ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ width: 180, height: 180 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none">
                        {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 170 }}>
                  {pieData.map((d, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 13 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: d.fill, flex: "none" }} />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</span>
                      </span>
                      <span style={{ fontWeight: 600, marginLeft: 8 }}>{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div style={{ color: C.inkSoft, fontSize: 14 }}>No funds selected.</div>}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 18, margin: "0 0 4px" }}>Each fund vs the blend · {pMeta.label}</h3>
            {barData.length ? (
              <div style={{ width: "100%", height: 44 + barData.length * 38 }}>
                <ResponsiveContainer>
                  <BarChart layout="vertical" data={barData} margin={{ left: 8, right: 44, top: 8, bottom: 4 }}>
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: C.inkSoft }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11.5, fill: C.ink }} />
                    <Tooltip formatter={(v) => [`${(+v).toFixed(2)}%`, "Return"]} />
                    {blended !== null && <ReferenceLine x={blended} stroke={C.gold} strokeWidth={2} strokeDasharray="4 3" />}
                    <Bar dataKey="ret" radius={[0, 4, 4, 0]}>
                      {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      <LabelList dataKey="ret" position="right" formatter={(v) => `${(+v).toFixed(1)}%`} style={{ fontSize: 11, fill: C.ink }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div style={{ color: C.inkSoft, fontSize: 14 }}>No fund data for this period.</div>}
            {blended !== null && <div style={{ fontSize: 12, color: C.inkSoft }}><span style={{ color: C.gold, fontWeight: 700 }}>– –</span> gold line marks the blended {blended.toFixed(2)}%.</div>}
          </div>
        </section>
      </div>

      <footer style={{ marginTop: 26, paddingTop: 16, borderTop: `1px solid ${C.line}`, fontSize: 11.5, color: C.inkSoft, lineHeight: 1.55 }}>
        <b>Important.</b> For illustration and discussion only; not financial advice or an offer. The blended return is a weighted average of each
        fund’s stated period return and assumes rebalancing to the shown weights — actual returns differ. Figures are SGD, bid-to-bid, dividends
        reinvested, before policy fees and charges. Verify against current AIA published data and the relevant Product Summary. ILP sub-funds carry
        risk including possible loss of principal; unit values may rise or fall. <b>Past performance is not necessarily indicative of future performance.</b>
      </footer>
    </div>
  );
}

/* ============================================================
   MONTHLY PLAN PAGE  (regular investing / dollar-cost)
   ============================================================ */
function MonthlyPage({ funds, coreShare, monthly, setMonthly, annual, setAnnual, years, setYears, product, setProduct, reinvest, setReinvest, pwvCapital, setPwvCapital, topup, setTopup, ratePeriod, setRatePeriod, manual, setManual }) {
  const cfg = PRODUCTS[product];
  const isPWV = product === "pwv2";
  const apa = assumedRate(funds, coreShare, ratePeriod, manual);
  const rate = isPWV ? toN(pwvCapital, 0) : apa.rate;
  const liveRounded = apa.live, liveSrc = apa.src;

  // premium input differs by product: PWV = annual (S$18k–100k, step 1k); APA = monthly (S$0–5k, step 100)
  const premium = isPWV ? annual : monthly;
  const setPremium = isPWV ? setAnnual : setMonthly;
  const freq = isPWV ? "annual" : "monthly";
  const SL = isPWV
    ? { min: 18000, max: 100000, step: 1000, majorMod: 20000, unit: "/ year", label: "Invest each year", note: "Each step = S$1,000 · min S$18,000/yr." }
    : { min: 0, max: 5000, step: 100, majorMod: 1000, unit: "/ month", label: "Invest each month", note: "Each mark = S$100." };
  const minYears = isPWV ? cfg.lockYears : 1;
  const yrs = Math.max(minYears, years);
  const maxTopup = isPWV ? annual * (cfg.premiumYears || 5) : 0;   // up to the full 5-year premium
  const topupUse = isPWV ? Math.min(topup, maxTopup) : 0;

  const proj = projectProduct(premium, freq, yrs, rate, product, { reinvest, topup: topupUse });
  const fv = proj.fv, contributed = proj.contributed, wbonus = proj.wbonus, ibonus = proj.ibonus, bonus = proj.bonus;
  const growth = fv - contributed;
  const growthPct = fv > 0 ? (growth / fv) * 100 : 0;
  const series = proj.pts;
  const annualPrem = isPWV ? annual : monthly * 12;
  const qIncomeNow = fv * GAIF.yield / 4;

  const ticks = [];
  for (let v = SL.min; v <= SL.max; v += SL.step) ticks.push(v);
  const kfmt = (v) => (v >= 1000 ? "S$" + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "k" : "S$" + v);
  const yfmt = (v) => (v >= 1000 ? "$" + (v / 1000).toFixed(0) + "k" : "$" + v);
  const pct = (v) => (v - SL.min) / (SL.max - SL.min) * 100;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 22, margin: 0 }}>Putting the plan to work</h2>
        <p style={{ margin: "4px 0 0", color: C.inkSoft, fontSize: 14 }}>Where the strategy becomes real money — watch regular investing compound over time.</p>
      </div>
      <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}55`, color: "#6b5010", borderRadius: 10, padding: "9px 14px", fontSize: 13, margin: "0 0 22px" }}>
        {isPWV
          ? <>Shown inside <b>AIA Platinum Wealth Venture 2.0</b> (5-year premium term). Most clients use it to access the <b>Global Adventurous Income Fund</b> and its quarterly income. Illustration, not a forecast.</>
          : <>Shown inside <b>AIA Pro Achiever 3.0</b> net of its charges, using the blend on the Blueprint tab. Illustration at one assumed return — not a forecast.</>}
      </div>

      <div className="pb-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: 22, alignItems: "start" }}>
        {/* controls */}
        <section style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          {/* product */}
          <div style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 8 }}>Product</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.values(PRODUCTS).map((p) => (
              <button key={p.key} onClick={() => { setProduct(p.key); if (p.key === "pwv2" && years < p.lockYears) setYears(p.lockYears); }}
                style={{ font: "inherit", cursor: "pointer", textAlign: "left", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 600,
                  border: `1px solid ${product === p.key ? C.green : C.line}`, background: product === p.key ? C.green : "#fff", color: product === p.key ? "#fff" : C.ink }}>
                {p.name}
                <span style={{ display: "block", fontSize: 11, fontWeight: 500, color: product === p.key ? "#CFE0D8" : C.inkSoft }}>{p.tag}</span>
              </button>
            ))}
          </div>

          {/* premium */}
          <div style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, marginTop: 20 }}>{SL.label}</div>
          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 40, fontWeight: 500, color: C.green, lineHeight: 1.1, margin: "2px 0 4px" }}>
            {fmtMoney(premium)}<span style={{ fontSize: 18, color: C.inkSoft }}> {SL.unit}</span>
          </div>
          <input type="range" min={SL.min} max={SL.max} step={SL.step} value={premium} onChange={(e) => setPremium(+e.target.value)}
            style={{ width: "100%", background: `linear-gradient(90deg, ${C.green} ${pct(premium)}%, ${C.line} ${pct(premium)}%)` }} />
          <div style={{ position: "relative", height: 32, margin: "4px 11px 0" }}>
            {ticks.map((v) => {
              const major = v % SL.majorMod === 0;
              return (
                <div key={v} style={{ position: "absolute", left: `${pct(v)}%`, transform: "translateX(-50%)", top: 0, textAlign: "center" }}>
                  <div style={{ width: major ? 2 : 1, height: major ? 9 : 5, background: major ? C.green : C.line, margin: "0 auto" }} />
                  {major && <div style={{ fontSize: 9.5, color: C.inkSoft, marginTop: 2, whiteSpace: "nowrap" }}>{kfmt(v)}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>{SL.note}</div>

          {/* horizon */}
          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft }}>Stay invested for</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{yrs} year{yrs > 1 ? "s" : ""}</span>
          </div>
          <input type="range" min={minYears} max="30" step="1" value={yrs} onChange={(e) => setYears(+e.target.value)}
            style={{ width: "100%", marginTop: 8, background: `linear-gradient(90deg, ${C.green} ${(yrs - minYears) / (30 - minYears) * 100}%, ${C.line} ${(yrs - minYears) / (30 - minYears) * 100}%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.inkSoft, marginTop: 4 }}><span>{minYears} yr{minYears > 1 ? "s" : ""}</span><span>30 yrs</span></div>
          {isPWV && <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 6 }}>Premiums for the first <b>5 years</b>; {cfg.lockYears}-year lock-in, then stays invested for the full period.</div>}

          {/* dividend option (PWV / income fund only) */}
          {isPWV && (
            <div style={{ marginTop: 22 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft }}>Quarterly dividends</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {[[true, "Reinvest", "Compound them back into the fund for faster growth"], [false, "Withdraw as cash", "Take the income each quarter; value grows on capital only"]].map(([v, t, sub]) => (
                  <button key={t} onClick={() => setReinvest(v)}
                    style={{ font: "inherit", cursor: "pointer", textAlign: "left", borderRadius: 8, padding: "8px 11px", fontSize: 12.5, fontWeight: 600,
                      border: `1px solid ${reinvest === v ? C.green : C.line}`, background: reinvest === v ? C.green : "#fff", color: reinvest === v ? "#fff" : C.ink }}>
                    {t}<span style={{ display: "block", fontSize: 10.5, fontWeight: 500, color: reinvest === v ? "#CFE0D8" : C.inkSoft }}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ad-hoc top-up (PWV only) */}
          {isPWV && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft }}>Ad-hoc top-up (one-time)</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: topupUse > 0 ? C.gold : C.inkSoft }}>{fmtMoney(topupUse)}</span>
              </div>
              <input type="range" min="0" max={maxTopup} step="1000" value={topupUse} onChange={(e) => setTopup(+e.target.value)}
                style={{ width: "100%", marginTop: 8, background: `linear-gradient(90deg, ${C.gold} ${maxTopup ? topupUse / maxTopup * 100 : 0}%, ${C.line} ${maxTopup ? topupUse / maxTopup * 100 : 0}%)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.inkSoft, marginTop: 4 }}><span>S$0</span><span>up to full premium ({fmtMoney(maxTopup)})</span></div>
              {topupUse > 0 && (
                <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 8, background: C.satTint, borderRadius: 8, padding: "9px 12px", lineHeight: 1.6 }}>
                  {(cfg.topupCharge * 100).toFixed(1)}% top-up charge → <b>{fmtMoney(proj.topupNet)}</b> invested on day 1.<br />
                  <b style={{ color: C.green }}>Earns the ~{(GAIF.yield * 100).toFixed(1)}% distribution immediately</b> — the whole sum works from day one, rather than trickling in over 5 years.
                </div>
              )}
            </div>
          )}

          {/* assumed return */}
          {isPWV ? (
            <div style={{ marginTop: 22 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft }}>Assumed capital growth (per year)</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input className="pb-input" style={{ width: 100, padding: "8px 10px", textAlign: "right", fontSize: 16, fontWeight: 600 }}
                  type="number" step="0.5" value={pwvCapital} onChange={(e) => setPwvCapital(e.target.value)} />
                <span style={{ color: C.inkSoft }}>% p.a.</span>
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 8 }}>
                This is the fund’s <b>price growth</b>. {GAIF.name} distributes <b>~{(GAIF.yield * 100).toFixed(1)}% p.a.</b> on top, so total ≈ <b>{(toN(pwvCapital, 0) + GAIF.yield * 100).toFixed(1)}%</b> — {reinvest ? "reinvested into the value" : "paid to you as cash income"}.
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft }}>Assumed return (per year)</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: manual != null ? C.gold : C.green }}>
                  {manual != null ? "Custom" : `Linked · Blueprint ${liveSrc}`}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input className="pb-input" style={{ width: 100, padding: "8px 10px", textAlign: "right", fontSize: 16, fontWeight: 600 }}
                  type="number" step="0.5" value={manual === null ? liveRounded : manual} onChange={(e) => setManual(e.target.value)} />
                <span style={{ color: C.inkSoft }}>% p.a.</span>
                {manual != null && <button className="pb-btn ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setManual(null)}>Re-link</button>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                {RATE_PERIODS.map(([k, lbl]) => (
                  <button key={k} onClick={() => { setRatePeriod(k); setManual(null); }}
                    style={{ font: "inherit", cursor: "pointer", flex: 1, borderRadius: 7, padding: "6px 4px", fontSize: 11.5, fontWeight: 600,
                      border: `1px solid ${ratePeriod === k ? C.green : C.line}`, background: ratePeriod === k ? C.greenTint : "#fff", color: ratePeriod === k ? C.greenDeep : C.inkSoft }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 8 }}>
                Follows your Blueprint blend’s {liveSrc} return ({liveRounded}% p.a.). Dial it down for a cautious view.
              </div>
            </div>
          )}

          {/* product mechanics summary */}
          <div style={{ marginTop: 18, fontSize: 11.5, color: C.inkSoft, lineHeight: 1.7, background: C.satTint, borderRadius: 8, padding: "10px 12px" }}>
            {(isPWV ? annual < cfg.minAnnual : monthly < cfg.minMonthly) && <div style={{ color: C.red, fontWeight: 600, marginBottom: 4 }}>Below the {isPWV ? fmtMoney(cfg.minAnnual) + "/year" : fmtMoney(cfg.minMonthly) + "/month"} minimum premium for this plan.</div>}
            Premium band <b>{cfg.band(annualPrem)}</b> · {isPWV ? "5-year premium term" : "premiums throughout"}<br />
            Welcome bonus (yr 1/2/3): <b>{proj.wr.map((x) => Math.round(x * 100) + "%").join(" / ")}</b> → +{fmtMoney(wbonus)}<br />
            {isPWV && <>Investment bonus (yr 8–11): <b>2.5%/yr</b> of annual premium → +{fmtMoney(ibonus)}<br />Performance bonus: <b>0.4%/yr</b> of value from yr 8<br /></>}
            Supplementary charge: <b>{(cfg.chargeRate * 100).toFixed(1)}% p.a.</b>, first {cfg.chargeYears} years<br />
            {isPWV && <>Fund: <b>{GAIF.name}</b> — quarterly income<br /></>}
            100% of premium invested. Benefit &amp; surrender charges not modelled.
          </div>
        </section>

        {/* results */}
        <section style={{ display: "grid", gap: 18 }}>
          <div style={{ background: C.greenDeep, borderRadius: 14, padding: "22px 24px", color: "#fff" }}>
            <div style={{ fontSize: 12.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.goldSoft, fontWeight: 600 }}>
              Policy value after {yrs} year{yrs > 1 ? "s" : ""}
            </div>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: "clamp(40px,7vw,58px)", fontWeight: 500, lineHeight: 1.05, marginTop: 6 }}>
              {fmtMoney(fv)}
            </div>
            <div style={{ fontSize: 13, color: "#B9CBC2", marginTop: 8 }}>
              {bonus > 0 ? <>Includes <b style={{ color: "#fff" }}>{fmtMoney(bonus)}</b> in bonuses — </> : null}
              {!isPWV ? "built for the long haul, where compounding does the heavy lifting."
                : proj.withdraw ? <>plus <b style={{ color: "#fff" }}>{fmtMoney(proj.income)}</b> of income drawn as cash over {yrs} years.</>
                : "pay for 5 years, stay invested, and let the income compound."}
            </div>
            <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", marginTop: 16, background: "#0d2a20" }}>
              <div style={{ width: `${Math.max(0, 100 - growthPct)}%`, background: C.goldSoft }} />
              <div style={{ width: `${Math.max(0, growthPct)}%`, background: "#5BA981" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13 }}>
              <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: C.goldSoft, marginRight: 6 }} />You put in <b>{fmtMoney(contributed)}</b></span>
              <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: "#5BA981", marginRight: 6 }} />Growth <b>{fmtMoney(growth)}</b> ({growthPct.toFixed(0)}%)</span>
            </div>
          </div>

          {/* GAIF quarterly income (PWV only) */}
          {isPWV && (
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 18, margin: 0 }}>Quarterly income</h3>
                <span style={{ fontSize: 12, color: C.inkSoft }}>{GAIF.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                <span style={{ fontFamily: "'Newsreader',serif", fontSize: 30, fontWeight: 500, color: C.gold }}>{fmtMoney(qIncomeNow)}</span>
                <span style={{ fontSize: 13, color: C.inkSoft }}>per quarter{proj.withdraw ? <> · {fmtMoney(proj.income)} over {yrs} yrs</> : <> (≈ {fmtMoney(fv * GAIF.yield)}/yr)</>}</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 4 }}>
                {proj.withdraw
                  ? <>You’re drawing GAIF’s <b>~{(GAIF.yield * 100).toFixed(1)}% p.a.</b> distribution as cash each quarter — the policy value grows on capital only.</>
                  : <>At GAIF’s recent <b>~{(GAIF.yield * 100).toFixed(1)}% p.a.</b> distribution, if switched to cash. By default it’s reinvested and already in the value above.</>}
              </div>
              <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: ".06em", marginBottom: 6 }}>RECENT DISTRIBUTIONS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3px 8px", fontSize: 12 }}>
                  <span style={{ color: C.inkSoft }}>Quarter</span><span style={{ color: C.inkSoft, textAlign: "right" }}>S$/unit</span><span style={{ color: C.inkSoft, textAlign: "right" }}>Yield p.a.</span>
                  {GAIF.history.map(([q, d, y]) => (
                    <React.Fragment key={q}>
                      <span>{q}</span><span style={{ textAlign: "right" }}>{d.toFixed(4)}</span><span style={{ textAlign: "right", fontWeight: 600, color: C.green }}>{y.toFixed(2)}%</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 10 }}>Dividends are not guaranteed and may be paid out of capital, which can reduce the investment.</div>
            </div>
          )}

          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 18, margin: "0 0 6px" }}>How it builds up</h3>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <ComposedChart data={series} margin={{ left: 6, right: 10, top: 8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.green} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: C.inkSoft }} interval={yrs > 12 ? 1 : 0} />
                  <YAxis tickFormatter={yfmt} tick={{ fontSize: 11, fill: C.inkSoft }} width={44} />
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Value" name="Policy value" stroke={C.green} strokeWidth={2.5} fill="url(#valGrad)" />
                  <Line type="monotone" dataKey="Contributions" name="You put in" stroke={C.gold} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                  {proj.withdraw && <Line type="monotone" dataKey="Income" name="Income drawn" stroke={C.bm} strokeWidth={2} dot={false} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft }}>
              {isPWV
                ? (proj.withdraw
                    ? "You pay for 5 years; dividends come out as cash each quarter (grey), while the policy value grows on capital."
                    : "You pay for 5 years (the dashed line flattens), then the plan stays invested — with bonuses in years 8–11 and beyond.")
                : "Charges apply for the first 10 years; beyond that, more of your money stays invested and keeps compounding."}
            </div>
          </div>
        </section>
      </div>

      <footer style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${C.line}`, fontSize: 11.5, color: C.inkSoft, lineHeight: 1.55 }}>
        <b>Important.</b> Illustration only, not a projection or guarantee. It applies one steady assumed return, compounded monthly, to level month-end premiums.
        {isPWV
          ? " The AIA Platinum Wealth Venture 2.0 view assumes a 5-year premium term, 100% allocation, the 3.6% p.a. supplementary charge for the first 7 years, the welcome bonus for the chosen premium band, the investment bonus in years 8–11 and the performance bonus from year 8. The Global Adventurous Income Fund's distribution yield is from recent history; dividends are non-guaranteed and may be paid out of capital, which can reduce the investment and future returns."
          : " The AIA Pro Achiever 3.0 view assumes premiums paid throughout, 100% allocation, the 3.9% p.a. supplementary charge for the first 10 years and the welcome bonus for the chosen premium band."}
        {" "}It excludes the benefit (insurance) charge, any rider premiums, top-up charges and the surrender/withdrawal charges that apply on early exit — so a real surrender value in the early years would be lower. The fund's own management charge is already reflected in the underlying returns. Real returns vary year to year and could be negative; actual outcomes depend on the market's path and will differ, possibly materially. Always refer to the official policy illustration and Product Summary. <b>Past performance is not necessarily indicative of future performance.</b> Not financial advice.
      </footer>
    </div>
  );
}

/* ---- goal-page building blocks (module-level so inputs keep focus) ---- */
const GoalField = ({ label, children }) => (
  <div style={{ marginTop: 16 }}>
    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

// 3D coverflow: the selected goal sits centre/forward with a locked badge; hovering others
// lifts and brightens them as a preview (clicking commits — hover doesn't recentre, which avoids
// the oscillation you get when a hovered card slides out from under the cursor).
function GoalCarousel({ goals, activeKey, onSelect }) {
  const [hoverKey, setHoverKey] = useState(null);
  const ai = Math.max(0, goals.findIndex((g) => g.key === activeKey));
  return (
    <div style={{ perspective: "1200px", height: 176, position: "relative", overflow: "hidden" }} onMouseLeave={() => setHoverKey(null)}>
      {goals.map((g, i) => {
        const off = i - ai;
        const active = g.key === activeKey;
        const hovered = g.key === hoverKey && !active;
        const lift = hovered ? 26 : 0;
        return (
          <div key={g.key} onMouseEnter={() => setHoverKey(g.key)} onClick={() => onSelect(g.key)}
            style={{
              position: "absolute", top: 16, left: "50%", width: 224, height: 138, marginLeft: -112,
              transform: `translateX(${off * 140}px) rotateY(${off * -32}deg) translateZ(${active ? 60 : -150 + lift}px) scale(${active ? 1 : 0.8})`,
              transformOrigin: "center",
              transition: "transform .7s cubic-bezier(.22,.68,.28,1), opacity .55s ease, box-shadow .35s ease, border-color .3s",
              opacity: active ? 1 : hovered ? 0.72 : 0.34,
              zIndex: active ? 30 : 20 - Math.abs(off) + (hovered ? 6 : 0), cursor: "pointer",
              background: "#fff", borderRadius: 16,
              border: `${active ? 2 : 1}px solid ${active ? C.gold : hovered ? C.green : C.line}`,
              boxShadow: active ? "0 18px 42px rgba(20,63,47,.22)" : hovered ? "0 10px 24px rgba(20,63,47,.14)" : "none",
              padding: "18px", display: "flex", flexDirection: "column", justifyContent: "center",
            }}>
            {active && (
              <div style={{ position: "absolute", top: 11, right: 13, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", color: C.gold, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 12, lineHeight: 1 }}>✓</span> Selected
              </div>
            )}
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 19, fontWeight: 500, color: C.ink, lineHeight: 1.15 }}>{g.label}</div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 7 }}>{g.tag}</div>
            {hovered && <div style={{ fontSize: 10.5, fontWeight: 600, color: C.green, marginTop: 8 }}>Click to choose →</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   GOALS PAGE — the front door (outcome-first)
   ============================================================ */
function GoalsPage({ applyPlan, goBlueprint }) {
  const [goalKey, setGoalKey] = useState("nest");
  const [mechanic, setMechanic] = useState("target");   // target = solve premium · budget = what can I afford
  const [age, setAge] = useState(30);
  const [childAge, setChildAge] = useState(0);
  const [target, setTarget] = useState(1000000);
  const [income, setIncome] = useState(3000);
  const [budgetM, setBudgetM] = useState(1000);
  const [budgetA, setBudgetA] = useState(18000);
  const [cpfTier, setCpfTier] = useState("frs");
  const [showReal, setShowReal] = useState(true);

  const goal = GOALS.find((g) => g.key === goalKey);
  const isIncome = goal.kind === "income";
  const ageN = toN(age, 30), childAgeN = toN(childAge, 0);
  const targetN = toN(target, 0), incomeN = toN(income, 0);
  const budgetMN = toN(budgetM, 0), budgetAN = toN(budgetA, 0);
  const horizon = goal.childTo ? Math.max(1, goal.childTo - childAgeN) : goal.to ? Math.max(1, goal.to - ageN) : goal.defYears;

  // selecting a goal: only reset its defaults when the goal actually changes
  const onGoal = (k) => {
    if (k === goalKey) return;
    const g = GOALS.find((x) => x.key === k);
    setGoalKey(k);
    if (g.defTarget) setTarget(g.defTarget);
    if (g.defIncome) setIncome(g.defIncome);
  };

  const money = fmtMoney;
  const capRate = (r) => r - GAIF.yield * 100;   // convert an income total-return to the capital-growth input
  const cpf = CPF.tiers.find((t) => t.key === cpfTier);

  let plan = {};
  if (!isIncome) {
    const R = PLAN.growth;
    const reqPrem = solvePremium(targetN, "monthly", horizon, R.mid, "apa3");
    const atPrem = (r) => projectProduct(reqPrem, "monthly", horizon, r, "apa3").fv;
    const projMid = projectProduct(budgetMN, "monthly", horizon, R.mid, "apa3").fv;
    const projLow = projectProduct(budgetMN, "monthly", horizon, R.low, "apa3").fv;
    const projHigh = projectProduct(budgetMN, "monthly", horizon, R.high, "apa3").fv;
    plan = { reqPrem, bandLow: atPrem(R.low), bandHigh: atPrem(R.high), projMid, projLow, projHigh };
  } else {
    const R = PLAN.income;
    const gap = Math.max(0, incomeN - cpf.payout);
    const reqCapital = gap * 12 / GAIF.yield;
    const reqPrem = solvePremium(reqCapital, "annual", horizon, capRate(R.mid), "pwv2", { reinvest: true });
    const capFor = (r) => projectProduct(budgetAN, "annual", horizon, capRate(r), "pwv2", { reinvest: true }).fv;
    const capMid = capFor(R.mid);
    const invIncome = capMid * GAIF.yield / 12;
    plan = { gap, reqCapital, reqPrem, capMid, invIncome, total: cpf.payout + invIncome };
  }

  const build = () => {
    if (!isIncome) {
      applyPlan(mechanic === "target"
        ? { product: "apa3", freq: "monthly", premium: Math.max(100, Math.round(plan.reqPrem / 50) * 50), years: horizon, reinvest: true }
        : { product: "apa3", freq: "monthly", premium: budgetMN, years: horizon, reinvest: true });
    } else {
      applyPlan(mechanic === "target"
        ? { product: "pwv2", freq: "annual", premium: Math.max(18000, Math.round(plan.reqPrem / 1000) * 1000), years: Math.max(7, horizon), reinvest: true }
        : { product: "pwv2", freq: "annual", premium: budgetAN, years: Math.max(7, horizon), reinvest: true });
    }
  };

  const Field = GoalField;
  const num = { className: "pb-input", type: "number", style: { padding: "9px 11px", fontSize: 15 } };

  return (
    <div>
      <div style={{ background: C.greenTint, border: `1px solid ${C.green}33`, color: C.greenDeep, borderRadius: 10, padding: "10px 14px", fontSize: 13.5, margin: "0 0 18px" }}>
        Start with the life you’re planning for — not the funds. We’ll show what it takes, then how it’s built.
      </div>

      <GoalCarousel goals={GOALS} activeKey={goalKey} onSelect={onGoal} />
      <div style={{ textAlign: "center", fontSize: 11.5, color: C.inkSoft, margin: "2px 0 20px" }}>Hover to preview · click to lock in your goal.</div>

      <div className="pb-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)", gap: 22, alignItems: "start" }}>
        {/* inputs */}
        <section style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 18 }}>{goal.label}</div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2, fontStyle: "italic" }}>{goal.tag}</div>

          {/* mechanic */}
          <Field label="How would you like to plan?">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["target", "I have a target", isIncome ? "Work out the premium to hit the income" : "Work out the monthly amount to reach it"],
                ["budget", "I have a budget", "See how far a comfortable amount gets me"]].map(([v, t, sub]) => (
                <button key={v} onClick={() => setMechanic(v)}
                  style={{ font: "inherit", cursor: "pointer", textAlign: "left", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 600,
                    border: `1px solid ${mechanic === v ? C.green : C.line}`, background: mechanic === v ? C.green : "#fff", color: mechanic === v ? "#fff" : C.ink }}>
                  {t}<span style={{ display: "block", fontSize: 10.5, fontWeight: 500, color: mechanic === v ? "#CFE0D8" : C.inkSoft }}>{sub}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* age / child age */}
          {goal.childTo ? (
            <Field label="Your child’s age today">
              <input {...num} value={childAge} min="0" max="24" onChange={(e) => setChildAge(e.target.value)}
                onBlur={() => setChildAge(childAge === "" ? "" : Math.min(24, Math.max(0, toN(childAge, 0))))} />
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 5 }}>Fund matures at age 25 — {horizon} years away.</div>
            </Field>
          ) : (
            <Field label="Your age today">
              <input {...num} value={age} min="18" max="60" onChange={(e) => setAge(e.target.value)}
                onBlur={() => setAge(age === "" ? "" : Math.min(60, Math.max(18, toN(age, 30))))} />
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 5 }}>Planning to age {goal.to} — {horizon} years away.</div>
            </Field>
          )}

          {/* goal-specific target */}
          {isIncome ? (
            <Field label="Monthly income you’d like at retirement">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.inkSoft }}>S$</span>
                <input {...num} value={income} step="100" onChange={(e) => setIncome(e.target.value)} />
                <span style={{ color: C.inkSoft, fontSize: 13 }}>/ mo</span>
              </div>
            </Field>
          ) : (
            <Field label="Your target amount">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.inkSoft }}>S$</span>
                <input {...num} value={target} step="10000" onChange={(e) => setTarget(e.target.value)} />
              </div>
            </Field>
          )}

          {/* budget input in budget mode */}
          {mechanic === "budget" && (isIncome ? (
            <Field label="Yearly premium you’re comfortable with">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.inkSoft }}>S$</span>
                <input {...num} value={budgetA} step="1000" min="18000" onChange={(e) => setBudgetA(e.target.value)} />
                <span style={{ color: C.inkSoft, fontSize: 13 }}>/ yr</span>
              </div>
            </Field>
          ) : (
            <Field label="Monthly amount you’re comfortable with">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.inkSoft }}>S$</span>
                <input {...num} value={budgetM} step="100" onChange={(e) => setBudgetM(e.target.value)} />
                <span style={{ color: C.inkSoft, fontSize: 13 }}>/ mo</span>
              </div>
            </Field>
          ))}

          {/* CPF tier for income */}
          {isIncome && (
            <Field label="Your expected CPF LIFE payout">
              <select value={cpfTier} onChange={(e) => setCpfTier(e.target.value)} className="pb-input" style={{ padding: "9px 11px", fontSize: 14, cursor: "pointer" }}>
                {CPF.tiers.map((t) => <option key={t.key} value={t.key}>{t.short} — ~{money(t.payout)}/mo</option>)}
              </select>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 5 }}>CPF {CPF.year} estimate, from age 65. Your investment tops this up.</div>
            </Field>
          )}
        </section>

        {/* the plan */}
        <section style={{ display: "grid", gap: 18 }}>
          <div style={{ background: C.greenDeep, borderRadius: 14, padding: "22px 24px", color: "#fff" }}>
            {!isIncome ? (
              mechanic === "target" ? (
                <>
                  <div style={{ fontSize: 12.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.goldSoft, fontWeight: 600 }}>To reach {money(targetN)} in {horizon} years, invest about</div>
                  <div style={{ fontFamily: "'Newsreader',serif", fontSize: "clamp(38px,6.5vw,54px)", fontWeight: 500, lineHeight: 1.05, marginTop: 6 }}>{money(plan.reqPrem)}<span style={{ fontSize: 20, color: C.goldSoft }}> / month</span></div>
                  <div style={{ fontSize: 13, color: "#B9CBC2", marginTop: 8 }}>Assuming ~{PLAN.growth.mid}% p.a. In a rough stretch you might land nearer {money(plan.bandLow)}; a strong one, {money(plan.bandHigh)}.</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.goldSoft, fontWeight: 600 }}>{money(budgetMN)}/month for {horizon} years could grow to</div>
                  <div style={{ fontFamily: "'Newsreader',serif", fontSize: "clamp(38px,6.5vw,54px)", fontWeight: 500, lineHeight: 1.05, marginTop: 6 }}>{money(plan.projMid)}</div>
                  <div style={{ fontSize: 13, color: "#B9CBC2", marginTop: 8 }}>
                    {plan.projMid >= targetN ? <>That clears your {money(targetN)} goal. </> : <>That’s {money(targetN - plan.projMid)} short of {money(targetN)}. </>}
                    Range {money(plan.projLow)}–{money(plan.projHigh)} depending on markets.
                  </div>
                </>
              )
            ) : (
              mechanic === "target" ? (
                (() => {
                  const minA = PRODUCTS.pwv2.minAnnual;
                  const below = plan.reqPrem < minA;
                  return (
                    <>
                      <div style={{ fontSize: 12.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.goldSoft, fontWeight: 600 }}>For {money(incomeN)}/mo — {money(cpf.payout)} from CPF, {money(plan.gap)} from investments — invest about</div>
                      <div style={{ fontFamily: "'Newsreader',serif", fontSize: "clamp(34px,6vw,50px)", fontWeight: 500, lineHeight: 1.05, marginTop: 6 }}>{money(below ? minA : plan.reqPrem)}<span style={{ fontSize: 18, color: C.goldSoft }}> / year, 5 yrs</span></div>
                      <div style={{ fontSize: 13, color: "#B9CBC2", marginTop: 8 }}>
                        {below
                          ? <>That’s the plan minimum ({money(minA)}/yr) — with {horizon} years to compound, it comfortably clears this goal. You could aim higher or start later.</>
                          : <>Builds about {money(plan.reqCapital)} by 65, paying ~{(GAIF.yield * 100).toFixed(1)}% as income for life.</>}
                      </div>
                    </>
                  );
                })()
              ) : (
                <>
                  <div style={{ fontSize: 12.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.goldSoft, fontWeight: 600 }}>{money(budgetAN)}/yr builds ~{money(plan.capMid)}, paying about</div>
                  <div style={{ fontFamily: "'Newsreader',serif", fontSize: "clamp(34px,6vw,50px)", fontWeight: 500, lineHeight: 1.05, marginTop: 6 }}>{money(plan.total)}<span style={{ fontSize: 18, color: C.goldSoft }}> / month</span></div>
                  <div style={{ fontSize: 13, color: "#B9CBC2", marginTop: 8 }}>{money(cpf.payout)} CPF + {money(plan.invIncome)} investment income. {plan.total >= incomeN ? <>Clears your {money(incomeN)} goal.</> : <>{money(incomeN - plan.total)} short of {money(incomeN)}.</>}</div>
                </>
              )
            )}
          </div>

          {/* CPF stack (income goal) */}
          {isIncome && (
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
              <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 17, margin: "0 0 4px" }}>How your monthly income stacks up</h3>
              <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>CPF gives you a base; your investment builds on top.</div>
              {(() => {
                const inv = mechanic === "target" ? plan.gap : plan.invIncome;
                const totalShown = cpf.payout + inv;
                const scale = Math.max(incomeN, totalShown, 1);
                return (
                  <>
                    <div style={{ display: "flex", height: 26, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.line}` }}>
                      <div style={{ width: `${cpf.payout / scale * 100}%`, background: C.green }} title="CPF" />
                      <div style={{ width: `${inv / scale * 100}%`, background: C.gold }} title="Investment" />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5, flexWrap: "wrap", gap: 6 }}>
                      <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: C.green, marginRight: 6 }} />CPF LIFE <b>{money(cpf.payout)}</b></span>
                      <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: C.gold, marginRight: 6 }} />Investment <b>{money(inv)}</b></span>
                      <span style={{ color: C.inkSoft }}>Total <b style={{ color: C.ink }}>{money(totalShown)}</b> / mo</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* today's money */}
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: C.ink }}>
              {isIncome
                ? <>In today’s money, {money(incomeN)}/mo in {horizon} years feels like <b>{money(realValue(incomeN, horizon))}/mo</b>.</>
                : <>In today’s money, {money(targetN)} in {horizon} years is worth about <b>{money(realValue(targetN, horizon))}</b>.</>}
            </div>
            <span style={{ fontSize: 11, color: C.inkSoft, whiteSpace: "nowrap" }}>at ~{(INFLATION * 100).toFixed(0)}% inflation</span>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pb-btn" onClick={build}>Build this plan →</button>
            <button className="pb-btn ghost" onClick={goBlueprint}>See what it’s invested in</button>
          </div>

          <div style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.55 }}>
            Planning figures, not a forecast or guarantee — markets rise and fall and returns aren’t guaranteed. Growth assumes ~{PLAN.growth.mid}% p.a.; retirement income uses {GAIF.name}’s recent ~{(GAIF.yield * 100).toFixed(1)}% distribution (non-guaranteed, may include capital). CPF payouts are {CPF.year} estimates and sit alongside, not inside, this plan. Inflation shown at ~{(INFLATION * 100).toFixed(0)}%. Not financial advice.
          </div>
        </section>
      </div>
    </div>
  );
}

// per-tab header (eyebrow / title / italic subtitle); fades on tab change
const HEADERS = {
  goals:   { eyebrow: "Where every great plan begins", title: "Define What Matters", sub: "“Our goals can only be reached through a vehicle of a plan, in which we must fervently believe, and upon which we must vigorously act. There is no other route to success.” — Stephen A. Brennan", quote: true },
  blend:   { eyebrow: "Your goals, designed for you", title: "Your Portfolio", sub: "Personalised fund management, built around you." },
  funds:   { eyebrow: "Facts over fiction", title: "Performance You Can Measure", sub: "Don’t take our word for it. Take the numbers." },
  monthly: { eyebrow: "Built around you", title: "Your Plan. Put into Motion", sub: "Bring it to life." },
};

/* ============================================================
   ROOT
   ============================================================ */
export default function PortfolioBlend() {
  const [funds, setFunds] = useState(() => {
    const core = equalWeights(DATA.filter((f) => f.sleeve === "core"));
    const sat = equalWeights(DATA.filter((f) => f.sleeve === "satellite"));
    return [...core, ...sat].sort((a, b) => a.id - b.id);
  });
  const [coreShare, setCoreShare] = useState(70);
  // implementation inputs (shared with the Implementation tab + PDF export)
  const [monthly, setMonthly] = useState(1000);
  const [annual, setAnnual] = useState(18000);
  const [years, setYears] = useState(20);
  const [product, setProduct] = useState("apa3");
  const [reinvest, setReinvest] = useState(true);
  const [ratePeriod, setRatePeriod] = useState("y10");
  const [manual, setManual] = useState(null);
  const [pwvCapital, setPwvCapital] = useState(3);   // GAIF assumed capital/price growth p.a.
  const [topup, setTopup] = useState(0);             // PWV ad-hoc day-1 top-up
  const [clientName, setClientName] = useState("");
  const [tab, setTab] = useState("goals");

  const applyPlan = ({ product: p, freq, premium, years: yy, reinvest: ri }) => {
    setProduct(p);
    if (freq === "annual") setAnnual(premium); else setMonthly(premium);
    setYears(yy);
    if (ri !== undefined) setReinvest(ri);
    setTab("monthly");
  };

  const doExport = () => {
    const isPWV = product === "pwv2";
    const rate = isPWV ? pwvCapital : assumedRate(funds, coreShare, ratePeriod, manual).rate;
    exportOnePager({ clientName, funds, coreShare, years, product, rate, reinvest, topup: isPWV ? topup : 0,
      premium: isPWV ? annual : monthly, freq: isPWV ? "annual" : "monthly" });
  };

  return (
    <div style={{ background: C.paper, minHeight: "100%", color: C.ink, fontFamily: "'Inter', system-ui, sans-serif", fontFeatureSettings: '"tnum"' }}>
      <StyleBlock />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(16px,3vw,32px)" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 10, minHeight: 96 }}>
          <div key={tab} style={{ animation: "hdrFade .28s ease", maxWidth: 640 }}>
            <div style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>{HEADERS[tab].eyebrow}</div>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: "clamp(28px,4vw,42px)", margin: "9px 0 0", lineHeight: 1.05 }}>{HEADERS[tab].title}</h1>
            <p style={{ margin: "9px 0 0", color: C.gold, fontStyle: "italic", lineHeight: 1.5,
              fontFamily: HEADERS[tab].quote ? "'Newsreader', serif" : "inherit",
              fontSize: HEADERS[tab].quote ? 13.5 : 15 }}>{HEADERS[tab].sub}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input className="pb-input" style={{ width: 150, padding: "8px 10px", fontSize: 13 }} placeholder="Client name (optional)"
              value={clientName} onChange={(e) => setClientName(e.target.value)} />
            <button className="pb-btn" style={{ whiteSpace: "nowrap" }} onClick={doExport}>Export one-pager</button>
          </div>
        </header>

        <nav style={{ display: "flex", gap: 22, borderBottom: `1px solid ${C.line}`, marginBottom: 20, flexWrap: "wrap" }}>
          <button className="pb-tab" data-on={tab === "goals"} onClick={() => setTab("goals")}>Goals</button>
          <button className="pb-tab" data-on={tab === "blend"} onClick={() => setTab("blend")}>Your Portfolio</button>
          <button className="pb-tab" data-on={tab === "funds"} onClick={() => setTab("funds")}>Fund Performance</button>
          <button className="pb-tab" data-on={tab === "monthly"} onClick={() => setTab("monthly")}>Implementation</button>
        </nav>

        {tab === "goals" && <GoalsPage applyPlan={applyPlan} goBlueprint={() => setTab("blend")} />}
        {tab === "blend" && <BlendPage funds={funds} setFunds={setFunds} coreShare={coreShare} setCoreShare={setCoreShare} />}
        {tab === "funds" && <FundPage funds={funds} />}
        {tab === "monthly" && <MonthlyPage funds={funds} coreShare={coreShare}
          monthly={monthly} setMonthly={setMonthly} annual={annual} setAnnual={setAnnual}
          years={years} setYears={setYears} product={product} setProduct={setProduct}
          reinvest={reinvest} setReinvest={setReinvest} pwvCapital={pwvCapital} setPwvCapital={setPwvCapital}
          topup={topup} setTopup={setTopup}
          ratePeriod={ratePeriod} setRatePeriod={setRatePeriod} manual={manual} setManual={setManual} />}
      </div>
    </div>
  );
}
