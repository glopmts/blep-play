import { Search } from "lucide-react-native";
import { TextInput, View } from "react-native";

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

const Input: React.FC<InputProps> = ({ value, onChangeText, placeholder }) => {
  return (
    <View className="flex-1">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-base text-gray-800 dark:text-gray-200"
        placeholderTextColor="#9ca3af"
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
      </TextInput>
    </View>
  );
};

export default Input;
