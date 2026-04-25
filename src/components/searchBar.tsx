import { Ionicons } from "@expo/vector-icons";
import { memo, useRef } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../types/colors";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  onClear: () => void;
  colors: Colors;
  placeholder?: string;
}

const SearchBar = memo(
  ({
    searchQuery,
    setSearchQuery,
    isSearching,
    onClear,
    colors,
    placeholder = "Buscar músicas...",
  }: SearchBarProps) => {
    const inputRef = useRef<TextInput>(null);

    return (
      <View className="px-4 mb-3">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.input,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.icon}
            style={{ marginRight: 8 }}
          />

          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            placeholderTextColor={colors.icon}
            style={{
              flex: 1,
              color: colors.text,
              fontSize: 16,
              fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
              height: "100%",
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={onClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {isSearching && searchQuery.length > 0 && (
          <View className="mt-2">
            <Text
              className={`text-xs`}
              style={{
                color: colors.text_gray,
              }}
            >
              Buscando...
            </Text>
          </View>
        )}
      </View>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
