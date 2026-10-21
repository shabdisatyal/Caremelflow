import { useNavigate } from 'react-router-dom';

import { KIND_LABEL } from '../constants';
import { deadlineLabel, formatTime } from '../../utils/dates';
import ModalShell from '../ui/ModalShell';
import { quietBtn, darkBtn } from '../ui/styles';

export default function FocusStep({ focus, tip, onClose }) {
  const navigate = useNavigate();
  return (
    <ModalShell label="Your one thing" onClose={onClose}>
      <h2 className="text-2xl font-semibold text-[var(--text)]">Start with this, one thing. </h2>
      {focus ? (
        <div className="mt-5 rounded-2xl bg-[var(--button)] p-5 text-[var(--ink)]">
          <p className="text-sm opacity-80">{focus.why}</p>
          <p className="mt-1 text-xl font-semibold">{focus.task.text}</p>
          <p className="mt-2 text-sm opacity-80">
            {[
              focus.task.tag,
              focus.task.kind !== 'task' && KIND_LABEL[focus.task.kind],
              deadlineLabel(focus.task.deadline),
            ]
              .filter(Boolean)
              .join(', ')}
            {focus.task.time ? ' at ' + formatTime(focus.task.time) : ''}
          </p>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-[var(--panel)] p-5 text-[var(--text)]">
          Hmm. No deadlines to worry about you can go steady 
        </p>
      )}
      {tip && <p className="mt-4 text-sm text-[var(--text)] opacity-70">{tip}</p>}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} className={quietBtn}>Close</button>
        {focus && (
          <button type="button" onClick={() => navigate('/study')} className={darkBtn}>
            Start a 5 minute focus
          </button>
        )}
      </div>
    </ModalShell>
  );
}