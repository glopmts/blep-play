import { useEffect, useState } from "react";
import { getColors } from "react-native-image-colors";

type ArtworkColors = {
  dominant: string | null;
  background: string | null;
  primary: string | null;
};

export function useArtworkColor(artworkUri: string | null | undefined) {
  const [colors, setColors] = useState<ArtworkColors>({
    dominant: null,
    background: null,
    primary: null,
  });

  useEffect(() => {
    if (!artworkUri) {
      setColors({ dominant: null, background: null, primary: null });
      return;
    }

    let cancelled = false;

    getColors(artworkUri, {
      fallback: "#121216",
      cache: true, // cache por URI — não processa de novo
      key: artworkUri,
      quality: "low", // rápido, suficiente pra cor de fundo
    }).then((result) => {
      if (cancelled) return;

      if (result.platform === "android") {
        setColors({
          dominant: result.dominant ?? null,
          background: result.average ?? null,
          primary: result.vibrant ?? null,
        });
      } else if (result.platform === "ios") {
        setColors({
          dominant: result.detail ?? null,
          background: result.background ?? null,
          primary: result.primary ?? null,
        });
      } else if (result.platform === "web") {
        setColors({
          dominant: result.dominant ?? null,
          background: result.dominant ?? null,
          primary: result.vibrant ?? null,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [artworkUri]);

  return colors;
}
