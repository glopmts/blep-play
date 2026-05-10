import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import NetInfo from "@react-native-community/netinfo";
import * as Clipboard from "expo-clipboard";
import { Copy, CopyCheck } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Track } from "react-native-track-player";
import { useTheme } from "../context/ThemeContext";
import { useArtworkColor } from "../hooks/useArtworkColor";
import { getLyricsForTrack } from "../utils/song-metadata/getLyricsForTrack";
import { showPlatformMessage } from "./toast-message-plataform";

interface InterfaceLyric {
  track: Track;
}

type LyricsSource = "online" | "local" | "cache" | null;

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
};

const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const withAlpha = (hex: string, alpha: number) => {
  if (!hex?.startsWith("#")) return hex;
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

const SOURCE_META: Record<
  NonNullable<LyricsSource>,
  { label: string; icon: string; color: string }
> = {
  online: { label: "Online", icon: "🌐", color: "#60A5FA" },
  local: { label: "Local", icon: "💾", color: "#34D399" },
  cache: { label: "Cache", icon: "⚡", color: "#FBBF24" },
};

const LyricPlayerSong = ({ track }: InterfaceLyric) => {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [source, setSource] = useState<LyricsSource>(null);
  const [error, setError] = useState<string | null>(null);
  const { colors, isDark } = useTheme();
  const [isCopying, setIsCopying] = useState(false);
  const { t } = useTranslation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  const artworkColors = useArtworkColor(track?.artwork as string | null);

  /* ── palette derived from artwork ── */
  const accentHex = artworkColors.primary || (isDark ? "#A78BFA" : "#7C3AED");
  const bgHex = artworkColors.background || (isDark ? "#0F0F13" : "#F8F8FC");
  const isLightBg = luminance(bgHex) > 0.5;

  const textColor = isLightBg ? "#1A1A2E" : "#F0F0F8";
  const subtleColor = isLightBg
    ? "rgba(26,26,46,0.45)"
    : "rgba(240,240,248,0.45)";
  const cardBg = isLightBg
    ? "rgba(255,255,255,0.55)"
    : "rgba(255,255,255,0.06)";
  const dividerColor = isLightBg
    ? "rgba(26,26,46,0.10)"
    : "rgba(240,240,248,0.10)";

  /* ── fetch ── */
  const fetchLyrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLyrics(null);
    fadeAnim.setValue(0);
    slideAnim.setValue(18);

    try {
      const netState = await NetInfo.fetch();
      const isConnected = !!netState.isConnected;

      const rawDuration =
        typeof track.duration === "string"
          ? parseInt(track.duration, 10)
          : (track.duration ?? 0);

      const durationSeconds =
        rawDuration > 100_000
          ? Math.floor(rawDuration / 1000)
          : Math.floor(rawDuration);

      const result = await getLyricsForTrack({
        trackId: track.id,
        filePath: track.filePath,
        title: track.title || "",
        artist: track.artist || "",
        album: track.album,
        duration: durationSeconds,
        online: isConnected,
      });

      setLyrics(result ?? null);
      if (result) setSource(isConnected ? "online" : "local");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar letra");
    } finally {
      setLoading(false);
    }
  }, [track.id]);

  useEffect(() => {
    fetchLyrics();
  }, [fetchLyrics]);

  const handleCopyLyrics = useCallback(async (lyrics: string) => {
    if (isCopying) return;
    setIsCopying(true);
    try {
      await Clipboard.setStringAsync(lyrics);
      showPlatformMessage("Letra copiada para a área de transferência!");
      setTimeout(() => setIsCopying(false), 5000);
    } catch (error) {
      console.error("Erro ao copiar letra:", error);
      setIsCopying(false);
    }
  }, []);

  /* ── animate in when content arrives ── */
  useEffect(() => {
    if (!isLoading && (lyrics || error)) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, lyrics, error]);

  const sm = source ? SOURCE_META[source] : null;

  return (
    <View style={{ flex: 1, backgroundColor: bgHex }}>
      {/* Decorative blobs — purely visual */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <View
          style={{
            position: "absolute",
            top: -40,
            left: -50,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: withAlpha(accentHex, 0.15),
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 40,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: withAlpha(accentHex, 0.1),
          }}
        />
      </View>

      {/* ── Static header — stays fixed above the scroll ── */}
      <View
        style={{
          paddingTop: 4,
          paddingHorizontal: 20,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: dividerColor,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: subtleColor,
            marginBottom: 4,
          }}
        >
          LETRA DA MÚSICA
        </Text>

        <Text
          numberOfLines={1}
          style={{
            fontSize: 17,
            fontWeight: "800",
            color: textColor,
            letterSpacing: -0.3,
          }}
        >
          {track.title || "Música"}
        </Text>

        {!!track.artist && (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              color: subtleColor,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            {track.artist}
          </Text>
        )}

        {sm && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: withAlpha(sm.color, 0.15),
              borderWidth: 1,
              borderColor: withAlpha(sm.color, 0.3),
            }}
          >
            <Text style={{ fontSize: 11 }}>{sm.icon}</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: sm.color,
                marginLeft: 4,
                letterSpacing: 0.4,
              }}
            >
              {sm.label}
            </Text>
          </View>
        )}
        {lyrics && (
          <TouchableOpacity
            onPress={() => handleCopyLyrics(lyrics as string)}
            disabled={isCopying || isLoading}
            className="p-1.5 absolute right-0 px-8"
          >
            {isCopying ? (
              <CopyCheck size={23} color="rgba(59,130,246,0.5)" />
            ) : (
              <Copy size={23} color={colors.icon} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── BottomSheetScrollView ──────────────────────────────
          Replacing plain ScrollView so gestures are correctly
          handed off to the BottomSheet drag handler.         */}
      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Loading */}
        {isLoading && (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 14 }}>
            <ActivityIndicator size="large" color={accentHex} />
            <Text
              style={{
                fontSize: 13,
                color: subtleColor,
                letterSpacing: 0.3,
                fontWeight: "500",
              }}
            >
              {t("lyrics.feedback.loading")}
            </Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && error && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              padding: 20,
              borderRadius: 16,
              backgroundColor: "rgba(239,68,68,0.12)",
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.25)",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: "#F87171",
                fontWeight: "600",
                marginBottom: 4,
              }}
            >
              ⚠️ {t("text.feedback.errorload")}
            </Text>
            <Text style={{ fontSize: 13, color: "#F87171", lineHeight: 20 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={fetchLyrics}
              style={{
                marginTop: 14,
                alignSelf: "flex-start",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: accentHex,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}
              >
                {t("text.feedback.refresh")}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* No lyrics */}
        {!isLoading && !error && !lyrics && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: "center",
              paddingTop: 60,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 40 }}>🎵</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: textColor,
                textAlign: "center",
              }}
            >
              {t("lyrics.unavailablelyrics")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: subtleColor,
                textAlign: "center",
                lineHeight: 20,
                maxWidth: 220,
              }}
            >
              {t("lyrics.unavailable")}
            </Text>
          </Animated.View>
        )}

        {/* Lyrics */}
        {!isLoading && lyrics && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Accent bar */}
            <View
              style={{
                width: 36,
                height: 3,
                borderRadius: 2,
                backgroundColor: accentHex,
                marginBottom: 20,
              }}
            />

            {/* Lyrics card */}
            <View
              style={{
                borderRadius: 20,
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: dividerColor,
                padding: 24,
              }}
            >
              {lyrics.split("\n\n").map((stanza, si, arr) => (
                <View
                  key={si}
                  style={{ marginBottom: si < arr.length - 1 ? 22 : 0 }}
                >
                  {stanza.split("\n").map((line, li) => {
                    const isMeta = line.trim().startsWith("[");
                    return (
                      <Text
                        key={li}
                        style={{
                          fontSize: isMeta ? 11 : 15,
                          lineHeight: isMeta ? 20 : 26,
                          color: isMeta ? subtleColor : textColor,
                          fontWeight: isMeta ? "700" : "400",
                          fontStyle: isMeta ? "italic" : "normal",
                          letterSpacing: isMeta ? 1.2 : 0.1,
                          textTransform: isMeta ? "uppercase" : "none",
                          marginBottom: isMeta ? 6 : 0,
                        }}
                      >
                        {line || " "}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Bottom decoration */}
            <View
              style={{
                marginTop: 28,
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                opacity: 0.4,
              }}
            >
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    width: i === 1 ? 20 : 6,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: accentHex,
                  }}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </BottomSheetScrollView>
    </View>
  );
};

export default LyricPlayerSong;
