import { usePlayerStore } from "@/hooks/usePlayerStoreOnline";
import { musicApi } from "@/services/musicApi.service";
import { Lyrics } from "@/types/online-search";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SeekBar({
  position,
  duration,
  onSeek,
}: {
  position: number;
  duration: number;
  onSeek: (s: number) => void;
}) {
  const pct = duration > 0 ? (position / duration) * 100 : 0;
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  return (
    <View style={seekStyles.wrapper}>
      <TouchableOpacity
        style={seekStyles.track}
        onPress={(e) => {
          const x = e.nativeEvent.locationX;
          // approximate — full slider component would use PanResponder
          const ratio = x / 280;
          onSeek(ratio * duration);
        }}
      >
        <View style={[seekStyles.fill, { width: `${pct}%` }]} />
        <View style={[seekStyles.thumb, { left: `${pct}%` }]} />
      </TouchableOpacity>
      <View style={seekStyles.labels}>
        <Text style={seekStyles.time}>{fmt(position)}</Text>
        <Text style={seekStyles.time}>{fmt(duration)}</Text>
      </View>
    </View>
  );
}

const seekStyles = StyleSheet.create({
  wrapper: { width: "100%", paddingHorizontal: 24, marginTop: 32 },
  track: {
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  fill: { height: 4, backgroundColor: "#1DB954", borderRadius: 2 },
  thumb: {
    position: "absolute",
    width: 14,
    height: 14,
    backgroundColor: "#fff",
    borderRadius: 7,
    top: -5,
    marginLeft: -7,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  time: { color: "#aaa", fontSize: 12 },
});

export default function PlayerScreen() {
  const router = useRouter();
  const {
    currentTrack,
    status,
    position,
    duration,
    togglePlay,
    seek,
    next,
    prev,
  } = usePlayerStore();
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [activeLyricIdx, setActiveLyricIdx] = useState(-1);

  useEffect(() => {
    if (!currentTrack) return;
    setLyrics(null);
    setLoadingLyrics(true);
    musicApi
      .getLyrics(currentTrack.id)
      .then(setLyrics)
      .finally(() => setLoadingLyrics(false));
  }, [currentTrack?.id]);

  // Track current lyric line
  useEffect(() => {
    if (!lyrics?.synced) return;
    const idx = lyrics.synced.findLastIndex((l) => l.time <= position);
    setActiveLyricIdx(idx);
  }, [position, lyrics]);

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 40 }}>
          Nada tocando
        </Text>
      </SafeAreaView>
    );
  }

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  const dominantColor = "#1a1a2e"; // ideally computed from cover

  return (
    <LinearGradient colors={[dominantColor, "#121212"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
          <Text style={styles.nowPlayingLabel}>Tocando agora</Text>
          <TouchableOpacity
            onPress={() => router.push(`/track/${currentTrack.id}`)}
          >
            <Text style={styles.dotsBtn}>···</Text>
          </TouchableOpacity>
        </View>

        {/* Cover */}
        {!showLyrics && (
          <View style={styles.coverWrapper}>
            {currentTrack.coverUrl ? (
              <Image
                source={{ uri: currentTrack.coverUrl }}
                style={styles.cover}
              />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text style={{ fontSize: 60 }}>🎵</Text>
              </View>
            )}
          </View>
        )}

        {/* Synced lyrics panel */}
        {showLyrics && (
          <ScrollView
            style={styles.lyricsScroll}
            contentContainerStyle={{ paddingVertical: 20 }}
          >
            {loadingLyrics && <ActivityIndicator color="#1DB954" />}
            {lyrics?.synced?.map((line, i) => (
              <Text
                key={i}
                style={[
                  styles.lyricLine,
                  i === activeLyricIdx && styles.lyricLineActive,
                ]}
                onPress={() => seek(line.time)}
              >
                {line.text}
              </Text>
            ))}
            {!loadingLyrics && !lyrics?.synced && lyrics?.plain && (
              <Text style={styles.plainLyrics}>{lyrics.plain}</Text>
            )}
            {!loadingLyrics && !lyrics?.synced && !lyrics?.plain && (
              <Text style={styles.noLyrics}>Letra não disponível</Text>
            )}
          </ScrollView>
        )}

        {/* Track info */}
        <View style={styles.trackInfo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {currentTrack.artist.name}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowLyrics((v) => !v)}>
            <Text
              style={[
                styles.lyricsToggle,
                showLyrics && styles.lyricsToggleActive,
              ]}
            >
              🎤
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seek bar */}
        <SeekBar position={position} duration={duration} onSeek={seek} />

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={prev}>
            <Text style={styles.controlBtn}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playBtn}
            onPress={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.playBtnIcon}>{isPlaying ? "⏸" : "▶"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={next}>
            <Text style={styles.controlBtn}>⏭</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  chevron: { color: "#fff", fontSize: 28 },
  nowPlayingLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  dotsBtn: { color: "#fff", fontSize: 22, letterSpacing: 2 },
  coverWrapper: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cover: { width: 280, height: 280, borderRadius: 16, backgroundColor: "#333" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  lyricsScroll: { flex: 1, paddingHorizontal: 24 },
  lyricLine: {
    color: "#666",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 6,
    lineHeight: 28,
  },
  lyricLineActive: { color: "#fff", fontSize: 22, fontWeight: "700" },
  plainLyrics: {
    color: "#aaa",
    fontSize: 15,
    lineHeight: 26,
    textAlign: "center",
  },
  noLyrics: { color: "#555", textAlign: "center", marginTop: 40 },
  trackInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  trackTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  artistName: { color: "#aaa", fontSize: 16, marginTop: 4 },
  lyricsToggle: { fontSize: 24, opacity: 0.5 },
  lyricsToggleActive: { opacity: 1 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    paddingTop: 32,
    paddingBottom: 20,
  },
  controlBtn: { color: "#fff", fontSize: 32 },
  playBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnIcon: { fontSize: 30, color: "#000" },
});
