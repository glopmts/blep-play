import { useTheme } from "@/context/ThemeContext";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Log {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
  details?: string;
}

const LogsScreen = () => {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<Log[]>([
    {
      id: "1",
      timestamp: "10:30 AM",
      level: "info",
      message: "Usuário logado",
      details: "Detalhes do login...",
    },
    {
      id: "2",
      timestamp: "10:35 AM",
      level: "warning",
      message: "Tentativa de acesso inválido",
      details: "Detalhes da tentativa...",
    },
    {
      id: "3",
      timestamp: "10:40 AM",
      level: "error",
      message: "Falha no servidor",
      details: "Detalhes do erro...",
    },
  ]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const renderLogItem = ({ item }: { item: Log }) => (
    <TouchableOpacity
      style={[
        styles.logItem,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => setSelectedLog(item)}
    >
      <View style={styles.logHeader}>
        <Text style={[styles.logTimestamp, { color: colors.textMuted }]}>
          {item.timestamp}
        </Text>
        <Text
          style={[
            styles.logLevel,
            {
              color:
                item.level === "error"
                  ? colors.danger
                  : item.level === "warning"
                    ? colors.warning
                    : colors.success,
            },
          ]}
        >
          {item.level}
        </Text>
      </View>
      <Text style={[styles.logMessage, { color: colors.text }]}>
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      {selectedLog && (
        <View style={[styles.detailModal, { backgroundColor: colors.card }]}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>
            Detalhes do Log
          </Text>
          <Text style={[styles.detailText, { color: colors.textMuted }]}>
            Timestamp: {selectedLog.timestamp}
          </Text>
          <Text style={[styles.detailText, { color: colors.textMuted }]}>
            Level: {selectedLog.level}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Message: {selectedLog.message}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Details: {selectedLog.details}
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={() => setSelectedLog(null)}
          >
            <Text style={[styles.closeButtonText, { color: colors.text }]}>
              Fechar
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 16,
  },
  logItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 12,
  },
  logLevel: {
    fontWeight: "bold",
  },
  logMessage: {
    fontSize: 14,
  },
  detailModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detailText: {
    marginBottom: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    fontWeight: "bold",
  },
});

export default LogsScreen;
