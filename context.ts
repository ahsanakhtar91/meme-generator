import { createContext } from 'react';

export const GeneratingContext = createContext({
  setGlobalGenerating: (_newState: boolean) => {},
  setGenerationProgress: (_current: number, _total: number) => {},
});
