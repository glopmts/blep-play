import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useArtworkColor } from "../../hooks/useArtworkColor";

type Props = {
  content: React.ReactNode;
  trackArtwork?: string | null;
  snapPoints: (string | number)[];
  isOpen: boolean;
  openCount: number;
  onClose: () => void;
};

export function GlobalBottomSheet({
  content,
  snapPoints,
  trackArtwork,
  isOpen,
  openCount,
  onClose,
}: Props) {
  const ref = useRef<BottomSheet>(null);
  const { colors, isDark } = useTheme();
  const artworkColors = useArtworkColor(trackArtwork as string | null);

  useEffect(() => {
    if (isOpen) {
      // openCount garante que re-abre mesmo se isOpen não mudou
      setTimeout(() => ref.current?.snapToIndex(0), 50);
    } else {
      ref.current?.close();
    }
  }, [isOpen, openCount]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const bg = artworkColors.background
    ? isDark
      ? `${artworkColors.background}F5`
      : `${artworkColors.background}EE`
    : colors.background_sheet;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      // ✅ Desativa tamanho dinâmico — respeita snapPoints
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
      backgroundStyle={{ backgroundColor: bg }}
      handleIndicatorStyle={{ backgroundColor: colors.indicator_sheet }}
    >
      {/* ✅ ScrollView garante que o conteúdo não "empurra" o sheet */}
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {content}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
