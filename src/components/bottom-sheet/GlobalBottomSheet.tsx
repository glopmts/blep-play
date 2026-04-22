import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

type Props = {
  content: React.ReactNode;
  snapPoints: (string | number)[];
  isOpen: boolean;
  onClose: () => void;
};

export function GlobalBottomSheet({
  content,
  snapPoints,
  isOpen,
  onClose,
}: Props) {
  const ref = useRef<BottomSheet>(null);
  const isDark = useColorScheme() === "dark";

  useEffect(() => {
    if (isOpen) ref.current?.expand();
    else ref.current?.close();
  }, [isOpen]);

  // Backdrop com fade + clique para fechar
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0} // aparece quando o sheet abre
        disappearsOnIndex={-1} // some quando fecha
        opacity={0.5} // intensidade do escuro (0–1)
        pressBehavior="close" // clique fora → fecha
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
      backgroundStyle={{
        backgroundColor: isDark ? "#27272a" : "#ffffff",
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#52525b" : "#d4d4d8",
      }}
    >
      <BottomSheetView style={{ flex: 1 }}>{content}</BottomSheetView>
    </BottomSheet>
  );
}
