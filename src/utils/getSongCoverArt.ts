import * as FileSystem from "expo-file-system/legacy";

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
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Extrai capa de MP3/ID3v2 */
function extractCoverFromID3(bytes: Uint8Array): string | undefined {
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return undefined;
  }

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

    if (frameId === "APIC" || frameId === "PIC") {
      const frameData = bytes.slice(pos, frameEnd);
      let offset = 1;

      let mimeType: string;
      if (frameId === "PIC") {
        mimeType = String.fromCharCode(
          frameData[1],
          frameData[2],
          frameData[3],
        );
        offset = 4;
      } else {
        let mimeEnd = offset;
        while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0)
          mimeEnd++;
        mimeType = String.fromCharCode(...frameData.slice(offset, mimeEnd));
        offset = mimeEnd + 1;
      }

      offset += 1; // picture type

      const encoding = frameData[0];
      if (encoding === 1 || encoding === 2) {
        while (
          offset + 1 < frameData.length &&
          !(frameData[offset] === 0 && frameData[offset + 1] === 0)
        ) {
          offset += 2;
        }
        offset += 2;
      } else {
        while (offset < frameData.length && frameData[offset] !== 0) offset++;
        offset += 1;
      }

      const imageBytes = frameData.slice(offset);
      if (imageBytes.length === 0) {
        pos = frameEnd;
        continue;
      }

      const mime = mimeType.includes("png")
        ? "image/png"
        : mimeType.includes("jpg") ||
            mimeType.includes("jpeg") ||
            mimeType === "JPG"
          ? "image/jpeg"
          : mimeType || "image/jpeg";

      return `data:${mime};base64,${bytesToBase64(imageBytes)}`;
    }

    pos = frameEnd;
  }

  return undefined;
}

/** Lê string UTF-8 de tamanho fixo */
function readUtf8(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

/** Extrai capa de FLAC (bloco METADATA_BLOCK_PICTURE) */
function extractCoverFromFLAC(bytes: Uint8Array): string | undefined {
  // FLAC começa com "fLaC" (0x66 0x4C 0x61 0x43)
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
      let offset = pos;

      // Picture type (4 bytes) — 3 = Cover (front)
      offset += 4;

      // MIME type length + string
      const mimeLength = readUint32BE(bytes, offset);
      offset += 4;
      const mimeType = readUtf8(bytes, offset, mimeLength);
      offset += mimeLength;

      // Description length + string
      const descLength = readUint32BE(bytes, offset);
      offset += 4 + descLength;

      // Width, Height, Color depth, Color count (4 bytes cada)
      offset += 16;

      // Tamanho dos dados da imagem
      const dataLength = readUint32BE(bytes, offset);
      offset += 4;

      const imageBytes = bytes.slice(offset, offset + dataLength);
      if (imageBytes.length === 0) {
        pos = blockEnd;
        if (isLast) break;
        continue;
      }

      const mime = mimeType || "image/jpeg";
      return `data:${mime};base64,${bytesToBase64(imageBytes)}`;
    }

    pos = blockEnd;
    if (isLast) break;
  }

  return undefined;
}

/** Detecta formato e extrai a capa */
function extractCover(bytes: Uint8Array): string | undefined {
  // ID3v2 (MP3, alguns WAV)
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

export const getSongCoverArt = async (
  fileUri: string,
): Promise<string | undefined> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) return undefined;

    const fileSize = (fileInfo as any).size ?? 0;
    if (fileSize === 0) return undefined;

    const bytesToRead = Math.min(fileSize, 5 * 1024 * 1024); // Lê até 5MB para extrair capa

    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
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
    console.error("Erro ao buscar capa:", error);
    return undefined;
  }
};
