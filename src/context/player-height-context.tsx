import { createContext, ReactNode, useContext, useState } from "react";

interface PlayerHeightContextType {
  playerHeight: number;
  setPlayerHeight: (h: number) => void;
}

const PlayerHeightContext = createContext<PlayerHeightContextType>({
  playerHeight: 0,
  setPlayerHeight: () => {},
});

export const PlayerHeightProvider = ({ children }: { children: ReactNode }) => {
  const [playerHeight, setPlayerHeight] = useState(0);
  return (
    <PlayerHeightContext.Provider value={{ playerHeight, setPlayerHeight }}>
      {children}
    </PlayerHeightContext.Provider>
  );
};

export const usePlayerHeight = () => useContext(PlayerHeightContext);
