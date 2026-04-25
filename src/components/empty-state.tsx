import {
  FolderIcon,
  HeartIcon,
  ListMusicIcon,
  MusicIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react-native";
import React, { FC } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { LayoutWithHeader } from "./LayoutWithHeader";

type EmptyStateVariant =
  | "playlist"
  | "library"
  | "favorites"
  | "search"
  | "custom";

type EmptyStateProps = {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: EmptyStateVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  showAction?: boolean;
  customIcon?: React.ReactNode;
};

const getIconByVariant = (variant: EmptyStateVariant, color: string) => {
  const iconProps = { size: 36, color, strokeWidth: 1.5 };

  switch (variant) {
    case "playlist":
      return <ListMusicIcon {...iconProps} />;
    case "library":
      return <FolderIcon {...iconProps} />;
    case "favorites":
      return <HeartIcon {...iconProps} />;
    case "search":
      return <MusicIcon {...iconProps} />;
    default:
      return <SparklesIcon {...iconProps} />;
  }
};

const getDefaultContent = (variant: EmptyStateVariant) => {
  switch (variant) {
    case "playlist":
      return {
        title: "Nenhuma playlist ainda",
        description:
          "Organize suas músicas favoritas\ncriando sua primeira playlist.",
        action: "Criar playlist",
      };
    case "library":
      return {
        title: "Sua biblioteca está vazia",
        description:
          "Adicione músicas, artistas ou álbuns\npara começar sua coleção.",
        action: "Explorar música",
      };
    case "favorites":
      return {
        title: "Sem favoritos",
        description: "Curta suas músicas favoritas\npara vê-las aqui.",
        action: "Descobrir músicas",
      };
    case "search":
      return {
        title: "Nenhum resultado encontrado",
        description: "Tente buscar por outro artista,\nmúsica ou álbum.",
        action: "Buscar novamente",
      };
    default:
      return {
        title: "Nada por aqui ainda",
        description: "Comece adicionando conteúdo\npara ver aparecer por aqui.",
        action: "Começar agora",
      };
  }
};

const EmptyState: FC<EmptyStateProps> = ({
  children,
  title,
  description,
  actionLabel,
  onAction,
  variant = "playlist",
  isLoading = false,
  icon,
  showAction = true,
  customIcon,
}) => {
  const { colors } = useTheme();
  const defaultContent = getDefaultContent(variant);

  const displayTitle = title || defaultContent.title;
  const displayDescription = description || defaultContent.description;
  const displayActionLabel = actionLabel || defaultContent.action;

  return (
    <LayoutWithHeader
      contentClassName="flex-1"
      header={false}
      statusBarOpen={false}
    >
      <View className="flex-1 items-center justify-center gap-6 px-8">
        {/* Icon container */}
        <View className="relative">
          <View className="w-24 h-24 rounded-3xl dark:bg-zinc-800/80 bg-zinc-100/80 items-center justify-center border dark:border-zinc-700/50 border-zinc-200/50 shadow-sm backdrop-blur-sm">
            {customIcon || icon || getIconByVariant(variant, colors.icon)}
          </View>

          {/* Decorative dots */}
          <View className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
            <View className="w-2 h-2 rounded-full bg-primary" />
          </View>
        </View>

        {/* Text content */}
        <View className="items-center gap-2">
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-lg font-semibold dark:text-zinc-100 text-zinc-800">
                Carregando...
              </Text>
            </>
          ) : (
            <>
              <Text className="text-xl font-bold dark:text-zinc-100 text-zinc-800 tracking-tight text-center">
                {displayTitle}
              </Text>
              <Text className="text-sm dark:text-zinc-400 text-zinc-500 text-center leading-relaxed">
                {displayDescription}
              </Text>
            </>
          )}
        </View>

        {/* Action button */}
        {showAction && onAction && !isLoading && (
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.8}
            className="mt-2 px-6 py-3 rounded-full bg-primary flex-row items-center gap-2 shadow-lg shadow-primary/20"
            style={{ backgroundColor: colors.primary }}
          >
            <PlusIcon size={18} color="#000" strokeWidth={2} />
            <Text className="text-black font-semibold text-base">
              {displayActionLabel}
            </Text>
          </TouchableOpacity>
        )}

        {/* Custom children */}
        {children && !isLoading && (
          <View className="mt-4 w-full">{children}</View>
        )}
      </View>
    </LayoutWithHeader>
  );
};

export default EmptyState;
