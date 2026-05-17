import { usePlayer } from "@/hooks/usePlayer";
import { useVideoClip } from "@/hooks/useVideoClip";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import YoutubeIframe from "react-native-youtube-iframe";
import { useTheme } from "../context/ThemeContext";
import { TrackDetails } from "../types/interfaces";
import ActivityIndicatorCustom from "./activityIndicator-Custom";
import EmptyState from "./empty-state";

interface VideoClipProps {
  song: TrackDetails;
  onClose?: () => void;
}

const VideoClipMusic = ({ song, onClose }: VideoClipProps) => {
  const { videoId, isLoading, error, searchVideoClip } = useVideoClip();
  const { togglePlayPause, isPlaying } = usePlayer();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    // Pausa o áudio ao abrir o clip
    if (isPlaying) togglePlayPause();
    searchVideoClip(song);
  }, [song]);

  const onPlayerStateChange = useCallback((state: string) => {
    setIsVideoPlaying(state === "playing");
  }, []);

  if (isLoading) return <ActivityIndicatorCustom />;

  if (error || !videoId)
    return (
      <EmptyState
        title="Clipe não encontrado"
        description={error ?? "Tente novamente"}
        onAction={() => searchVideoClip(song)}
      />
    );

  return (
    <View
      className="flex-1 overflow-hidden"
      style={{
        backgroundColor: colors.border,
        borderRadius: colors.rounded.rounded_2xl,
      }}
    >
      <YoutubeIframe
        height={320}
        videoId={videoId}
        play={isVideoPlaying}
        onChangeState={onPlayerStateChange}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          renderToHardwareTextureAndroid: true,
        }}
        style={{
          backgroundColor: colors.border,
        }}
        iframeStyle={{
          aspectRatio: 16 / 9,
        }}
      />

      {/* Título e artista */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
          {song.title}
        </Text>
        <Text style={{ color: colors.text_gray }}>{song.artist}</Text>
      </View>
    </View>
  );
};

export default VideoClipMusic;
