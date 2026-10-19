import { useNavigate } from 'react-router-dom';

import { KIND_LABEL } from '../constants';
import { deadlineLabel, formatTime } from '../../utils/dates';
import ModalShell from '../ui/ModalShell';
import { quietBtn, darkBtn } from '../ui/styles';

export default function FocusStep({ focus, tip, onClose }) {
  const navigate = useNavigate();
  return (
    <ModalShell label="Your one thing" onClose={onClose}>
      <h2 className="text-2xl font-semibold text-[#4A2F20]">Here is your one thing</h2>
      {focus ? (
        <div className="mt-5 rounded-2xl bg-[#3B5B3F] p-5 text-[#FFFAF3]">
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
        <p className="mt-5 rounded-2xl bg-white p-5 text-[#4A2F20]">
          Nothing is waiting on you. Add something to your calendar when you are ready.
        </p>
      )}
      {tip && <p className="mt-4 text-sm text-[#7a6a5a]">{tip}</p>}
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
