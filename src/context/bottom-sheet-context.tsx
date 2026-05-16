import * as Haptics from "expo-haptics";
import React, { createContext, useCallback, useContext, useState } from "react";
import { View } from "react-native";
import { GlobalBottomSheet } from "../components/bottom-sheet/GlobalBottomSheet";

type SheetPayload = {
  content: React.ReactNode | (() => React.ReactNode);
  snapPoints?: (string | number)[];
  initialSnap?: number; // ← índice inicial
  trackArtwork?: string | null;
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
  const [trackArtwork, setTrackArtwork] = useState<string | null>("");
  const [snapPoints, setSnapPoints] = useState<(string | number)[]>(["50%"]);
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0); // ← contador

  const openSheet = useCallback(
    ({ content, trackArtwork, snapPoints: sp }: SheetPayload) => {
      setContentFn({
        fn: typeof content === "function" ? content : () => content,
      });
      setSnapPoints(sp ?? ["50%"]);
      setTrackArtwork(trackArtwork || "");
      setIsOpen(true);
      setOpenCount((c) => c + 1); // ← incrementa sempre
      Haptics.selectionAsync();
    },
    [],
  );

  const closeSheet = useCallback(() => setIsOpen(false), []);

  return (
    <BottomSheetContext.Provider value={{ openSheet, closeSheet, isOpen }}>
      <View className="flex-1">{children}</View>
      <GlobalBottomSheet
        content={contentFn?.fn() ?? null}
        snapPoints={snapPoints}
        isOpen={isOpen}
        openCount={openCount} // ← passa o contador
        trackArtwork={trackArtwork}
        onClose={closeSheet}
      />
    </BottomSheetContext.Provider>
  );
};
