import { useState, useRef } from 'react';
import { buildReport } from '../../report/buildReport';

import Chip from '../ui/Chip';
import { darkBtn } from '../ui/styles';

import BarChart from './BarChart';

export default function Report() {
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  async function generate() {
    const id = ++requestId.current;
    setOpen(true);
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const result = await buildReport(days);
      if (id === requestId.current) setReport(result);
    } catch (err) {
      console.error('Failed to build report:', err);
      if (id === requestId.current) {
        setError(`Could not build the report: ${err.message || 'unknown error'}`);
      }
    }
    if (id === requestId.current) setLoading(false);
  }

  // Closing also cancels any report still loading
  function close() {
    requestId.current += 1;
    setOpen(false);
    setLoading(false);
    setReport(null);
    setError('');
  }

  function pickDays(n) {
    setDays(n);
    if (open) close();
  }

  return (
    <section className="rounded-3xl border border-none bg-[var(--panel)] p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Progress report</h2>
        </div>
        {open && (
          <button
            type="button"
            onClick={close}
            aria-label="Close report"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip selected={days === 7} onClick={() => pickDays(7)}>Last 7 days</Chip>
        <Chip selected={days === 30} onClick={() => pickDays(30)}>Last 30 days</Chip>
      </div>

      {!open && (
        <button type="button" onClick={generate} className={'mt-4 ' + darkBtn}>
          Generate report
        </button>
      )}

      {open && loading && <p className="mt-6 text-sm text-[var(--text)] opacity-70">Loading...</p>}
      {open && error && <p className="mt-6 text-sm font-medium text-[var(--error)]">{error}</p>}

      {open && report && (
        <div className="mt-6">
          <BarChart data={report.perDay} />
          {report.insights.length ? (
            <ul
              className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1"
              tabIndex={0}
              aria-label="Report highlights"
            >
              {report.insights.map((line) => (
                <li key={line} className="rounded-2xl bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)]">
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-[var(--text)] opacity-70">
              Nothing to report yet. Finish a focus session and check back.
            </p>
          )}
        </div>
      )}
    </section>
  );
}