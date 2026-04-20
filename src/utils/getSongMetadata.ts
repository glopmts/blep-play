import * as FileSystem from "expo-file-system/legacy";
import { formatLyrics } from "./formatLyrics";

export interface SongMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  track?: string;
  lyrics?: string;
  coverArt?: string;
}

function decodeSynchsafe(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

// Decodifica string ID3 respeitando encoding
function decodeID3String(bytes: Uint8Array, encoding: number): string {
  try {
    if (encoding === 0) {
      // ISO-8859-1
      return String.fromCharCode(...bytes)
        .replace(/\x00/g, "")
        .trim();
    }
    if (encoding === 1 || encoding === 2) {
      // UTF-16 com ou sem BOM
      const hasBOM = bytes[0] === 0xff && bytes[1] === 0xfe;
      const start = hasBOM ? 2 : 0;
      let str = "";
      for (let i = start; i + 1 < bytes.length; i += 2) {
        const code = bytes[i] | (bytes[i + 1] << 8);
        if (code === 0) break;
        str += String.fromCharCode(code);
      }
      return str.trim();
    }
    if (encoding === 3) {
      // UTF-8
      const decoder = new TextDecoder("utf-8");
      return decoder.decode(bytes).replace(/\x00/g, "").trim();
    }
  } catch {}
  return String.fromCharCode(...bytes)
    .replace(/\x00/g, "")
    .trim();
}

function extractFromID3(bytes: Uint8Array): SongMetadata {
  const meta: SongMetadata = {};

  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return meta;

  const majorVersion = bytes[3];
  const id3Size = decodeSynchsafe(bytes, 6);
  const id3End = 10 + id3Size;
  let pos = 10;

  while (pos < id3End - 10) {
    const frameIdSize = majorVersion === 2 ? 3 : 4;
    const frameId = String.fromCharCode(...bytes.slice(pos, pos + frameIdSize));

    if (frameId === "\x00\x00\x00\x00") break;

    let frameSize: number;
    if (majorVersion === 2) {
      frameSize =
        (bytes[pos + 3] << 16) | (bytes[pos + 4] << 8) | bytes[pos + 5];
      pos += 6;
    } else if (majorVersion === 4) {
      frameSize = decodeSynchsafe(bytes, pos + 4);
      pos += 10;
    } else {
      frameSize = readUint32BE(bytes, pos + 4);
      pos += 10;
    }

    const frameEnd = pos + frameSize;
    if (frameSize <= 0 || frameEnd > bytes.length) break;

    const frameData = bytes.slice(pos, frameEnd);
    const encoding = frameData[0];
    const content = frameData.slice(1);

    switch (frameId) {
      case "TIT2":
      case "TT2":
        meta.title = decodeID3String(content, encoding);
        break;
      case "TPE1":
      case "TP1":
        meta.artist = decodeID3String(content, encoding);
        break;
      case "TALB":
      case "TAL":
        meta.album = decodeID3String(content, encoding);
        break;
      case "TCON":
      case "TCO":
        meta.genre = decodeID3String(content, encoding);
        break;
      case "TDRC":
      case "TYE":
      case "TYER":
        meta.year = decodeID3String(content, encoding);
        break;
      case "TRCK":
      case "TRK":
        meta.track = decodeID3String(content, encoding);
        break;
      case "APIC":
      case "PIC": {
        let offset = 1;
        if (frameId === "PIC") {
          offset = 4;
        } else {
          let mimeEnd = offset;
          while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0)
            mimeEnd++;
          const mimeType = String.fromCharCode(
            ...frameData.slice(offset, mimeEnd),
          );
          offset = mimeEnd + 1;
          offset += 1; // picture type
          if (encoding === 1 || encoding === 2) {
            while (
              offset + 1 < frameData.length &&
              !(frameData[offset] === 0 && frameData[offset + 1] === 0)
            )
              offset += 2;
            offset += 2;
          } else {
            while (offset < frameData.length && frameData[offset] !== 0)
              offset++;
            offset += 1;
          }
          const imageBytes = frameData.slice(offset);
          if (imageBytes.length > 0) {
            const mime = mimeType.includes("png") ? "image/png" : "image/jpeg";
            meta.coverArt = `data:${mime};base64,${bytesToBase64(imageBytes)}`;
          }
        }
        break;
      }
      case "USLT": {
        // Unsynchronised lyrics tag
        // Estrutura: encoding(1) + language(3) + description + \x00 + lyrics
        let offset = 1; // pula encoding
        offset += 3; // pula language (ex: "eng")
        // pula description até o null terminator
        if (encoding === 1 || encoding === 2) {
          while (
            offset + 1 < content.length &&
            !(content[offset] === 0 && content[offset + 1] === 0)
          )
            offset += 2;
          offset += 2;
        } else {
          while (offset < content.length && content[offset] !== 0) offset++;
          offset += 1;
        }
        meta.lyrics = decodeID3String(content.slice(offset), encoding);
        break;
      }
    }

    pos = frameEnd;
  }

  return meta;
}

