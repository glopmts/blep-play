"use no memo"; // ✅ Desabilita o React Compiler para este arquivo

import {
  FlexWidget,
  ImageWidget,
  TextWidget,
} from "react-native-android-widget";

interface Props {
  title?: string;
  artist?: string;
  isPlaying?: boolean;
}

export function PlayerWidget({
  title = "Nenhuma música",
  artist = "",
  isPlaying = false,
}: Props) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#18181b",
        borderRadius: 20,
        padding: 12,
        flexGap: 12,
      }}
      clickAction="OPEN_APP"
    >
      {/* Capa placeholder */}
      <FlexWidget
        style={{
          width: 72,
          height: 72,
          borderRadius: 12,
          backgroundColor: "#3f3f46",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ImageWidget
          image={require("../../../assets/icon/music-icon.png")}
          imageWidth={40}
          imageHeight={40}
        />
      </FlexWidget>

      {/* Info + controles */}
      <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 6 }}>
        <TextWidget
          text={title}
          style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}
          maxLines={1}
        />
        <TextWidget
          text={artist || "Artista desconhecido"}
          style={{ color: "#a1a1aa", fontSize: 12 }}
          maxLines={1}
        />

        <FlexWidget style={{ flexDirection: "row", flexGap: 16, marginTop: 4 }}>
          <FlexWidget clickAction="PREVIOUS" style={{ padding: 4 }}>
            <ImageWidget
              image={require("../../../assets/icon/skip-back.png")}
              imageWidth={22}
              imageHeight={22}
            />
          </FlexWidget>

          <FlexWidget
            clickAction="PLAY_PAUSE"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#3b82f6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageWidget
              image={
                isPlaying
                  ? require("../../../assets/icon/pause.png")
                  : require("../../../assets/icon/play.png")
              }
              imageWidth={20}
              imageHeight={20}
            />
          </FlexWidget>

          <FlexWidget clickAction="NEXT" style={{ padding: 4 }}>
            <ImageWidget
              image={require("../../../assets/icon/skip-forward.png")}
              imageWidth={22}
              imageHeight={22}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
