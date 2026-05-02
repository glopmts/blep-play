import { BackButton } from "@/components/black-button";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/context/ThemeContext";
import { useLibrarySettings } from "@/hooks/uselibrarysettings";
import {
  ChevronRight,
  Copy,
  FolderOpen,
  FolderPlus,
  RefreshCw,
  Scan,
  Trash2,
  X,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AUTO_SCAN_OPTIONS = ["Off", "Daily", "Weekly"] as const;

export default function LocalLibrary() {
  const { colors } = useTheme();
  const lib = useLibrarySettings();

  const [autoScanOpen, setAutoScanOpen] = React.useState(false);

  const bg = colors.surface ?? "#0f0f0f";
  const card = colors.input ?? "#1c1c1e";
  const border = colors.border ?? "#ffffff14";
  const accent = colors.primary ?? "#6366f1";
  const text = colors.text ?? "#fff";
  const sub = colors.text_gray ?? "#888";
  const icon = colors.icon ?? "#aaa";

  const confirmRemove = (path: string, name: string) => {
    Alert.alert("Remover pasta", `Remover "${name}" da lista de scan?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => lib.removeFolder(path),
      },
    ]);
  };

  return (
    <LayoutWithHeader statusBarOpen={false} header={false}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 16 }}>
          <BackButton
            position="relative"
            style={{ paddingTop: 8, paddingHorizontal: 2 }}
          />

          <Text
            style={{
              color: text,
              fontSize: 24,
              fontWeight: "700",
              marginTop: 20,
            }}
          >
            Biblioteca Local
          </Text>
          <Text style={{ color: sub, fontSize: 13, marginTop: 4 }}>
            Gerencie as pastas que serão escaneadas
          </Text>

          {/* ── Configurações gerais */}
          <SectionLabel label="Scan Settings" color={accent} />
          <Card bg={card}>
            <Row
              icon={<Scan size={20} color={icon} />}
              label="Enable Local Library"
              desc="Ativar escaneamento de músicas locais"
              text={text}
              sub={sub}
              right={
                <Switch
                  value={lib.enabled}
                  onValueChange={lib.setEnabled}
                  trackColor={{ false: border, true: accent }}
                  thumbColor="#fff"
                />
              }
            />
            <Div color={border} />
            <Row
              icon={<Copy size={20} color={icon} />}
              label="Show Duplicate Indicator"
              desc="Indicar faixas duplicadas"
              text={text}
              sub={sub}
              right={
                <Switch
                  value={lib.showDuplicates}
                  onValueChange={lib.setShowDuplicates}
                  trackColor={{ false: border, true: accent }}
                  thumbColor="#fff"
                />
              }
            />
            <Div color={border} />
            <Row
              icon={<RefreshCw size={20} color={icon} />}
              label="Auto Scan"
              desc={lib.autoScan}
              text={text}
              sub={sub}
              onPress={() => setAutoScanOpen(true)}
              right={<ChevronRight size={18} color={sub} />}
            />
          </Card>

          {/* ── Pastas */}
          <SectionLabel label="Library Folders" color={accent} />

          {lib.scanFolders.length === 0 ? (
            <View
              style={{
                backgroundColor: card,
                borderRadius: 14,
                padding: 20,
                alignItems: "center",
                gap: 8,
              }}
            >
              <FolderOpen size={32} color={sub} />
              <Text style={{ color: sub, fontSize: 14, textAlign: "center" }}>
                Nenhuma pasta adicionada.{"\n"}Adicione uma pasta abaixo.
              </Text>
            </View>
          ) : (
            <Card bg={card}>
              {lib.scanFolders.map((f, idx) => (
                <View key={f.path}>
                  {idx > 0 && <Div color={border} />}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      gap: 10,
                    }}
                  >
                    <Switch
                      value={f.enabled}
                      onValueChange={(v) => lib.toggleFolder(f.path, v)}
                      trackColor={{ false: border, true: accent }}
                      thumbColor="#fff"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: f.enabled ? text : sub,
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        {f.name}
                      </Text>
                      <Text
                        style={{ color: sub, fontSize: 11, marginTop: 1 }}
                        numberOfLines={1}
                      >
                        {f.path}
                      </Text>
                      {f.track_count != null && (
                        <Text
                          style={{ color: accent, fontSize: 11, marginTop: 2 }}
                        >
                          {f.track_count} faixas
                          {f.scanned_at ? ` · ${timeAgo(f.scanned_at)}` : ""}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => confirmRemove(f.path, f.name)}
                      hitSlop={12}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* ── Botões de adicionar pasta*/}
          <AddFolderButton
            accent={icon}
            sub={sub}
            onAddDefault={lib.addDefaultFolder}
            onPickFolder={lib.pickFolder}
          />
        </View>
      </ScrollView>

      <BottomModal
        visible={autoScanOpen}
        onClose={() => setAutoScanOpen(false)}
        title="Auto Scan"
        bg={bg}
        text={text}
        sub={sub}
        border={border}
      >
        <View className="gap-2">
          {AUTO_SCAN_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                lib.setAutoScan(opt);
                setAutoScanOpen(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: lib.autoScan === opt ? accent + "22" : border,
              }}
            >
              <Text
                style={{
                  color: lib.autoScan === opt ? accent : text,
                  fontWeight: lib.autoScan === opt ? "700" : "400",
                  fontSize: 15,
                }}
              >
                {opt}
              </Text>
              {lib.autoScan === opt && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: accent,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomModal>
    </LayoutWithHeader>
  );
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text
      style={{
        color,
        fontWeight: "700",
        fontSize: 11,
        letterSpacing: 1,
        marginTop: 24,
        marginBottom: 8,
        textTransform: "uppercase",
      }}
    >
      {label}
    </Text>
  );
}

function Card({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 14, overflow: "hidden" }}>
      {children}
    </View>
  );
}

function Div({ color }: { color: string }) {
  return <View style={{ height: 1, backgroundColor: color, marginLeft: 50 }} />;
}

function Row({
  icon,
  label,
  desc,
  right,
  text,
  sub,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  right: React.ReactNode;
  text: string;
  sub: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 14,
      }}
    >
      <View style={{ width: 28, alignItems: "center" }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: text, fontSize: 15, fontWeight: "500" }}>
          {label}
        </Text>
        <Text style={{ color: sub, fontSize: 12, marginTop: 1 }}>{desc}</Text>
      </View>
      {right}
    </TouchableOpacity>
  );
}

function AddFolderButton({
  onAddDefault,
  onPickFolder,
  accent,
  sub,
}: {
  onAddDefault: () => void;
  onPickFolder: () => void;
  accent: string;
  sub: string;
}) {
  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      <TouchableOpacity
        onPress={onAddDefault}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: accent,
          borderStyle: "dashed",
        }}
      >
        <FolderPlus size={18} color={accent} />
        <Text style={{ color: accent, fontWeight: "600", fontSize: 14 }}>
          Adicionar /Music (padrão)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPickFolder}
        className="border border-zinc-400"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 12,
          borderRadius: 12,
        }}
      >
        <FolderOpen size={16} color={sub} />
        <Text style={{ color: sub, fontSize: 13 }}>Escolher outra pasta…</Text>
      </TouchableOpacity>
    </View>
  );
}

function BottomModal({
  visible,
  onClose,
  title,
  children,
  bg,
  text,
  sub,
  border,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  bg: string;
  text: string;
  sub: string;
  border: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "#00000099",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: bg,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingBottom: 36,
            maxHeight: "72%",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: border,
              alignSelf: "center",
              marginVertical: 12,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: text, fontSize: 17, fontWeight: "700" }}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={sub} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ paddingHorizontal: 8 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "agora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}
