import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  useColorScheme,
} from "react-native";

interface RNButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "success";
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = ({ variant, isLoading, children }: RNButtonProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity>
      {isLoading ? (
        <ActivityIndicator size={20} color={isDark ? "#000" : "#fff"} />
      ) : (
        <Text
          className={`font-bold text-base ${isDark ? "text-white" : "text-black"}`}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
