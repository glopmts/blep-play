import { useAlbum } from "@/hooks/useAlbumLocal";
import { useAlbumsGrouped } from "@/hooks/useAlbumsGrouped";
import { AlbumWithDetails, GroupedAlbum } from "@/types/interfaces";
import { createContext, ReactNode, useContext } from "react";

const AlbumsContext = createContext<{
  albums: AlbumWithDetails[];
  groupedAlbums: GroupedAlbum[];
  loadingAlbums: boolean;
  loadingGrouped: boolean;
}>({
  albums: [],
  groupedAlbums: [],
  loadingAlbums: false,
  loadingGrouped: false,
});

export const AlbumsProvider = ({ children }: { children: ReactNode }) => {
  const { albums, loading: loadingAlbums } = useAlbum();
  const { albums: groupedAlbums, loading: loadingGrouped } = useAlbumsGrouped();

  return (
    <AlbumsContext.Provider
      value={{ albums, groupedAlbums, loadingAlbums, loadingGrouped }}
    >
      {children}
    </AlbumsContext.Provider>
  );
};

export const useAlbumsContext = () => useContext(AlbumsContext);
