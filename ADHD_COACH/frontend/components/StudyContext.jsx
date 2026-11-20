import { createContext, useContext } from "react";
import { useStudy } from "./pages/Usestudy";

const StudyCtx = createContext(null);

export function StudyProvider({ children }) {
  const study = useStudy(); // runs once, never unmounts
  return <StudyCtx.Provider value={study}>{children}</StudyCtx.Provider>;
}

export const useStudyCtx = () => useContext(StudyCtx);