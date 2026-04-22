import * as Haptics from "expo-haptics";
import React, { createContext, useCallback, useContext, useState } from "react";
import { GlobalBottomSheet } from "../components/bottom-sheet/GlobalBottomSheet";

type SheetPayload = {
  content: React.ReactNode;
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
  const [sheetContent, setSheetContent] = useState<React.ReactNode>(null);
  const [snapPoints, setSnapPoints] = useState<(string | number)[]>(["50%"]);
  const [isOpen, setIsOpen] = useState(false);

  const openSheet = useCallback(({ content, snapPoints: sp }: SheetPayload) => {
    setSheetContent(content);
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
      {/* O GlobalBottomSheet lê o context — fica fora do children
          para sempre estar na camada mais alta */}
      <GlobalBottomSheet
        content={sheetContent}
        snapPoints={snapPoints}
        isOpen={isOpen}
        onClose={closeSheet}
      />
    </BottomSheetContext.Provider>
  );
};
