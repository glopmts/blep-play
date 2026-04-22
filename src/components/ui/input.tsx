import React, { useRef, useState } from "react";
import {
  Animated,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  icon?: React.ReactNode;
  /** Se true, exibe ícone de busca por padrão */
  search?: boolean;
};

const Input: React.FC<InputProps> = ({
  value,
  maxLength = 40,
  onChangeText,
  placeholder = "Pesquisar…",
  icon,
  search = false,
}) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "#6366f1"],
  });

  const showIcon = search || !!icon;

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <Animated.View
        style={{ borderColor }}
        className="flex-row items-center rounded-xl dark:bg-zinc-800/80 bg-zinc-100 px-3 py-0 border"
      >
        {showIcon && (
          <View className="mr-2 opacity-50">
            {icon ?? (
              // Inline search icon using pure SVG-free approach
              <View className="w-4 h-4 items-center justify-center">
                {/* Simple circle + line for search */}
                <View
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 7,
                    borderWidth: 1.8,
                    borderColor: focused ? "#818cf8" : "#71717a",
                  }}
                />
              </View>
            )}
          </View>
        )}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 py-3 text-sm dark:text-zinc-100 text-zinc-800 font-normal"
          placeholderTextColor="#52525b"
          selectionColor="#6366f1"
          cursorColor="#6366f1"
        />
        {value.length > 0 && (
          <TouchableWithoutFeedback onPress={() => onChangeText("")}>
            <View
              className="w-5 h-5 rounded-full bg-zinc-400/30 items-center justify-center ml-2"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={{
                  width: 8,
                  height: 1.5,
                  backgroundColor: "#a1a1aa",
                  transform: [{ rotate: "45deg" }, { translateY: 0 }],
                  position: "absolute",
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 1.5,
                  backgroundColor: "#a1a1aa",
                  transform: [{ rotate: "-45deg" }],
                  position: "absolute",
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default Input;
