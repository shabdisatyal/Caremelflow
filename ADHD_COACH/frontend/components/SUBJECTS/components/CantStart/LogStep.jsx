import { useState } from 'react';
import { MOODS, REASONS } from '../constants';
import ModalShell from '../ui/ModalShell';
import Chip from '../ui/Chip';
import { quietBtn, darkBtn, field } from '../ui/styles';

export default function LogStep({ onSubmit, onClose }) {
  const [mood, setMood] = useState('');
  const [reasons, setReasons] = useState([]);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');

  const toggle = (r) =>
    setReasons((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));

  return (
    <ModalShell label="Check in" onClose={onClose}>
      <h2 className="text-2xl font-semibold text-[#4A2F20]">Let us check in first</h2>
      <p className="mt-1 text-sm text-[#7a6a5a]">No wrong answers. This takes under a minute.</p>

      <p className="mt-6 text-sm font-medium text-[#4A2F20]">How are you feeling?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <Chip key={m} selected={mood === m} onClick={() => setMood(m)}>{m}</Chip>
        ))}
      </div>

      <p className="mt-6 text-sm font-medium text-[#4A2F20]">What is making it hard to start?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <Chip key={r} selected={reasons.includes(r)} onClick={() => toggle(r)}>{r}</Chip>
        ))}
      </div>

      <label className="mt-6 block text-sm font-medium text-[#4A2F20]" htmlFor="energy">
        Energy right now: {energy} of 5
      </label>
      <input
        id="energy" type="range" min="1" max="5" value={energy}
        onChange={(e) => setEnergy(Number(e.target.value))}
        className="mt-2 w-full accent-[#3B5B3F]"
      />

      <label className="mt-6 block text-sm font-medium text-[#4A2F20]" htmlFor="note">
        Anything else? (optional)
      </label>
      <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={'mt-2 ' + field} />

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} className={quietBtn}>Not now</button>
        <button
          type="button"
          disabled={!mood || reasons.length === 0}
          onClick={() => onSubmit({ mood, reasons, energy, note })}
          className={darkBtn + ' disabled:opacity-40'}
        >
          Save and take 5 minutes
        </button>
      </div>
    </ModalShell>
  );
}
