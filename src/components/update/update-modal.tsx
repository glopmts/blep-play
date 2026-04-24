import { DownloadState, UpdateStatus } from "@/hooks/useAppUpdater";
import { UpdateInfo } from "@/services/githubApi.service";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

// ─── Types

interface UpdateModalProps {
  visible: boolean;
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  currentVersion: string;
  downloadState: DownloadState;
  errorMessage: string | null;
  onStartDownload: () => void;
  onCancelDownload: () => void;
  onDismiss: () => void;
  onRetry: () => void;
}

// ─── Sub-components

function StatusBadge({ status }: { status: UpdateStatus }) {
  const label: Record<UpdateStatus, string> = {
    idle: "",
    checking: "Verificando",
    available: "Disponível",
    downloading: "Baixando",
    installing: "Instalando",
    complete: "Concluído",
    error: "Erro",
    up_to_date: "Atualizado",
    offline: "Sem conexão",
  };

  const colors: Record<UpdateStatus, string> = {
    idle: "bg-zinc-700",
    checking: "bg-blue-500/20 text-blue-400",
    available: "bg-emerald-500/20 text-emerald-400",
    downloading: "bg-amber-500/20 text-amber-400",
    installing: "bg-purple-500/20 text-purple-400",
    complete: "bg-emerald-500/20 text-emerald-400",
    error: "bg-red-500/20 text-red-400",
    up_to_date: "bg-emerald-500/20 text-emerald-400",
    offline: "bg-zinc-500/20 text-zinc-400",
  };

  return (
    <View className={`px-3 py-1 rounded-full ${colors[status].split(" ")[0]}`}>
      <Text
        className={`text-xs font-semibold tracking-wide ${colors[status].split(" ")[1]}`}
      >
        {label[status].toUpperCase()}
      </Text>
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View className="h-2.5 bg-zinc-800 rounded-full overflow-hidden w-full">
      <Animated.View
        style={{ width }}
        className="h-full bg-emerald-500 rounded-full"
      />
    </View>
  );
}

function DownloadStats({ state }: { state: DownloadState }) {
  return (
    <View className="flex-row justify-between mt-2">
      <Text className="text-zinc-400 text-xs">
        {state.downloadedFormatted} / {state.totalFormatted}
      </Text>
      <Text className="text-emerald-400 text-xs font-medium">
        {state.speedFormatted}
      </Text>
    </View>
  );
}

