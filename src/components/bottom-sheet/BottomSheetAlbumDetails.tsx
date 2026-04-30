import { useTheme } from "@/context/ThemeContext";
import { confirmAndDeleteAlbum } from "@/services/delete-album.service";
import { AlbumInterface } from "@/types/interfaces";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ChevronRight, Info, Music, Trash2, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { showPlatformMessage } from "../toast-message-plataform";

type Props = {
  album: AlbumInterface;
  onDeleted?: (albumId: string) => void;
  onClose?: () => void;
  refreshAlbums?: () => void;
};

const BottomSheetAlbumDetails = ({
  album,
  onDeleted,
  onClose,
  refreshAlbums,
}: Props) => {
  const { colors, isDark } = useTheme();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    confirmAndDeleteAlbum(
      album,
      (deletedCount) => {
        onDeleted?.(album.id);
        onClose?.();
        refreshAlbums?.();
        showPlatformMessage("Album deletado com sucesso!");
      },
      (_reason) => {
        setDeleting(false);
      },
    );
  };

  const handleDetails = () => {
    router.navigate({
      pathname: "/(main)/(pages)/details-album/[id]",
      params: { id: album.id, type: "album_local" },
    });
    onClose?.();
  };

  return (
    <View className="flex-1">
      <View className="px-5 pt-2 pb-6">
        {/* Cabeçalho com capa e informações */}
        <View className="flex-row items-start gap-4 mb-6">
          <View className="w-20 h-20 rounded-xl overflow-hidden shadow-md shadow-black/20">
            {album.artworkBase64 ? (
              <Image
                source={{ uri: album.artworkBase64 }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isDark ? "#27272a" : "#e4e4e7",
                }}
              >
                <Music size={28} color={isDark ? "#d4d4d8" : "#27272a"} />
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text
              className="text-xl font-bold"
              style={{ color: colors.text }}
              numberOfLines={2}
            >
              {album.album}
            </Text>
            {album.artist && (
              <Text
                className="text-base mt-0.5"
                style={{ color: colors.textMuted }}
                numberOfLines={1}
              >
                {album.artist}
              </Text>
            )}
            <View className="flex-row items-center mt-1 gap-2">
              <Text className="text-sm" style={{ color: colors.textMuted }}>
                {album.numberOfSongs}{" "}
                {album.numberOfSongs === 1 ? "música" : "músicas"}
              </Text>
              {album.year && (
                <>
                  <Text style={{ color: colors.textMuted }}>•</Text>
                  <Text className="text-sm" style={{ color: colors.textMuted }}>
                    {album.year}
                  </Text>
                </>
              )}
            </View>
          </View>

          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-1"
            >
              <X size={22} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Ações */}
        <View className="gap-3 mt-2 flex-row justify-between">
          {/* Ver detalhes */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDetails}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.border,
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderRadius: 14,
            }}
          >
            <View className="flex-row items-center gap-3">
              <Info size={20} color={colors.textMuted} />
              <Text
                className="text-base font-medium"
                style={{ color: colors.text }}
              >
                Ver detalhes do álbum
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Deletar álbum */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDelete}
            disabled={deleting}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: colors.danger_v2,
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? "#7f1a1a" : "#fecaca",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? (
              <ActivityIndicator
                size="small"
                color={isDark ? "#f87171" : "#dc2626"}
              />
            ) : (
              <Trash2 size={20} color={isDark ? "#f87171" : "#dc2626"} />
            )}
            <Text
              className="text-base font-medium"
              style={{ color: isDark ? "#f87171" : "#dc2626" }}
            >
              {deleting ? "Deletando..." : "Deletar álbum"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          className="text-xs text-center mt-8"
          style={{ color: colors.textMuted }}
        >
          Toque fora para fechar • Pressione e segure para mais opções
        </Text>
      </View>
    </View>
  );
};

export default BottomSheetAlbumDetails;
