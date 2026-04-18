import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Button, Text, View } from "react-native";

const AddMusics = () => {
  const [selectedMusics, setSelectedMusics] = useState<string[]>([]);

  const handleSelectMusics = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
      });

      if (!result) {
        console.log("No musics selected");
        return;
      }
      const selectedMusics = result.assets?.map((file) => file.uri || "") || [];
      console.log("Selected musics:", selectedMusics);
      setSelectedMusics(selectedMusics);
    } catch (error) {
      console.error("Error selecting musics:", error);
    }
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Button onPress={handleSelectMusics} title="Select Musics" />

      {selectedMusics.length > 0 && (
        <View className="mt-4">
          <Text className="text-lg font-bold text-gray-700">
            Selected Musics:
          </Text>
          {selectedMusics.map((musicUri, index) => (
            <Text key={index} className="text-gray-600">
              {musicUri}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default AddMusics;
