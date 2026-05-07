import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useArtworkColor } from "../../hooks/useArtworkColor";

type Props = {
  content: React.ReactNode;
  trackArtwork?: string | null;
  snapPoints: (string | number)[];
  isOpen: boolean;
  onClose: () => void;
};

export function GlobalBottomSheet({
  content,
  snapPoints,
  trackArtwork,
  isOpen,
  onClose,
}: Props) {
  const ref = useRef<BottomSheet>(null);
  const { colors, isDark } = useTheme();

  const artworkColors = useArtworkColor(trackArtwork as string | null);

  useEffect(() => {
    if (isOpen) ref.current?.snapToIndex(0);
    else ref.current?.close();
  }, [isOpen, onClose]);

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

  const bg = (() => {
    if (artworkColors.background) {
      return isDark
        ? `${artworkColors.background}F5`
        : `${artworkColors.background}EE`;
    }
    return colors.background_sheet;
  })();

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
        backgroundColor: bg,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.indicator_sheet,
      }}
    >
      <BottomSheetView>
        <View className="flex-1">{content}</View>
      </BottomSheetView>
    </BottomSheet>
  );
}
