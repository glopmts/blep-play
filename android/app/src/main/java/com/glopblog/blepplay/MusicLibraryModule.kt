package com.glopblog.blepplay

import android.content.ContentUris
import android.os.Build
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File

class MusicLibraryModule(reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext) {

        override fun getName() = "MusicLibrary"

        // ─────────────────────────────────────────────────────────────────────
        // getAlbums — igual ao original
        // ─────────────────────────────────────────────────────────────────────
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
                                                val artworkPath = cursor.getString(artCol)
                                                val coverSource =
                                                        artworkPath
                                                                ?: getFirstTrackPath(
                                                                        resolver,
                                                                        id.toString()
                                                                )
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

        // ─────────────────────────────────────────────────────────────────────
        // getAllTracks — NOVO
        // ─────────────────────────────────────────────────────────────────────
        @ReactMethod
        fun getAllTracks(promise: Promise) {
                try {
                        val resolver = reactApplicationContext.contentResolver
                        val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

                        val projection = buildTrackProjection()
                        val result = Arguments.createArray()

                        resolver.query(
                                        uri,
                                        projection,
                                        null,
                                        null,
                                        "${MediaStore.Audio.Media.TITLE} ASC"
                                )
                                ?.use { cursor ->
                                        fillTracksFromCursor(cursor, uri, result)
                                }

                        promise.resolve(result)
                } catch (e: Exception) {
                        promise.reject("GET_ALL_TRACKS_ERROR", e.message, e)
                }
        }

        // ─────────────────────────────────────────────────────────────────────
        // getTracksByFolder — NOVO
        // ─────────────────────────────────────────────────────────────────────
        @ReactMethod
        fun getTracksByFolder(folderPath: String, promise: Promise) {
                try {
                        val resolver = reactApplicationContext.contentResolver
                        val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

                        val projection = buildTrackProjection()
                        val normalized = folderPath.trimEnd('/')

                        val result = Arguments.createArray()

                        resolver.query(
                                        uri,
                                        projection,
                                        "${MediaStore.Audio.Media.DATA} LIKE ?",
                                        arrayOf("$normalized/%"),
                                        "${MediaStore.Audio.Media.TITLE} ASC"
                                )
                                ?.use { cursor ->
                                        fillTracksFromCursor(cursor, uri, result)
                                }

                        promise.resolve(result)
                } catch (e: Exception) {
                        promise.reject("GET_TRACKS_BY_FOLDER_ERROR", e.message, e)
                }
        }

