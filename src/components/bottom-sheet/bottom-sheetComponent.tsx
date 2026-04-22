import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { FC, useEffect, useRef } from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";
import { AlbumWithDetails } from "../../types/interfaces";

type BottomSheetProps = {
  album?: AlbumWithDetails;
  snapPoints?: (string | number)[];
};

const BottomSheetComponent: FC<BottomSheetProps> = ({
  album,
  snapPoints = ["50%"],
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    // Expande o bottom sheet assim que o componente for montado
    if (bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    }
  }, []);

  const handleSheetChanges = (index: number) => {
    console.log("handleSheetChanges", index);
    // Opcional: se o usuário fechar, você pode notificar o pai
    // if (index === -1) { /* fechou */ }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      index={0} // começa aberto
      enablePanDownToClose={true} // permite fechar arrastando para baixo
      backgroundStyle={{ backgroundColor: isDark ? "#1c1c1e" : "#ffffff" }}
    >
      <BottomSheetView style={styles.contentContainer}>
        <Text style={{ color: isDark ? "#fff" : "#000" }}>
          {album?.title} 🎉
        </Text>
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
