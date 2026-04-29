package com.glopblog.blepplay

import android.content.ContentUris
import android.os.Build
import android.provider.MediaStore
import com.facebook.react.bridge.*

class MusicLibraryModule(reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext) {

        override fun getName() = "MusicLibrary"

        @ReactMethod
        fun getAlbums(promise: Promise) {
                try {
                        val resolver = reactApplicationContext.contentResolver
                        val uri = MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI

                        val projection =
                                arrayOf(
                                        MediaStore.Audio.Albums._ID,
                                        MediaStore.Audio.Albums.ALBUM,
                                        MediaStore.Audio.Albums.ARTIST,
                                        MediaStore.Audio.Albums.NUMBER_OF_SONGS,
                                        MediaStore.Audio.Albums.LAST_YEAR,
                                        MediaStore.Audio.Albums.ALBUM_ART,
                                )

                        val result = Arguments.createArray()

                        resolver.query(
                                        uri,
                                        projection,
                                        null,
                                        null,
                                        "${MediaStore.Audio.Albums.ALBUM} ASC"
                                )
                                ?.use { cursor ->
                                        val idCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Albums._ID
                                                )
                                        val albumCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Albums.ALBUM
                                                )
                                        val artistCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Albums.ARTIST
                                                )
                                        val songsCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Albums.NUMBER_OF_SONGS
                                                )
                                        val yearCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Albums.LAST_YEAR
                                                )
                                        val artCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Albums.ALBUM_ART
                                                )

                                        while (cursor.moveToNext()) {
                                                val id = cursor.getLong(idCol)

                                                // 1. Tenta artworkPath do MediaStore primeiro (mais
                                                // rápido)
                                                val artworkPath = cursor.getString(artCol)

                                                // 2. Se não tiver, pega o filePath da primeira
                                                // faixa do álbum
                                                val coverSource =
                                                        artworkPath
                                                                ?: getFirstTrackPath(
                                                                        resolver,
                                                                        id.toString()
                                                                )

                                                // 3. Extrai base64 da capa
                                                val artworkBase64 =
                                                        coverSource?.let { extractCover(it) }

                                                val map =
                                                        Arguments.createMap().apply {
                                                                putString("id", id.toString())
                                                                putString(
                                                                        "album",
                                                                        cursor.getString(albumCol)
                                                                )
                                                                putString(
                                                                        "artist",
                                                                        cursor.getString(artistCol)
                                                                )
                                                                putInt(
                                                                        "numberOfSongs",
                                                                        cursor.getInt(songsCol)
                                                                )
                                                                putInt(
                                                                        "year",
                                                                        cursor.getInt(yearCol)
                                                                )
                                                                // mantém os campos antigos por
                                                                // compatibilidade
                                                                putString(
                                                                        "artworkPath",
                                                                        artworkPath
                                                                )
                                                                if (Build.VERSION.SDK_INT >=
                                                                                Build.VERSION_CODES
                                                                                        .Q
                                                                ) {
                                                                        putString(
                                                                                "artworkUri",
                                                                                ContentUris
                                                                                        .withAppendedId(
                                                                                                MediaStore
                                                                                                        .Audio
                                                                                                        .Albums
                                                                                                        .EXTERNAL_CONTENT_URI,
                                                                                                id
                                                                                        )
                                                                                        .toString()
                                                                        )
                                                                } else {
                                                                        putNull("artworkUri")
                                                                }
                                                                // novo campo com base64 pronto para
                                                                // usar em <Image>
                                                                if (artworkBase64 != null) {
                                                                        putString(
                                                                                "artworkBase64",
                                                                                artworkBase64
                                                                        )
                                                                } else {
                                                                        putNull("artworkBase64")
                                                                }
                                                        }
                                                result.pushMap(map)
                                        }
                                }

                        promise.resolve(result)
                } catch (e: Exception) {
                        promise.reject("GET_ALBUMS_ERROR", e.message, e)
                }
        }

        // Retorna o caminho do arquivo da primeira faixa do álbum
        private fun getFirstTrackPath(
                resolver: android.content.ContentResolver,
                albumId: String
        ): String? {
                val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
                val projection = arrayOf(MediaStore.Audio.Media.DATA)
                val selection = "${MediaStore.Audio.Media.ALBUM_ID} = ?"

                return resolver.query(uri, projection, selection, arrayOf(albumId), null)?.use {
                        cursor ->
                        if (cursor.moveToFirst())
                                cursor.getString(
                                        cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)
                                )
                        else null
                }
        }

        // Extrai a capa embedded do arquivo de áudio como data URI base64
        private fun extractCover(filePath: String): String? {
                return try {
                        val retriever = android.media.MediaMetadataRetriever()
                        retriever.setDataSource(filePath)
                        val art = retriever.embeddedPicture
                        retriever.release()
                        art?.let {
            android.util.Base64.encodeToString(it, android.util.Base64.NO_WRAP).trim()
        }
                } catch (e: Exception) {
                        null
                }
        }

        @ReactMethod
        fun getAlbumCover(filePath: String, promise: Promise) {
                try {
                        val retriever = android.media.MediaMetadataRetriever()
                        retriever.setDataSource(filePath)
                        val art = retriever.embeddedPicture
                        retriever.release()

                       if (art != null) {
            val base64 = android.util.Base64.encodeToString(art, android.util.Base64.NO_WRAP)
            promise.resolve(base64)  // Remove o prefixo data URI
                        } else {
                                promise.resolve(null)
                        }
                } catch (e: Exception) {
                        promise.resolve(null)
                }
        }

        @ReactMethod
        fun getAlbumById(albumId: String, promise: Promise) {
                try {
                        val resolver = reactApplicationContext.contentResolver
                        val mediaUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

                        val projection =
                                arrayOf(
                                                MediaStore.Audio.Media._ID,
                                                MediaStore.Audio.Media.TITLE,
                                                MediaStore.Audio.Media.ARTIST,
                                                MediaStore.Audio.Media.ALBUM,
                                                MediaStore.Audio.Media.ALBUM_ID,
                                                MediaStore.Audio.Media.TRACK,
                                                MediaStore.Audio.Media.DURATION,
                                                MediaStore.Audio.Media.DATA,
                                                MediaStore.Audio.Media.MIME_TYPE,
                                                MediaStore.Audio.Media.YEAR,
                                                MediaStore.Audio.Media.BITRATE,
                                                MediaStore.Audio.Media.SIZE,
                                                MediaStore.Audio.Media.COMPOSER,
                                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                                                        MediaStore.Audio.Media.GENRE
                                                else null,
                                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                                                        MediaStore.Audio.Media.DISC_NUMBER
                                                else null,
                                        )
                                        .filterNotNull()
                                        .toTypedArray()

                        val songsList = Arguments.createArray()
                        val albumMap = Arguments.createMap()

                        var albumName = ""
                        var artistName = ""
                        var year = 0
                        var firstFilePath: String? = null

                        resolver.query(
                                        mediaUri,
                                        projection,
                                        "${MediaStore.Audio.Media.ALBUM_ID} = ?",
                                        arrayOf(albumId),
                                        "${MediaStore.Audio.Media.TRACK} ASC"
                                )
                                ?.use { cursor ->
                                        val idCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media._ID
                                                )
                                        val titleCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.TITLE
                                                )
                                        val artistCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.ARTIST
                                                )
                                        val albumCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.ALBUM
                                                )
                                        val trackCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.TRACK
                                                )
                                        val durationCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.DURATION
                                                )
                                        val dataCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.DATA
                                                )
                                        val mimeCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.MIME_TYPE
                                                )
                                        val yearCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.YEAR
                                                )
                                        val bitrateCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.BITRATE
                                                )
                                        val sizeCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.SIZE
                                                )
                                        val composerCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.COMPOSER
                                                )

                                        var isFirst = true
                                        while (cursor.moveToNext()) {
                                                val id = cursor.getLong(idCol)
                                                val filePath = cursor.getString(dataCol)
                                                val rawTrack = cursor.getInt(trackCol)

                                                if (isFirst) {
                                                        albumName = cursor.getString(albumCol) ?: ""
                                                        artistName =
                                                                cursor.getString(artistCol) ?: ""
                                                        year = cursor.getInt(yearCol)
                                                        firstFilePath = filePath
                                                        isFirst = false
                                                }

                                                val songMap =
                                                        Arguments.createMap().apply {
                                                                putString("id", id.toString())
                                                                putString(
                                                                        "title",
                                                                        cursor.getString(titleCol)
                                                                )
                                                                putString(
                                                                        "artist",
                                                                        cursor.getString(artistCol)
                                                                )
                                                                putString("album", albumName)
                                                                putString("albumId", albumId)
                                                                putInt(
                                                                        "trackNumber",
                                                                        if (rawTrack >= 1000)
                                                                                rawTrack % 1000
                                                                        else rawTrack
                                                                )
                                                                putDouble(
                                                                        "duration",
                                                                        cursor.getLong(durationCol)
                                                                                .toDouble()
                                                                )
                                                                putString("filePath", filePath)
                                                                putString(
                                                                        "uri",
                                                                        ContentUris.withAppendedId(
                                                                                        mediaUri,
                                                                                        id
                                                                                )
                                                                                .toString()
                                                                )
                                                                putString(
                                                                        "mimeType",
                                                                        cursor.getString(mimeCol)
                                                                )
                                                                putInt(
                                                                        "year",
                                                                        cursor.getInt(yearCol)
                                                                )
                                                                putInt(
                                                                        "bitrate",
                                                                        cursor.getInt(bitrateCol)
                                                                )
                                                                putDouble(
                                                                        "fileSize",
                                                                        cursor.getLong(sizeCol)
                                                                                .toDouble()
                                                                )
                                                                putString(
                                                                        "composer",
                                                                        cursor.getString(
                                                                                composerCol
                                                                        )
                                                                )
                                                                // Sem coverArt por faixa — fica
                                                                // null, usa a do álbum
                                                                putNull("coverArt")
                                                        }
                                                songsList.pushMap(songMap)
                                        }
                                }

                        // Capa: uma vez só, da primeira faixa
                        val artworkBase64 = firstFilePath?.let { extractCover(it) }

                        albumMap.apply {
                                putString("id", albumId)
                                putString("album", albumName)
                                putString("artist", artistName)
                                putInt("year", year)
                                putInt("numberOfSongs", songsList.size())
                                if (artworkBase64 != null) putString("artworkBase64", artworkBase64)
                                else putNull("artworkBase64")
                                putArray("songs", songsList)
                        }

                        promise.resolve(albumMap)
                } catch (e: Exception) {
                        promise.reject("GET_ALBUM_ERROR", e.message, e)
                }
        }

        @ReactMethod
        fun getTrackById(trackId: String, promise: Promise) {
                try {
                        val resolver = reactApplicationContext.contentResolver
                        val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

                        val projection =
                                arrayOf(
                                        MediaStore.Audio.Media._ID,
                                        MediaStore.Audio.Media.TITLE,
                                        MediaStore.Audio.Media.ARTIST,
                                        MediaStore.Audio.Media.ALBUM,
                                        MediaStore.Audio.Media.ALBUM_ID,
                                        MediaStore.Audio.Media.TRACK,
                                        MediaStore.Audio.Media.DURATION,
                                        MediaStore.Audio.Media.DATA,
                                        MediaStore.Audio.Media.MIME_TYPE,
                                        MediaStore.Audio.Media.YEAR,
                                        MediaStore.Audio.Media.BITRATE,
                                        MediaStore.Audio.Media.SIZE,
                                        MediaStore.Audio.Media.COMPOSER,
                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                                                MediaStore.Audio.Media.GENRE
                                        else MediaStore.Audio.Media.ARTIST,
                                )

                        resolver.query(
                                        uri,
                                        projection,
                                        "${MediaStore.Audio.Media._ID} = ?",
                                        arrayOf(trackId),
                                        null
                                )
                                ?.use { cursor ->
                                        if (!cursor.moveToFirst()) {
                                                promise.resolve(null)
                                                return
                                        }

                                        val id =
                                                cursor.getLong(
                                                        cursor.getColumnIndexOrThrow(
                                                                MediaStore.Audio.Media._ID
                                                        )
                                                )
                                        val filePath =
                                                cursor.getString(
                                                        cursor.getColumnIndexOrThrow(
                                                                MediaStore.Audio.Media.DATA
                                                        )
                                                )
                                        val rawTrack =
                                                cursor.getInt(
                                                        cursor.getColumnIndexOrThrow(
                                                                MediaStore.Audio.Media.TRACK
                                                        )
                                                )

                                        // Extrai capa embedded
                                        val coverBase64 = extractCover(filePath)

                                        val map =
                                                Arguments.createMap().apply {
                                                        putString("id", id.toString())
                                                        putString(
                                                                "title",
                                                                cursor.getString(
                                                                        cursor.getColumnIndexOrThrow(
                                                                                MediaStore.Audio
                                                                                        .Media.TITLE
                                                                        )
                                                                )
                                                        )
                                                        putString(
                                                                "artist",
                                                                cursor.getString(
                                                                        cursor.getColumnIndexOrThrow(
                                                                                MediaStore.Audio
                                                                                        .Media
                                                                                        .ARTIST
                                                                        )
                                                                )
                                                        )
                                                        putString(
                                                                "album",
                                                                cursor.getString(
                                                                        cursor.getColumnIndexOrThrow(
                                                                                MediaStore.Audio
                                                                                        .Media.ALBUM
                                                                        )
                                                                )
                                                        )
                                                        putString(
                                                                "albumId",
                                                                cursor.getString(
                                                                        cursor.getColumnIndexOrThrow(
                                                                                MediaStore.Audio
                                                                                        .Media
                                                                                        .ALBUM_ID
                                                                        )
                                                                )
                                                        )
                                                        putInt(
                                                                "trackNumber",
                                                                if (rawTrack >= 1000)
                                                                        rawTrack % 1000
                                                                else rawTrack
                                                        )
                                                        putDouble(
                                                                "duration",
                                                                cursor.getLong(
                                                                                cursor.getColumnIndexOrThrow(
                                                                                        MediaStore
                                                                                                .Audio
                                                                                                .Media
                                                                                                .DURATION
                                                                                )
                                                                        )
                                                                        .toDouble()
                                                        )
                                                        putString("filePath", filePath)
                                                        putString(
                                                                "uri",
                                                                ContentUris.withAppendedId(uri, id)
                                                                        .toString()
                                                        )
                                                        putString(
                                                                "mimeType",
                                                                cursor.getString(
                                                                        cursor.getColumnIndexOrThrow(
                                                                                MediaStore.Audio
                                                                                        .Media
                                                                                        .MIME_TYPE
                                                                        )
                                                                )
                                                        )
                                                        putInt(
                                                                "year",
                                                                cursor.getInt(
                                                                        cursor.getColumnIndexOrThrow(
                                                                                MediaStore.Audio
                                                                                        .Media.YEAR
                                                                        )
                                                                )
                                                        )
                                                        putInt(
                                                                "bitrate",
                                                                cursor.getInt(
                                                                        cursor.getColumnIndexOrThrow(
                                                                                MediaStore.Audio
                                                                                        .Media
                                                                                        .BITRATE
                                                                        )
                                                                )
                                                        )
                                                        putDouble(
                                                                "fileSize",
                                                                cursor.getLong(
                                                                                cursor.getColumnIndexOrThrow(
                                                                                        MediaStore
                                                                                                .Audio
                                                                                                .Media
                                                                                                .SIZE
                                                                                )
                                                                        )
                                                                        .toDouble()
                                                        )
                                                        putString(
                                                                "composer",
                                                                cursor.getString(
                                                                        cursor.getColumnIndexOrThrow(
                                                                                MediaStore.Audio
                                                                                        .Media
                                                                                        .COMPOSER
                                                                        )
                                                                )
                                                        )
                                                        if (coverBase64 != null)
                                                                putString("coverArt", coverBase64)
                                                        else putNull("coverArt")
                                                }

                                        promise.resolve(map)
                                }
                                ?: promise.resolve(null)
                } catch (e: Exception) {
                        promise.reject("GET_TRACK_ERROR", e.message, e)
                }
        }

        @ReactMethod
        fun getTracks(albumId: String, promise: Promise) {
                try {
                        val resolver = reactApplicationContext.contentResolver
                        val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

                        val projection =
                                arrayOf(
                                                MediaStore.Audio.Media._ID,
                                                MediaStore.Audio.Media.TITLE,
                                                MediaStore.Audio.Media.ARTIST,
                                                MediaStore.Audio.Media.ALBUM,
                                                MediaStore.Audio.Media.ALBUM_ID,
                                                MediaStore.Audio.Media.TRACK,
                                                MediaStore.Audio.Media.DURATION,
                                                MediaStore.Audio.Media.DATA,
                                                MediaStore.Audio.Media.MIME_TYPE,
                                                MediaStore.Audio.Media.YEAR,
                                                MediaStore.Audio.Media.BITRATE,
                                                MediaStore.Audio.Media.SIZE,
                                                MediaStore.Audio.Media.COMPOSER,
                                                MediaStore.Audio.Media.DATE_ADDED,
                                                // API 30+ — envolva em if necessário
                                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                                                        MediaStore.Audio.Media.GENRE
                                                else null,
                                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                                                        MediaStore.Audio.Media.DISC_NUMBER
                                                else null,
                                        )
                                        .filterNotNull()
                                        .toTypedArray()

                        val result = Arguments.createArray()

                        resolver.query(
                                        uri,
                                        projection,
                                        "${MediaStore.Audio.Media.ALBUM_ID} = ?",
                                        arrayOf(albumId),
                                        "${MediaStore.Audio.Media.TRACK} ASC"
                                )
                                ?.use { cursor ->
                                        val idCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media._ID
                                                )
                                        val titleCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.TITLE
                                                )
                                        val artistCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.ARTIST
                                                )
                                        val trackCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.TRACK
                                                )
                                        val durationCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.DURATION
                                                )
                                        val dataCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.DATA
                                                )
                                        val mimeCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.MIME_TYPE
                                                )
                                        val yearCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.YEAR
                                                )
                                        val bitrateCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.BITRATE
                                                )
                                        val sizeCol =
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.SIZE
                                                )

                                        while (cursor.moveToNext()) {
                                                val id = cursor.getLong(idCol)
                                                val map =
                                                        Arguments.createMap().apply {
                                                                putString("id", id.toString())
                                                                putString(
                                                                        "title",
                                                                        cursor.getString(titleCol)
                                                                )
                                                                putString(
                                                                        "artist",
                                                                        cursor.getString(artistCol)
                                                                )
                                                                putInt(
                                                                        "trackNumber",
                                                                        cursor.getInt(trackCol)
                                                                )
                                                                putDouble(
                                                                        "duration",
                                                                        cursor.getLong(durationCol)
                                                                                .toDouble()
                                                                )
                                                                putString(
                                                                        "filePath",
                                                                        cursor.getString(dataCol)
                                                                )
                                                                putString(
                                                                        "uri",
                                                                        ContentUris.withAppendedId(
                                                                                        uri,
                                                                                        id
                                                                                )
                                                                                .toString()
                                                                )
                                                                putString(
                                                                        "mimeType",
                                                                        cursor.getString(mimeCol)
                                                                )
                                                                putInt(
                                                                        "year",
                                                                        cursor.getInt(yearCol)
                                                                )
                                                                putInt(
                                                                        "bitrate",
                                                                        cursor.getInt(bitrateCol)
                                                                )
                                                                putDouble(
                                                                        "fileSize",
                                                                        cursor.getLong(sizeCol)
                                                                                .toDouble()
                                                                )
                                                        }
                                                result.pushMap(map)
                                        }
                                }

                        promise.resolve(result)
                } catch (e: Exception) {
                        promise.reject("GET_TRACKS_ERROR", e.message, e)
                }
        }
}
