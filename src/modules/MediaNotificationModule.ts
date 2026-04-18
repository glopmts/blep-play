import { NativeModules } from "react-native";

interface MediaNotificationModuleInterface {
  showMediaNotification(
    title: string,
    artist: string,
    isPlaying: boolean,
    imageUrl: string,
    onPlayPause: string,
    onNext: string,
    onPrevious: string,
    currentTime?: number,
    duration?: number,
  ): void;
  hideMediaNotification(): void; // ← adicione isso
}

const { MediaNotificationModule } = NativeModules;

export default MediaNotificationModule as MediaNotificationModuleInterface;
