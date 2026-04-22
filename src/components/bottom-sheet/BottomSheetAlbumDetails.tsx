import { AlbumWithDetails } from "@/types/interfaces";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ChevronRight, Info, Music, Trash2, X } from "lucide-react-native";
import { Alert, Text, TouchableOpacity, View } from "react-native";

type Props = {
  album: AlbumWithDetails;
  isDark: boolean;
  onClose?: () => void; // para fechar o bottom sheet
};

const BottomSheetAlbumDetails = ({ album, isDark, onClose }: Props) => {
  const handleDelete = () => {
    Alert.alert(
      "Deletar álbum",
      `Tem certeza que deseja deletar "${album.title}"? Essa ação não poderá ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: () => {
            // Aqui você chamaria a função de deletar do seu hook/contexto
            console.log("Deletar álbum:", album.id);
            onClose?.(); // opcional: fechar bottom sheet após deletar
          },
        },
      ],
    );
  };

  const handleDetails = () => {
    router.navigate({
      pathname: "/(main)/(pages)/details-album/[id]",
      params: { id: album.id, type: "album_local" },
    });
    onClose?.();
  };

  const textPrimary = isDark ? "#ffffff" : "#18181b";
  const textSecondary = isDark ? "#a1a1aa" : "#71717a";
  const borderColor = isDark ? "#2c2c2e" : "#e4e4e7";

  return (
    <View className="flex-1">
      {/* Handle de arrasto (indica que pode fechar) */}
      <View className="items-center pt-2 pb-1">
        <View className="w-12 h-1 rounded-full bg-gray-400 dark:bg-gray-600" />
      </View>

      <View className="px-5 pt-2 pb-6">
        {/* Cabeçalho com capa e informações */}
        <View className="flex-row items-start gap-4 mb-6">
          <View className="w-20 h-20 rounded-xl overflow-hidden shadow-md shadow-black/20">
            {album.coverArt ? (
              <Image
                source={{ uri: album.coverArt }}
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
              style={{ color: textPrimary }}
              numberOfLines={2}
            >
              {album.title}
            </Text>
            {album.artist && (
              <Text
                className="text-base mt-0.5"
                style={{ color: textSecondary }}
                numberOfLines={1}
              >
                {album.artist}
              </Text>
            )}
            <View className="flex-row items-center mt-1 gap-2">
              <Text className="text-sm" style={{ color: textSecondary }}>
                {album.assetCount}{" "}
                {album.assetCount === 1 ? "música" : "músicas"}
              </Text>
              {album.year && (
                <>
                  <Text style={{ color: textSecondary }}>•</Text>
                  <Text className="text-sm" style={{ color: textSecondary }}>
                    {album.year}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Botão de fechar (opcional, já que pode arrastar) */}
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-1"
            >
              <X size={22} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Ações */}
        <View className="gap-3 mt-2">
          {/* Ver detalhes */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDetails}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: isDark ? "#2c2c2e" : "#f4f4f5",
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderRadius: 14,
            }}
          >
            <View className="flex-row items-center gap-3">
              <Info size={20} color={textPrimary} />
              <Text
                className="text-base font-medium"
                style={{ color: textPrimary }}
              >
                Ver detalhes do álbum
              </Text>
            </View>
            <ChevronRight size={18} color={textSecondary} />
          </TouchableOpacity>

          {/* Deletar álbum */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDelete}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: isDark ? "#3c1e1e" : "#fee2e2",
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? "#7f1a1a" : "#fecaca",
            }}
          >
            <View className="flex-row items-center gap-3">
              <Trash2 size={20} color={isDark ? "#f87171" : "#dc2626"} />
              <Text
                className="text-base font-medium"
                style={{ color: isDark ? "#f87171" : "#dc2626" }}
              >
                Deletar álbum
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Rodapé informativo */}
        <Text
          className="text-xs text-center mt-8"
          style={{ color: textSecondary }}
        >
          Toque fora para fechar • Pressione e segure para mais opções
        </Text>
      </View>
    </View>
  );
};

export default BottomSheetAlbumDetails;