function ChangelogSection({ body }: { body: string }) {
  // Convert markdown-ish lines to clean text
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20); // cap for modal

  return (
    <ScrollView className="max-h-40 mt-3" showsVerticalScrollIndicator={false}>
      {lines.map((line, i) => {
        const isBullet =
          line.startsWith("-") || line.startsWith("•") || line.startsWith("*");
        const isHeader = line.startsWith("#");
        const text = line.replace(/^[#\-•*]+\s*/, "").trim();

        if (isHeader) {
          return (
            <Text
              key={i}
              className="text-white font-semibold text-sm mb-1 mt-2"
            >
              {text}
            </Text>
          );
        }

        return (
          <View key={i} className="flex-row items-start mb-1">
            {isBullet && (
              <Text className="text-emerald-400 mr-2 text-sm leading-5">•</Text>
            )}
            <Text className="text-zinc-300 text-sm leading-5 flex-1">
              {text}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Component

export function UpdateModal({
  visible,
  status,
  updateInfo,
  currentVersion,
  downloadState,
  errorMessage,
  onStartDownload,
  onCancelDownload,
  onDismiss,
  onRetry,
}: UpdateModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const isDownloading = status === "downloading";
  const isInstalling = status === "installing";
  const isComplete = status === "complete";
  const isError = status === "error";
  const canDismiss = !isDownloading && !isInstalling;

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={canDismiss ? onDismiss : undefined}
    >
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 bg-black/70 justify-end"
      >
        {/* Backdrop tap to dismiss */}
        {canDismiss && (
          <Pressable className="absolute inset-0" onPress={onDismiss} />
        )}

        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="bg-zinc-900 rounded-t-3xl px-5 pt-5 pb-8 border-t border-zinc-800"
        >
          {/* Handle bar */}
          <View className="w-10 h-1 bg-zinc-700 rounded-full self-center mb-5" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-xl font-bold">
                {isComplete ? "✅ Atualizado!" : "Nova versão disponível"}
              </Text>
              {updateInfo && (
                <Text className="text-zinc-400 text-sm mt-0.5">
                  {updateInfo.releaseName}
                  {updateInfo.isPrerelease ? " • Beta" : ""}
                </Text>
              )}
            </View>
            <StatusBadge status={status} />
          </View>

          {/* Version info */}
          {updateInfo && (
            <View className="flex-row items-center gap-3 mb-4 bg-zinc-800/60 rounded-2xl px-4 py-3">
              <View className="flex-1">
                <Text className="text-zinc-500 text-xs mb-0.5">Atual</Text>
                <Text className="text-white font-semibold">
                  v{currentVersion}
                </Text>
              </View>
              <Text className="text-zinc-600 text-lg">→</Text>
              <View className="flex-1 items-end">
                <Text className="text-zinc-500 text-xs mb-0.5">Nova</Text>
                <Text className="text-emerald-400 font-bold">
                  v{updateInfo.latestVersion}
                </Text>
              </View>
              <View className="w-px h-8 bg-zinc-700 mx-1" />
              <View className="items-end">
                <Text className="text-zinc-500 text-xs mb-0.5">Tamanho</Text>
                <Text className="text-zinc-300 font-medium text-sm">
                  {formatFileSize(updateInfo.apkSize)}
                </Text>
              </View>
            </View>
          )}

          {/* Downloading state */}
          {(isDownloading || isInstalling) && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-zinc-300 text-sm font-medium">
                  {isInstalling ? "Instalando..." : "Baixando atualização"}
                </Text>
                <Text className="text-emerald-400 font-bold text-sm">
                  {isInstalling ? "100%" : `${downloadState.progress}%`}
                </Text>
              </View>
              <ProgressBar
                progress={isInstalling ? 100 : downloadState.progress}
              />
              {isDownloading && <DownloadStats state={downloadState} />}
              {isInstalling && (
                <View className="flex-row items-center mt-2 gap-2">
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text className="text-zinc-400 text-xs">
                    Preparando instalação...
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Complete state */}
          {isComplete && (
            <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 mb-4">
              <Text className="text-emerald-400 text-sm text-center">
                Instalação iniciada! Siga as instruções na tela.
              </Text>
            </View>
          )}

          {/* Error state */}
          {isError && errorMessage && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-4">
              <Text className="text-red-400 text-sm">{errorMessage}</Text>
            </View>
          )}

          {/* Changelog */}
          {updateInfo?.releaseNotes &&
            !isDownloading &&
            !isInstalling &&
            !isComplete && (
              <View className="mb-4">
                <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  O que há de novo
                </Text>
                <View className="bg-zinc-800/40 rounded-2xl px-4 py-3">
                  <ChangelogSection body={updateInfo.releaseNotes} />
                </View>
                {updateInfo.publishedAt && (
                  <Text className="text-zinc-600 text-xs mt-1.5 ml-1">
                    Publicado em {formatDate(updateInfo.publishedAt)}
                  </Text>
                )}
              </View>
            )}

          {/* Action buttons */}
          <View className="gap-3 mt-1">
            {/* Primary action */}
            {!isDownloading && !isInstalling && !isComplete && (
              <Pressable
                onPress={isError ? onRetry : onStartDownload}
                className="bg-emerald-500 active:bg-emerald-600 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-bold text-base">
                  {isError ? "Tentar novamente" : "⬇️  Baixar agora"}
                </Text>
              </Pressable>
            )}

            {/* Cancel during download */}
            {isDownloading && (
              <Pressable
                onPress={onCancelDownload}
                className="bg-zinc-800 active:bg-zinc-700 rounded-2xl py-4 items-center border border-zinc-700"
              >
                <Text className="text-zinc-300 font-semibold text-base">
                  Cancelar download
                </Text>
              </Pressable>
            )}

            {/* Dismiss / Later */}
            {canDismiss && (
              <Pressable onPress={onDismiss} className="py-3 items-center">
                <Text className="text-zinc-500 text-sm">
                  {isComplete ? "Fechar" : "Agora não"}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