function extractFromFLAC(bytes: Uint8Array): SongMetadata {
  const meta: SongMetadata = {};

  if (
    bytes[0] !== 0x66 ||
    bytes[1] !== 0x4c ||
    bytes[2] !== 0x61 ||
    bytes[3] !== 0x43
  )
    return meta;

  let pos = 4;

  while (pos + 4 <= bytes.length) {
    const blockHeader = bytes[pos];
    const isLast = (blockHeader & 0x80) !== 0;
    const blockType = blockHeader & 0x7f;
    const blockSize =
      (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
    pos += 4;
    const blockEnd = pos + blockSize;

    // Tipo 4 = VORBIS_COMMENT (metadados texto do FLAC)
    if (blockType === 4) {
      let offset = pos;
      const vendorLen = readUint32LE(bytes, offset);
      offset += 4 + vendorLen;

      const commentCount = readUint32LE(bytes, offset);
      offset += 4;

      for (let i = 0; i < commentCount; i++) {
        const len = readUint32LE(bytes, offset);
        offset += 4;
        const comment = new TextDecoder("utf-8").decode(
          bytes.slice(offset, offset + len),
        );
        offset += len;

        const eq = comment.indexOf("=");
        if (eq === -1) continue;
        const key = comment.slice(0, eq).toUpperCase();
        const val = comment.slice(eq + 1).trim();

        switch (key) {
          case "TITLE":
            meta.title = val;
            break;
          case "ARTIST":
            meta.artist = val;
            break;
          case "ALBUM":
            meta.album = val;
            break;
          case "GENRE":
            meta.genre = val;
            break;
          case "DATE":
          case "YEAR":
            meta.year = val;
            break;
          case "TRACKNUMBER":
            meta.track = val;
            break;
          case "LYRICS":
          case "UNSYNCEDLYRICS":
            meta.lyrics = val;
            break;
        }
      }
    }

    // Tipo 6 = PICTURE
    if (blockType === 6 && blockSize > 32) {
      let offset = pos + 4; // pula picture type
      const mimeLen = readUint32BE(bytes, offset);
      offset += 4;
      const mimeType = new TextDecoder().decode(
        bytes.slice(offset, offset + mimeLen),
      );
      offset += mimeLen;
      const descLen = readUint32BE(bytes, offset);
      offset += 4 + descLen;
      offset += 16; // width, height, depth, colors
      const dataLen = readUint32BE(bytes, offset);
      offset += 4;
      const imageBytes = bytes.slice(offset, offset + dataLen);
      if (imageBytes.length > 0) {
        meta.coverArt = `data:${mimeType || "image/jpeg"};base64,${bytesToBase64(imageBytes)}`;
      }
    }

    pos = blockEnd;
    if (isLast) break;
  }

  return meta;
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  );
}

export async function getSongMetadata(fileUri: string): Promise<SongMetadata> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) return {};

    const fileSize = (fileInfo as any).size ?? 0;
    if (fileSize === 0) return {};

    // Detecta tamanho do ID3 antes de ler tudo
    const headerB64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: 10,
    });
    const headerBin = atob(headerB64);
    const header = new Uint8Array(headerBin.length);
    for (let i = 0; i < headerBin.length; i++)
      header[i] = headerBin.charCodeAt(i);

    let bytesToRead = Math.min(fileSize, 2 * 1024 * 1024); // 2MB fallback

    // Para MP3: lê exatamente o bloco ID3
    if (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) {
      const id3Size = decodeSynchsafe(header, 6);
      bytesToRead = Math.min(fileSize, id3Size + 10);
    }

    const b64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: bytesToRead,
    });

    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const meta =
      bytes[0] === 0x66 ? extractFromFLAC(bytes) : extractFromID3(bytes);

    return {
      ...meta,
      lyrics: formatLyrics(meta.lyrics),
    };
  } catch (err) {
    console.error("Erro ao ler metadados:", err);
    return {};
  }
}
