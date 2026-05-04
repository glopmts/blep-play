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

  type NaveItem = {
    id: string;
    label: string;
    icon?: React.ReactNode;
  };

  type NaveOptionsProps = {
    id: string | number;
    label: string;
    description?: string;
    infor?: string;
    icon?: ComponentType<{ size: number; color: string }>;
    action?: () => void;
  };

  interface ExternalTrackHint {
    title?: string;
    artist?: string;
    album?: string;
    artworkUri?: string;
  }
}

export {};
