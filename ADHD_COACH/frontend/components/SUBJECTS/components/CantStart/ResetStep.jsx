import { useState, useEffect } from 'react';


import { RESET_SECONDS } from '../constants';
import { pad } from '../../utils/dates';
import ModalShell from '../ui/ModalShell';
import { quietBtn } from '../ui/styles';



export default function ResetStep({ onDone }) {
  const [left, setLeft] = useState(RESET_SECONDS);
  const [started, setStarted] = useState(false);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 50);
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (left <= 0) onDone();
  }, [left, onDone]);

  // 10 second cycle: inhale 4s, exhale 6s
  const inhale = (RESET_SECONDS - left) % 10 < 4;

  return (
    <ModalShell label="Breathing reset">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-semibold text-[#4A2F20]">Breathe. You have time.</h2>
        <div className="relative my-8 flex h-56 w-56 items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute h-56 w-56 rounded-full bg-[#B0C4D4]"
            style={{
              transform: `scale(${started && inhale ? 1 : 0.6})`,
              transition: reduceMotion ? 'none' : `transform ${inhale ? 4 : 6}s ease-in-out`,
            }}
          />
          <p className="relative text-xl font-medium text-[#4A2F20]" aria-live="polite">
            {inhale ? 'Breathe in' : 'Breathe out'}
          </p>
        </div>
        <p className="text-3xl font-semibold tabular-nums text-[#3B5B3F]">
          {pad(Math.floor(left / 60))}:{pad(left % 60)}
        </p>
        <button type="button" onClick={onDone} className={'mt-6 ' + quietBtn}>
          I feel ready, skip the rest
        </button>
      </div>
    </ModalShell>
  );
}
