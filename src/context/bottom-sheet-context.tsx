import * as Haptics from "expo-haptics";
import React, { createContext, useCallback, useContext, useState } from "react";
import { GlobalBottomSheet } from "../components/bottom-sheet/GlobalBottomSheet";

type SheetPayload = {
  content: React.ReactNode | (() => React.ReactNode);
  snapPoints?: (string | number)[];
};

type BottomSheetContextType = {
  openSheet: (payload: SheetPayload) => void;
  closeSheet: () => void;
  isOpen: boolean;
};

const BottomSheetContext = createContext<BottomSheetContextType>({
  openSheet: () => {},
  closeSheet: () => {},
  isOpen: false,
});

export const useBottomSheet = () => useContext(BottomSheetContext);

export const BottomSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [contentFn, setContentFn] = useState<{
    fn: () => React.ReactNode;
  } | null>(null);

  const [snapPoints, setSnapPoints] = useState<(string | number)[]>(["50%"]);
  const [isOpen, setIsOpen] = useState(false);

  const openSheet = useCallback(({ content, snapPoints: sp }: SheetPayload) => {
    // Envolve em objeto para evitar que o React execute como updater
    setContentFn({
      fn: typeof content === "function" ? content : () => content,
    });
    setSnapPoints(sp ?? ["50%"]);
    setIsOpen(true);
    Haptics.selectionAsync();
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <BottomSheetContext.Provider value={{ openSheet, closeSheet, isOpen }}>
      {children}
      <GlobalBottomSheet
        // Invoca a função a cada render — sempre conteúdo fresco
        content={contentFn?.fn() ?? null}
        snapPoints={snapPoints}
        isOpen={isOpen}
        onClose={closeSheet}
      />
    </BottomSheetContext.Provider>
  );
};
