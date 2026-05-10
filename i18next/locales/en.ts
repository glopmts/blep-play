const en = {
  header: {
    home: {
      title: "Hello",
      subtitle: "Control your music in one place",
    },
    playlists: {
      title: "Playlists",
      subtitle: "Your playlists, your way",
    },
    albums: {
      title: "Albums",
      subtitle: "Create and organize your albums",
    },
    configurations: {
      title: "Settings",
      subtitle: "BlepPlay app general settings",
    },
    default: {
      title: "Welcome",
      subtitle: "Welcome to the app",
    },
  },

  greeting: {
    morning: "Good morning 👋",
    afternoon: "Good afternoon 👋",
    night: "Good night 👋",
  },

  playlist: {
    title: "Playlists",
    empty: "No playlists found",
    emptyMusics: "No music in this playlist",
    notFound: "Playlist not found",
    actions: {
      create: "Create Playlist",
      viewDetails: "View details",
      delete: "Delete",
      archive: "Archive",
    },
  },

  music: {
    title: "Music",
    notFound: "Music not found",
    norecent: "No recent music.",
    recent: "Recent music",
    metadata: {
      title: "Title",
      artist: "Artist",
      album: "Album",
      genre: "Genre",
      year: "Year",
      track: "Track",
      filePath: "Folder",
    },
    actions: {
      viewDetails: "View details",
      back: "Back",
      file: "File",
    },
  },

  lyrics: {
    title: "Lyrics",
    unavailable: "Lyrics not available for this song",
    unavailablelyrics: "Lyrics not available",
    actions: {
      view: "View lyrics",
      copy: "Copy lyrics",
    },
    feedback: {
      copied: "Lyrics copied to clipboard!",
      copyError: "Error copying lyrics",
      loading: "Fetching lyrics…",
    },
  },

  cover: {
    actions: {
      add: "Tap to add cover",
      remove: "Remove cover",
      select: "Select cover",
      ok: "Cover removed!",
      removecover: "Do you want to remove the current playlist cover?",
    },
    feedback: {
      removed: "Cover removed successfully",
      error: "Could not save the image",
      coverplaylist: "Playlist cover updated!",
      errorcoverplaylist: "Could not update the playlist cover",
      erroupdate: "An error occurred while updating the image",
    },
  },

  settings: {
    title: "Settings",
    preferences: {
      title: "Preferences",
      theme: "App Theme",
      language: "App Language",
    },
  },

  player: {
    feedback: {
      current: "Playing now",
      pause: "Pause",
      playe: "Play music",
    },
  },

  common: {
    back: "Back",
    delete: "Delete",
    cancel: "Cancel",
    confirm: "Confirm",
    creater: "Create",
    details: "Details",
    file: "File",
    sucess: "Success",
    error: "Error",
  },

  text: {
    feedback: {
      seeless: "See less",
      seemore: "See more",
      errorload: "Error loading",
      refresh: "Try again",
    },
    refeshpage: "Reload page",
  },

  search: {
    feedback: {
      getmusics: "Searching music...",
      loading: "Searching...",
      noresult: "No results found",
      tips: "Try searching by title, artist or album",
    },
  },
};

export default en;
export type Translations = typeof en;
