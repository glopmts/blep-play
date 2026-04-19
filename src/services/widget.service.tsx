import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { PlayerWidget } from "../context/widgets/playerWidget";

const WIDGET_STATE_KEY = "widget_last_track";

interface WidgetState {
  title: string;
  artist: string;
  isPlaying: boolean;
}

export async function updatePlayerWidget(state: WidgetState) {
  await AsyncStorage.setItem(WIDGET_STATE_KEY, JSON.stringify(state));

  await requestWidgetUpdate({
    widgetName: "PlayerWidget", // ✅ string — nome registrado no app.config
    renderWidget: () => (
      // ✅ função que retorna JSX
      <PlayerWidget
        title={state.title}
        artist={state.artist}
        isPlaying={state.isPlaying}
      />
    ),
    widgetNotFound: () => {},
  });
}

export async function getLastWidgetState(): Promise<WidgetState | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
