// src/services/widget.task.ts
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { PlayerWidget } from "../context/widgets/playerWidget";
import { getLastWidgetState } from "./widget.service";

const nameToWidget = {
  PlayerWidget,
};

type WidgetActionHandler = (action: string) => void;
let appEventHandler: WidgetActionHandler | null = null;

export function setWidgetAppEventHandler(handler: WidgetActionHandler | null) {
  appEventHandler = handler;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const state = await getLastWidgetState();
      props.renderWidget(
        <PlayerWidget
          title={state?.title}
          artist={state?.artist}
          isPlaying={state?.isPlaying}
        />,
      );
      break;
    }

    case "WIDGET_DELETED":
      break;

    case "WIDGET_CLICK": {
      // ✅ Apenas comunica a ação, sem navegação
      if (appEventHandler && props.clickAction) {
        appEventHandler(props.clickAction);
      }

      // Re-renderiza o widget com o estado atual
      const state = await getLastWidgetState();
      props.renderWidget(
        <PlayerWidget
          title={state?.title}
          artist={state?.artist}
          isPlaying={state?.isPlaying}
        />,
      );
      break;
    }

    default:
      break;
  }
}
