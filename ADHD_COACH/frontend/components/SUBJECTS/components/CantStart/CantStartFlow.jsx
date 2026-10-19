import { useState, useMemo } from 'react';
import { TIPS } from '../constants';
import { saveCheckIn } from '../supabase';
import { pickFocus } from '../../utils/tasks';
import LogStep from './LogStep';
import ResetStep from './ResetStep';
import FocusStep from './FocusStep';

export default function CantStartFlow({ tasks, onClose }) {
  const [step, setStep] = useState('log');
  const [entry, setEntry] = useState(null);
  const focus = useMemo(() => pickFocus(tasks), [tasks]);

  if (step === 'log') {
    return (
      <LogStep
        onClose={onClose}
        onSubmit={(data) => {
          saveCheckIn(data);
          setEntry(data);
          setStep('reset');
        }}
      />
    );
  }
  if (step === 'reset') return <ResetStep onDone={() => setStep('focus')} />;
  return <FocusStep focus={focus} tip={entry ? TIPS[entry.reasons[0]] : ''} onClose={onClose} />;
}
