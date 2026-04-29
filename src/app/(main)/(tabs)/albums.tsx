import { useBottomSheet } from "@/context/bottom-sheet-context";
import { useTheme } from "@/context/ThemeContext";
import { AlbumWithDetails, GroupedAlbum } from "@/types/interfaces";
import { memo } from "react";
import { View } from "react-native";

// ─── Tipos dos itens da lista unificada
type SectionHeader = {
  _type: "header";
  title: string;
  icon?: React.ComponentType<any>;
};
type LocalAlbumRow = { _type: "local_row"; items: AlbumWithDetails[] };
type ArtistAlbumItem = { _type: "artist_album"; album: GroupedAlbum };
type ListItem = SectionHeader | LocalAlbumRow | ArtistAlbumItem;

// ─── Tela principal
const Albums = () => {
  const { isDark } = useTheme();
  const { openSheet, closeSheet } = useBottomSheet();

  return <View></View>;
};

export default memo(Albums);
