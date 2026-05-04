import { AlbumIcon, Home, List, Search, Settings } from "lucide-react-native";

///Tabs actions navegation
export const tabs: AppTab[] = [
  { name: "index", title: "Home", icon: Home },
  { name: "albums", title: "Albums", icon: AlbumIcon },
  { name: "search-web", title: "Online", icon: Search },
  { name: "playlists", title: "Playlists", icon: List },
  { name: "configurations", title: "Configuração", icon: Settings },
];
