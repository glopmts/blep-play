// Wrapper global — coloque no _layout.tsx raiz do Expo Router

import { SetupService } from "@/services/playback.service";
import { useEffect, useRef } from "react";

// Serviço de background — crie este arquivo separado
// services/trackPlayerService.ts
/*
import TrackPlayer, { Event } from "react-native-track-player";

module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
};
*/

export function PlayerSetup({ children }: { children: React.ReactNode }) {
  const isSetup = useRef(false);

  useEffect(() => {
    if (!isSetup.current) {
      isSetup.current = true;
      SetupService();
    }
    return () => {
      // Não destrua o player no unmount do layout raiz
    };
  }, []);

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUÇÕES DE INSTALAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. Instalar dependências:
//    npx expo install react-native-track-player
//    npx expo install @miblanchard/react-native-slider
//    npx expo install expo-blur
//
// 2. No app.json / app.config.js adicionar o plugin:
//    {
//      "plugins": [
//        ["react-native-track-player", { ... }]
//      ]
//    }
//
// 3. Criar o serviço de background em:
//    services/trackPlayerService.ts  (código comentado acima)
//
// 4. Registrar o serviço no entry point (index.ts ou _layout.tsx):
//    import TrackPlayer from "react-native-track-player";
//    import { PlaybackService } from "@/services/trackPlayerService";
//    TrackPlayer.registerPlaybackService(() => PlaybackService);
//
// 5. No _layout.tsx raiz, envolva com <PlayerSetup>:
//    import { PlayerSetup } from "@/contexts/PlayerContext";
//    export default function RootLayout() {
//      return (
//        <PlayerSetup>
//          <Stack />
//          <MiniPlayer />   {/* aparece em toda a app */}
//        </PlayerSetup>
//      );
//    }
//
// 6. Adicionar a rota /player no Expo Router:
//    - Copie player.tsx para app/player.tsx
//    - O Expo Router a detecta automaticamente
//
// 7. Build nativo obrigatório (não funciona no Expo Go):
//    npx expo run:android
//    npx expo run:ios
//
// ─────────────────────────────────────────────────────────────────────────────
// FLUXO DE USO
// ─────────────────────────────────────────────────────────────────────────────
//
//  AlbumDetails
//    └─ clique na música → playSongs(songs, index) → router.push("/player")
//
//  MiniPlayer (global, sempre visível)
//    └─ clique → router.push("/player")
//
//  PlayerScreen (/player)
//    └─ artwork, título, artista, slider de progresso, controles completos
