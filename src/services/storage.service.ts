import * as AsyncStorage from "@react-native-async-storage/async-storage";
import { showPlatformMessage } from "../components/toast-message-plataform";

export async function saveToStorage(key: string, value: string): Promise<void> {
  async function saveFavoritoStore() {
    try {
      const data = await AsyncStorage.default.setItem(key, value);
      return data;
    } catch (error) {
      console.error("Erro ao salvar no AsyncStorage:", error);
      showPlatformMessage("Erro ao salvar favorito");
    }
  }
}
