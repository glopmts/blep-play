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

  plalist: {
    title: "Playlists",
    empty: "No playlists found",
    emptyMusics: "No music in this playlist",
    notFound: "Playlist not found",
    actions: {
      create: "Create Playlist",
      viewDetails: "View details",
      delete: "Delete",
      deleteplaylis: "Delete playlist",
      archive: "Archive",
    },
  },

  music: {
    title: "Music",
    notFound: "Music not found",
    norecent: "No recent music.",
    recent: "Recent Music",
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
    subtitle: "BlepPlay app general settings",
    options: {
      localLibrary: {
        label: "Local Library",
        description:
          "Manage all data stored in the device cache and local audio folder.",
      },
      privacy: {
        label: "Privacy Settings",
        description:
          "Manage your privacy settings, personal data, notifications, etc.",
      },
      appPreferences: {
        label: "App Preferences",
        description:
          "Manage your in-app preferences such as language, theme, etc.",
      },
      cacheManager: {
        label: "Manage Cache Data",
        description: "Manage all data stored in cache.",
      },
      checkUpdate: {
        label: "Check for Updates",
        description: "Tap here to check for new updates",
      },
    },
    support: {
      sectionTitle: "Support",
      helpCenter: {
        label: "Help Center",
        description: "Get answers and find solutions",
      },
      terms: {
        label: "Terms & Policies",
        description: "Read our terms of use and privacy policy",
      },
    },
    footer: {
      currentVersion: "Current app version:",
    },
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
      seeall: "See all",
      viewdetails: "View details",
      errorload: "Error loading",
      refresh: "Try again",
      albumsload: "Loading more albums...",
      albumtitlehome: "Device Albums",
      totalsongs: "Total songs",
    },
    refeshpage: "Reload page",
  },

  tabs: {
    tabsselector: {
      label1: "Home",
      label2: "Music list",
      label3: "My playlists",
      label4: "Downloaded",
    },
  },

  search: {
    feedback: {
      getmusics: "Search music...",
      loading: "Searching...",
      noresult: "No results found",
      albumsearch: "Search album, artist...",
      tips: "Try searching by title, artist or album",
    },
  },
};

export default en;
export type Translations = typeof en;
