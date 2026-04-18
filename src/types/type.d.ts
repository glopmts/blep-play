declare global {
  interface AppTab {
    name: string;
    title: string;
    icon: ComponentType<LucideProps>;
  }

  interface TabIconProps {
    focused: boolean;
    icon: ComponentType<LucideProps>;
  }

  interface Album {
    id: string;
    title: string;
    assetCount: number;
    coverArt?: string;
    songs: MediaLibrary.Asset[];
  }
}

export {};
