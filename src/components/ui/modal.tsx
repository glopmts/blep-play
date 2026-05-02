import { XIcon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  animationDuration?: number;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  title,
  animationDuration = 280,
}) => {
  const [mounted, setMounted] = useState(visible);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: animationDuration - 40,
          useNativeDriver: true,
        }),
        Animated.spring(contentScale, {
          toValue: 1,
          damping: 22,
          stiffness: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: animationDuration - 40,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 24,
          duration: animationDuration - 40,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: animationDuration - 60,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.96,
          duration: animationDuration - 40,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible, mounted, animationDuration]);

  if (!mounted) return null;

  return (
    <View className="absolute inset-0 z-50">
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          className="absolute inset-0"
          style={{
            opacity: overlayOpacity,
            backgroundColor: "rgba(0,0,0,0.65)",
          }}
        />
      </TouchableWithoutFeedback>

      <View
        pointerEvents="box-none"
        className="absolute inset-0 justify-center items-center px-4"
      >
        <Animated.View
          style={{
            transform: [
              { translateY: contentTranslateY },
              { scale: contentScale },
            ],
            opacity: contentOpacity,
            width: "100%",
            maxWidth: 420,
          }}
        >
          {/* Card */}
          <View className="dark:bg-zinc-900 bg-white rounded-3xl overflow-hidden shadow-2xl border dark:border-zinc-700/60 border-zinc-200">
            {/* Header strip */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              {title ? (
                <Text className="text-base font-semibold tracking-tight dark:text-white text-zinc-900">
                  {title}
                </Text>
              ) : (
                <View />
              )}
              <Pressable
                onPress={handleClose}
                className="w-8 h-8 rounded-full items-center justify-center dark:bg-zinc-800 bg-zinc-100 active:opacity-60"
                hitSlop={8}
              >
                <XIcon size={15} color="#71717a" strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Divider */}
            <View className="h-px dark:bg-zinc-800 bg-zinc-100 mx-5" />

            {/* Content */}
            <View className="px-5 pt-4 pb-6">{children}</View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

export default Modal;
