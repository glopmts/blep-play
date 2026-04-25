import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { FC, useEffect, useRef } from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { AlbumWithDetails } from "../../types/interfaces";

type BottomSheetProps = {
  album?: AlbumWithDetails;
  snapPoints?: (string | number)[];
};

const BottomSheetComponent: FC<BottomSheetProps> = ({
  album,
  snapPoints = ["50%"],
}) => {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    // Expande o bottom sheet assim que o componente for montado
    if (bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    }
  }, []);

  const handleSheetChanges = (index: number) => {
    // Opcional: se o usuário fechar, você pode notificar o pai
    if (index === -1) {
      /* fechou */
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      index={0} // começa aberto
      enablePanDownToClose={true} // permite fechar arrastando para baixo
      backgroundStyle={{ backgroundColor: colors.card }}
    >
      <BottomSheetView style={styles.contentContainer}>
        <Text style={{ color: colors.text }}>{album?.title} 🎉</Text>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: "center",
  },
});

export default BottomSheetComponent;
