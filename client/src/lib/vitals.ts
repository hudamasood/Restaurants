import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Core Web Vitals reporting.
 *
 * The spec set budgets — LCP under 2.5s, CLS under 0.05, INP under 200ms —
 * and a budget nobody measures is a wish. This reports real user numbers
 * rather than a lab score, because the pinned scroll sections and the
 * cross-dissolves are exactly the kind of thing that behaves differently on
 * a mid-tier Android than on a developer's laptop.
 *
 * With no endpoint configured it logs in development and does nothing in
 * production, rather than shipping a silent beacon nobody asked for.
 */

const BUDGETS: Record<string, number> = { LCP: 2500, CLS: 0.05, INP: 200, FCP: 1800, TTFB: 800 };

function report(metric: Metric) {
  const endpoint = import.meta.env?.VITE_VITALS_ENDPOINT;
  const over = BUDGETS[metric.name] !== undefined && metric.value > BUDGETS[metric.name];

  if (endpoint) {
    const body = JSON.stringify({
      name: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      rating: metric.rating,
      overBudget: over,
      path: location.pathname,
    });
    // sendBeacon survives the page being closed, which is exactly when the
    // final CLS and INP values are known.
    if (navigator.sendBeacon) navigator.sendBeacon(endpoint, body);
    else fetch(endpoint, { method: 'POST', body, keepalive: true }).catch(() => {});
    return;
  }

  if (import.meta.env?.DEV) {
    const v = metric.name === 'CLS' ? metric.value.toFixed(3) : `${Math.round(metric.value)}ms`;
    console.info(`[vitals] ${metric.name} ${v} ${metric.rating}${over ? ' — OVER BUDGET' : ''}`);
  }
}

export function reportVitals() {
  onLCP(report);
  onCLS(report);
  onINP(report);
  onFCP(report);
  onTTFB(report);
}