        // ─────────────────────────────────────────────────────────────────────
        // getMusicFolders — NOVO
        // Lista todas as pastas que contêm áudio indexado pelo MediaStore
        // ─────────────────────────────────────────────────────────────────────
        @ReactMethod
        fun getMusicFolders(promise: Promise) {
                try {
                        val resolver = reactApplicationContext.contentResolver
                        val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
                        val projection = arrayOf(MediaStore.Audio.Media.DATA)

                        val folders = mutableMapOf<String, Int>()

                        resolver.query(uri, projection, null, null, null)?.use { cursor ->
                                val dataCol =
                                        cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)
                                while (cursor.moveToNext()) {
                                        val filePath = cursor.getString(dataCol) ?: continue
                                        val parent = File(filePath).parent ?: continue
                                        folders[parent] = (folders[parent] ?: 0) + 1
                                }
                        }

                        val result = Arguments.createArray()
                        folders.entries
                                .sortedByDescending { it.value }
                                .forEach { (path, count) ->
                                        Arguments.createMap()
                                                .apply {
                                                        putString("path", path)
                                                        putString("name", File(path).name)
                                                        putInt("trackCount", count)
                                                }
                                                .also { result.pushMap(it) }
                                }

                        promise.resolve(result)
                } catch (e: Exception) {
                        promise.reject("GET_MUSIC_FOLDERS_ERROR", e.message, e)
                }
        }

        // ─────────────────────────────────────────────────────────────────────
        // getTracks (por albumId) — igual ao original
        // ─────────────────────────────────────────────────────────────────────
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

        // ─────────────────────────────────────────────────────────────────────
        // getAlbumById — igual ao original
        // ─────────────────────────────────────────────────────────────────────
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
                                                                putNull("coverArt")
                                                        }
                                                songsList.pushMap(songMap)
                                        }
                                }

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

        // ─────────────────────────────────────────────────────────────────────
        // getTrackById — igual ao original
        // ─────────────────────────────────────────────────────────────────────
        @ReactMethod
        fun getTrackById(trackId: String, promise: Promise) {
                try {
                        val resolver = reactApplicationContext.contentResolver
                        val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

                        val projection =
                                mutableListOf(
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
                                        )
                                        .apply {
                                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                                                ) {
                                                        add(MediaStore.Audio.Media.GENRE)
                                                }
                                        }
                                        .toTypedArray()

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

                                                        val genre =
                                                                if (Build.VERSION.SDK_INT >=
                                                                                Build.VERSION_CODES
                                                                                        .R
                                                                ) {
                                                                        val idx =
                                                                                cursor.getColumnIndex(
                                                                                        MediaStore
                                                                                                .Audio
                                                                                                .Media
                                                                                                .GENRE
                                                                                )
                                                                        if (idx != -1)
                                                                                cursor.getString(
                                                                                        idx
                                                                                )
                                                                        else null
                                                                } else {
                                                                        try {
                                                                                val genreUri =
                                                                                        MediaStore
                                                                                                .Audio
                                                                                                .Genres
                                                                                                .getContentUriForAudioId(
                                                                                                        "external",
                                                                                                        id.toInt()
                                                                                                )
                                                                                reactApplicationContext
                                                                                        .contentResolver
                                                                                        .query(
                                                                                                genreUri,
                                                                                                arrayOf(
                                                                                                        MediaStore
                                                                                                                .Audio
                                                                                                                .Genres
                                                                                                                .NAME
                                                                                                ),
                                                                                                null,
                                                                                                null,
                                                                                                null
                                                                                        )
                                                                                        ?.use {
                                                                                                genreCursor
                                                                                                ->
                                                                                                if (genreCursor
                                                                                                                .moveToFirst()
                                                                                                )
                                                                                                        genreCursor
                                                                                                                .getString(
                                                                                                                        genreCursor
                                                                                                                                .getColumnIndexOrThrow(
                                                                                                                                        MediaStore
                                                                                                                                                .Audio
                                                                                                                                                .Genres
                                                                                                                                                .NAME
                                                                                                                                )
                                                                                                                )
                                                                                                else
                                                                                                        null
                                                                                        }
                                                                        } catch (e: Exception) {
                                                                                null
                                                                        }
                                                                }
                                                        putString("genre", genre)
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

        // ─────────────────────────────────────────────────────────────────────
        // getAlbumCover — igual ao original
        // ─────────────────────────────────────────────────────────────────────
        @ReactMethod
        fun getAlbumCover(filePath: String, promise: Promise) {
                try {
                        val retriever = android.media.MediaMetadataRetriever()
                        retriever.setDataSource(filePath)
                        val art = retriever.embeddedPicture
                        retriever.release()

                        if (art != null) {
                                val base64 =
                                        android.util.Base64.encodeToString(
                                                art,
                                                android.util.Base64.NO_WRAP
                                        )
                                promise.resolve(base64)
                        } else {
                                promise.resolve(null)
                        }
                } catch (e: Exception) {
                        promise.resolve(null)
                }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Helpers privados
        // ─────────────────────────────────────────────────────────────────────

        private fun getFirstTrackPath(
                resolver: android.content.ContentResolver,
                albumId: String
        ): String? {
                val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
                val projection = arrayOf(MediaStore.Audio.Media.DATA)
                val selection = "${MediaStore.Audio.Media.ALBUM_ID} = ?"
                return resolver.query(uri, projection, selection, arrayOf(albumId), null)
                        ?.use { cursor ->
                                if (cursor.moveToFirst())
                                        cursor.getString(
                                                cursor.getColumnIndexOrThrow(
                                                        MediaStore.Audio.Media.DATA
                                                )
                                        )
                                else null
                        }
        }

        private fun extractCover(filePath: String): String? {
                return try {
                        val retriever = android.media.MediaMetadataRetriever()
                        retriever.setDataSource(filePath)
                        val art = retriever.embeddedPicture
                        retriever.release()
                        art?.let {
                                android.util.Base64.encodeToString(it, android.util.Base64.NO_WRAP)
                                        .trim()
                        }
                } catch (e: Exception) {
                        null
                }
        }

        /** Projection compartilhada por getAllTracks e getTracksByFolder */
        private fun buildTrackProjection(): Array<String> =
                mutableListOf(
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
                        )
                        .apply {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                        add(MediaStore.Audio.Media.GENRE)
                                        add(MediaStore.Audio.Media.DISC_NUMBER)
                                }
                        }
                        .toTypedArray()

        /** Preenche um WritableArray com todas as linhas do cursor */
        private fun fillTracksFromCursor(
                cursor: android.database.Cursor,
                baseUri: android.net.Uri,
                result: WritableArray
        ) {
                val idCol       = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val titleCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                val artistCol   = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                val albumCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
                val albumIdCol  = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)
                val trackCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TRACK)
                val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                val dataCol     = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)
                val mimeCol     = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)
                val yearCol     = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.YEAR)
                val bitrateCol  = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.BITRATE)
                val sizeCol     = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE)
                val composerCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.COMPOSER)
                val dateCol     = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED)
                val genreCol    = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                                        cursor.getColumnIndex(MediaStore.Audio.Media.GENRE) else -1
                val discCol     = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                                        cursor.getColumnIndex(MediaStore.Audio.Media.DISC_NUMBER) else -1

                while (cursor.moveToNext()) {
                        val id = cursor.getLong(idCol)
                        val albumId = cursor.getLong(albumIdCol)
                        val rawTrack = cursor.getInt(trackCol)

                        Arguments.createMap().apply {
                                putString("id",          id.toString())
                                putString("title",       cursor.getString(titleCol)  ?: "")
                                putString("artist",      cursor.getString(artistCol) ?: "")
                                putString("album",       cursor.getString(albumCol)  ?: "")
                                putString("albumId",     albumId.toString())
                                putInt   ("trackNumber", if (rawTrack >= 1000) rawTrack % 1000 else rawTrack)
                                putDouble("duration",    cursor.getLong(durationCol).toDouble())
                                putString("filePath",    cursor.getString(dataCol)   ?: "")
                                putString("uri",         ContentUris.withAppendedId(baseUri, id).toString())
                                putString("mimeType",    cursor.getString(mimeCol)   ?: "")
                                putInt   ("year",        cursor.getInt(yearCol))
                                putInt   ("bitrate",     cursor.getInt(bitrateCol))
                                putDouble("fileSize",    cursor.getLong(sizeCol).toDouble())
                                putString("composer",    cursor.getString(composerCol) ?: "")
                                putDouble("dateAdded",   cursor.getLong(dateCol).toDouble())
                                if (genreCol >= 0) putString("genre",      cursor.getString(genreCol) ?: "")
                                if (discCol  >= 0) putInt   ("discNumber", cursor.getInt(discCol))
                        }.also { result.pushMap(it) }
                }
        }
}