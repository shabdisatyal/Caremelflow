import { useState, useEffect } from 'react';
import { readJson, writeJson } from '../utils/storage';



export function useStored(key) {
  const [value, setValue] = useState(() => readJson(key));
  useEffect(() => writeJson(key, value), [key, value]);
  return [value, setValue];
}
