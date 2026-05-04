package com.glopblog.blepplay

import android.content.ContentUris
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File

class AudioMetadataModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AudioMetadata"

    /**
     * Retorna metadados completos de um URI de áudio.
     * Tenta MediaStore primeiro (rápido, já indexado pelo SO),
     * depois faz fallback para MediaMetadataRetriever (lê tags diretamente).
     *
     * @param uriString URI do arquivo (content://, file://)
     * @param promise   Resolve com WritableMap ou rejeita com erro
     */
    @ReactMethod
    fun getMetadata(uriString: String, promise: Promise) {
        try {
            val uri = Uri.parse(uriString)
            val result = Arguments.createMap()

            // 1ª tentativa: MediaStore (só funciona para content://media/... URIs)
            if (tryMediaStore(uri, result)) {
                promise.resolve(result)
                return
            }

            // 2ª tentativa: MediaMetadataRetriever — lê tags ID3/Vorbis/MP4 do arquivo
            val retriever = MediaMetadataRetriever()

            try {
                reactContext.contentResolver.openFileDescriptor(uri, "r")?.use { pfd ->
                    retriever.setDataSource(pfd.fileDescriptor)
                } ?: run {
                    // file:// path direto
                    retriever.setDataSource(uri.path)
                }

                result.putString(
                    "title",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)
                )
                result.putString(
                    "artist",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)
                )
                result.putString(
                    "album",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)
                )
                result.putString(
                    "albumArtist",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUMARTIST)
                )
                result.putString(
                    "duration",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                )
                result.putString(
                    "year",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_YEAR)
                )
                result.putString(
                    "trackNumber",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER)
                )
                result.putString(
                    "genre",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_GENRE)
                )
                result.putString(
                    "bitrate",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE)
                )
                result.putString(
                    "mimeType",
                    retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_MIMETYPE)
                )

                // Artwork embutida nas tags
                val art = retriever.embeddedPicture
                if (art != null) {
                    val artworkUri = saveArtworkToCache(art)
                    result.putString("artworkUri", artworkUri)
                }

            } finally {
                retriever.release()
            }

            promise.resolve(result)

        } catch (e: Exception) {
            promise.reject("METADATA_ERROR", "Falha ao obter metadados: ${e.message}", e)
        }
    }

    /**
     * Busca metadados via MediaStore para URIs do tipo content://media/...
     * É a forma mais rápida pois os dados já estão indexados pelo Android.
     *
     * @return true se conseguiu resolver, false para tentar fallback
     */
    private fun tryMediaStore(uri: Uri, result: WritableMap): Boolean {
        val authority = uri.authority ?: return false

        // Aceita tanto "media" puro quanto "com.android.providers.media.documents"
        val isMediaUri = authority.contains("media") && !authority.contains("documents")
        if (!isMediaUri) return false

        val projection = arrayOf(
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.ALBUM_ARTIST,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.YEAR,
            MediaStore.Audio.Media.TRACK,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.BITRATE,
            MediaStore.Audio.Media.ALBUM_ID,
        )

        return try {
            reactContext.contentResolver.query(uri, projection, null, null, null)
                ?.use { cursor ->
                    if (!cursor.moveToFirst()) return@use false

                    fun col(name: String) =
                        cursor.getColumnIndexOrThrow(name).let { idx ->
                            if (cursor.isNull(idx)) null else cursor.getString(idx)
                        }

                    result.putString("title",       col(MediaStore.Audio.Media.TITLE))
                    result.putString("artist",      col(MediaStore.Audio.Media.ARTIST))
                    result.putString("album",       col(MediaStore.Audio.Media.ALBUM))
                    result.putString("albumArtist", col(MediaStore.Audio.Media.ALBUM_ARTIST))
                    result.putString("duration",    col(MediaStore.Audio.Media.DURATION))
                    result.putString("year",        col(MediaStore.Audio.Media.YEAR))
                    result.putString("trackNumber", col(MediaStore.Audio.Media.TRACK))
                    result.putString("mimeType",    col(MediaStore.Audio.Media.MIME_TYPE))
                    result.putString("bitrate",     col(MediaStore.Audio.Media.BITRATE))

                    // Artwork via albumart provider (não copia o arquivo, referência direta)
                    val albumIdIdx = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)
                    if (!cursor.isNull(albumIdIdx)) {
                        val albumId = cursor.getLong(albumIdIdx)
                        val artUri = ContentUris.withAppendedId(
                            Uri.parse("content://media/external/audio/albumart"),
                            albumId
                        )
                        result.putString("artworkUri", artUri.toString())
                    }

                    true
                } ?: false
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Salva bytes de artwork no diretório de cache do app.
     * Usa hash dos bytes como nome para evitar duplicatas.
     *
     * @return URI file:// do arquivo salvo
     */
    private fun saveArtworkToCache(bytes: ByteArray): String {
        val cacheDir = reactContext.cacheDir
        val hash = bytes.contentHashCode().toString().replace("-", "n")
        val file = File(cacheDir, "artwork_$hash.jpg")
        if (!file.exists()) {
            file.writeBytes(bytes)
        }
        return file.toURI().toString()
    }
}