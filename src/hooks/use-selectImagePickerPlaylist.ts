import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";

export function SelectPlaylistImagePicker() {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à sua galeria para alterar a capa da playlist.",
      );
      return null;
    }

    setIsLoading(true);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const base64 = result.assets[0].base64;

      setImage(imageUri);
      setIsLoading(false);
      return { uri: imageUri, base64 };
    }
    setIsLoading(false);
    return null;
  };

  return {
    image,
    isLoading,
    pickImage,
    setImage,
  };
}
