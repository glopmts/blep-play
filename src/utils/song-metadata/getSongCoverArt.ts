import * as FileSystem from "expo-file-system/legacy";

const MAX_READ_BYTES = 20 * 1024 * 1024;

// ─── Helpers binários

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

/**
 * Converte Uint8Array → base64 usando chunks para evitar stack overflow
 * em imagens grandes (~2MB+).
 */
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function normalizeMime(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("png")) return "image/png";
  if (lower.includes("gif")) return "image/gif";
  if (lower.includes("webp")) return "image/webp";
  // jpeg / jpg / JPG / qualquer outro → fallback jpeg
  return "image/jpeg";
}

// ─── Parsers de formato

function extractCoverFromID3(bytes: Uint8Array): string | undefined {
  // Assinatura "ID3"
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return undefined;
  }

  const majorVersion = bytes[3];
  const id3Size = decodeSynchsafe(bytes, 6);
  const id3End = Math.min(10 + id3Size, bytes.length);

  let pos = 10;

  while (pos + 10 < id3End) {
    const frameIdSize = majorVersion === 2 ? 3 : 4;

    // Fim dos frames (padding de zeros)
    if (bytes[pos] === 0) break;

    const frameId = String.fromCharCode(
      ...bytes.subarray(pos, pos + frameIdSize),
    );

    let frameSize: number;
    let headerSize: number;

    if (majorVersion === 2) {
      frameSize =
        (bytes[pos + 3] << 16) | (bytes[pos + 4] << 8) | bytes[pos + 5];
      headerSize = 6;
    } else if (majorVersion === 4) {
      frameSize = decodeSynchsafe(bytes, pos + 4);
      headerSize = 10;
    } else {
      frameSize = readUint32BE(bytes, pos + 4);
      headerSize = 10;
    }

    pos += headerSize;
    const frameEnd = Math.min(pos + frameSize, bytes.length);

    if (frameId === "APIC" || frameId === "PIC") {
      const frameData = bytes.subarray(pos, frameEnd);
      let offset = 1; // pula encoding byte

      let mimeType: string;
      if (frameId === "PIC") {
        // ID3v2.2: 3 bytes fixos para formato (p.ex. "JPG", "PNG")
        mimeType = String.fromCharCode(
          frameData[1],
          frameData[2],
          frameData[3],
        );
        offset = 4;
      } else {
        // ID3v2.3/2.4: MIME terminado em \0
        let mimeEnd = offset;
        while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0)
          mimeEnd++;
        mimeType = String.fromCharCode(...frameData.subarray(offset, mimeEnd));
        offset = mimeEnd + 1;
      }

      offset += 1; // picture type byte

      // Pula descrição (encoding-aware)
      const encoding = frameData[0];
      if (encoding === 1 || encoding === 2) {
        // UTF-16: termina em \0\0
        while (
          offset + 1 < frameData.length &&
          !(frameData[offset] === 0 && frameData[offset + 1] === 0)
        ) {
          offset += 2;
        }
        offset += 2;
      } else {
        // Latin-1 / UTF-8: termina em \0
        while (offset < frameData.length && frameData[offset] !== 0) offset++;
        offset += 1;
      }

      const imageBytes = frameData.subarray(offset);
      if (imageBytes.length === 0) {
        pos = frameEnd;
        continue;
      }

      return `data:${normalizeMime(mimeType)};base64,${bytesToBase64(imageBytes)}`;
    }

    pos = frameEnd;
  }

  return undefined;
}

function extractCoverFromFLAC(bytes: Uint8Array): string | undefined {
  // Assinatura "fLaC"
  if (
    bytes[0] !== 0x66 ||
    bytes[1] !== 0x4c ||
    bytes[2] !== 0x61 ||
    bytes[3] !== 0x43
  ) {
    return undefined;
  }

  let pos = 4;

  while (pos + 4 <= bytes.length) {
    const blockHeader = bytes[pos];
    const isLast = (blockHeader & 0x80) !== 0;
    const blockType = blockHeader & 0x7f;
    const blockSize =
      (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];

    pos += 4;
    const blockEnd = pos + blockSize;

    // Tipo 6 = METADATA_BLOCK_PICTURE
    if (blockType === 6 && blockSize > 32) {
      let offset = pos + 4; // pula picture type

      const mimeLength = readUint32BE(bytes, offset);
      offset += 4;
      const mimeType = String.fromCharCode(
        ...bytes.subarray(offset, offset + mimeLength),
      );
      offset += mimeLength;

      const descLength = readUint32BE(bytes, offset);
      offset += 4 + descLength;

      offset += 16; // width, height, color depth, color count

      const dataLength = readUint32BE(bytes, offset);
      offset += 4;

      const imageBytes = bytes.subarray(offset, offset + dataLength);
      if (imageBytes.length === 0) {
        pos = blockEnd;
        if (isLast) break;
        continue;
      }

      return `data:${normalizeMime(mimeType)};base64,${bytesToBase64(imageBytes)}`;
    }

    pos = blockEnd;
    if (isLast) break;
  }

  return undefined;
}

function extractCover(bytes: Uint8Array): string | undefined {
  // ID3v2 (MP3, AAC embalado, alguns WAV)
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return extractCoverFromID3(bytes);
  }
  // FLAC
  if (
    bytes[0] === 0x66 &&
    bytes[1] === 0x4c &&
    bytes[2] === 0x61 &&
    bytes[3] === 0x43
  ) {
    return extractCoverFromFLAC(bytes);
  }
  return undefined;
}

// ─── API Públic

export const getSongCoverArt = async (
  fileUri: string,
): Promise<string | undefined> => {
  let tmpPath: string | null = null;

  try {
    let readableUri = fileUri;

    // content:// não é legível diretamente pelo FileSystem
    if (fileUri.startsWith("content://")) {
      tmpPath = `${FileSystem.cacheDirectory}tmp_audio_${Date.now()}.audio`;
      await FileSystem.copyAsync({ from: fileUri, to: tmpPath });
      readableUri = tmpPath;
    }

    const fileInfo = await FileSystem.getInfoAsync(readableUri);
    if (!fileInfo.exists) return undefined;

    const fileSize = (fileInfo as { size?: number }).size ?? 0;
    if (fileSize === 0) return undefined;

    const bytesToRead = Math.min(fileSize, MAX_READ_BYTES);

    const base64Data = await FileSystem.readAsStringAsync(readableUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: bytesToRead,
    });

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return extractCover(bytes);
  } catch (error) {
    console.error("[getSongCoverArt] Erro:", error);
    return undefined;
  } finally {
    // Limpa o arquivo temporário sempre
    if (tmpPath) {
      await FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(
        () => {},
      );
    }
  }
};
