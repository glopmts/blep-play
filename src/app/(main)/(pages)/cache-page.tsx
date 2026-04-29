import { BackButton } from "@/components/black-button";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/context/ThemeContext";
import { cacheManager } from "@/services/cacheManager.service";
import { Clock, Database, HardDrive, Image, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CacheStatsType {
  imageCacheSize: number;
  mmkvKeys: string[];
  totalSize: number;
  lastCleared: Date | null;
}

// ─── Stat Row ────
function StatRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
  colors: any;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: colors.cardMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        <Text style={{ color: colors.text, fontSize: 14 }}>{label}</Text>
      </View>
      {value !== undefined && (
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 13,
            fontVariant: ["tabular-nums"],
          }}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

// ─── Action Button
function ActionButton({
  onPress,
  disabled,
  loading,
  icon,
  title,
  subtitle,
  danger,
  colors,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  danger?: boolean;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderRadius: 16,
        backgroundColor: danger ? colors.danger_v2 : colors.surface,
        gap: 12,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: danger ? "rgba(220,38,38,0.12)" : colors.cardMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {subtitle}
          </Text>
        </View>
      </View>
      {loading && (
        <ActivityIndicator color={danger ? colors.danger : colors.primary} />
      )}
    </TouchableOpacity>
  );
}

// ─── Main Page ─────
const CachePage = () => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CacheStatsType | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const handleClearCache = async () => {
    Alert.alert(
      "Limpar Cache",
      "Tem certeza que deseja limpar todo o cache do app?\n\nIsso inclui:\n• Imagens e mídias\n• Álbuns e músicas em cache\n• Histórico recente\n• Dados temporários\n\nSeus favoritos serão mantidos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar Cache",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await cacheManager.safeClearCache();
              if (result.success) {
                Alert.alert("Sucesso", "Cache limpo com sucesso!");
              } else {
                Alert.alert("Erro", `Falha ao limpar cache: ${result.error}`);
              }
            } catch {
              Alert.alert("Erro", "Falha ao limpar cache");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleClearImages = async () => {
    Alert.alert("Limpar Imagens", "Limpar apenas o cache de imagens?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        onPress: async () => {
          setLoading(true);
          try {
            await cacheManager.clearSpecificCache("images");

            Alert.alert("Sucesso", "Cache de imagens limpo!");
          } catch {
            Alert.alert("Erro", "Falha ao limpar cache de imagens");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
  }, []);

  const formatSize = (mb: number): string => {
    if (!mb && mb !== 0) return "0 MB";
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  if (isLoadingStats) {
    return (
      <LayoutWithHeader>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}
          >
            Carregando estatísticas...
          </Text>
        </View>
      </LayoutWithHeader>
    );
  }

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 0, marginBottom: 8 }}>
          <BackButton
            position="static"
            style={{
              paddingHorizontal: 1,
              paddingTop: Platform.OS === "ios" ? 60 : 10,
            }}
          />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.text,
              marginTop: 20,
              marginLeft: 4,
            }}
          >
            Gerenciar Cache
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textMuted,
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            Monitore e libere o armazenamento do app
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 8 }}>
          {/* Total destaque */}
          {stats && (
            <View
              style={{
                borderRadius: 20,
                backgroundColor: colors.surface,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textMuted,
                    marginBottom: 4,
                  }}
                >
                  Total em cache
                </Text>
                <Text
                  style={{
                    fontSize: 34,
                    fontWeight: "700",
                    color: colors.text,
                    letterSpacing: -0.5,
                  }}
                >
                  {formatSize(stats.totalSize || 0)}
                </Text>
              </View>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: `${colors.primary}22`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HardDrive size={26} color={colors.primary} />
              </View>
            </View>
          )}

          {/* Stats detalhado */}
          {stats && (
            <View
              style={{
                borderRadius: 20,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  paddingVertical: 10,
                }}
              >
                Detalhes
              </Text>

              <StatRow
                icon={<Image size={16} color={colors.icon} />}
                label="Imagens em cache"
                value={formatSize(stats.imageCacheSize || 0)}
                colors={colors}
              />
              <StatRow
                icon={<Database size={16} color={colors.icon} />}
                label="Chaves MMKV"
                value={stats.mmkvKeys?.length ?? 0}
                colors={colors}
              />
              {stats.lastCleared && (
                <StatRow
                  icon={<Clock size={16} color={colors.icon} />}
                  label="Última limpeza"
                  value={new Date(stats.lastCleared).toLocaleDateString(
                    "pt-BR",
                  )}
                  colors={colors}
                />
              )}
              {/* Linha sem borda no final */}
              <View style={{ height: 8 }} />
            </View>
          )}

          {/* Erro de stats */}
          {!stats && (
            <View
              style={{
                padding: 20,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: "center",
                gap: 12,
              }}
            >
              <Text style={{ color: colors.textMuted }}>
                Não foi possível carregar as estatísticas
              </Text>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ fontWeight: "600", color: "#000" }}>
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ações */}
          <View style={{ gap: 10 }}>
            <ActionButton
              onPress={handleClearCache}
              disabled={loading}
              loading={loading}
              icon={<Trash2 size={20} color={colors.danger} />}
              title="Limpar Todo o Cache"
              subtitle="Remove imagens, áudios e dados temporários"
              danger
              colors={colors}
            />
            <ActionButton
              onPress={handleClearImages}
              disabled={loading}
              icon={<Image size={20} color={colors.icon} />}
              title="Limpar Cache de Imagens"
              subtitle="Remove apenas imagens armazenadas"
              colors={colors}
            />
          </View>

          {/* Info */}
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: `${colors.primary}33`,
              backgroundColor: `${colors.primary}0A`,
              padding: 16,
              flexDirection: "row",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <Text style={{ fontSize: 16, lineHeight: 22 }}>ℹ️</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.primary,
                  marginBottom: 4,
                }}
              >
                Sobre o Cache
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  lineHeight: 19,
                }}
              >
                O cache acelera o carregamento do app, mas pode ocupar espaço
                desnecessário. Limpar periodicamente libera armazenamento e
                resolve lentidões.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LayoutWithHeader>
  );
};

export default CachePage;
