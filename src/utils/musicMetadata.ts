export interface ExtractedMetadata {
  title: string;
  artist: string; // artista principal (primeiro da lista)
  allArtists: string[]; // todos os artistas
  albumName: string; // nome do "álbum virtual" = artista principal
}

// Extrai artista e título do filename
export const extractMusicMetadata = (filename: string): ExtractedMetadata => {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Padrão: "Título - Artista1, Artista2, ..."
  const separatorIndex = nameWithoutExt.lastIndexOf(" - ");

  let title = nameWithoutExt;
  let rawArtists = "Artista desconhecido";

  if (separatorIndex !== -1) {
    title = nameWithoutExt.substring(0, separatorIndex).trim();
    rawArtists = nameWithoutExt.substring(separatorIndex + 3).trim();
  }

  // Divide artistas pela vírgula
  const allArtists = rawArtists
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  // Artista principal = primeiro da lista
  const artist = allArtists[0] ?? "Artista desconhecido";

  // Álbum virtual = nome do artista principal
  const albumName = artist;

  return { title, artist, albumName, allArtists };
};

// Gera um ID único para o álbum baseado no artista e nome
export const generateAlbumId = (artist: string): string => {
  return artist
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};
