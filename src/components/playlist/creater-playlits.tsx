import { Text, TouchableOpacity, View } from "react-native";
import Input from "../ui/input";
import Modal from "../ui/modal";

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  setTitle: (v: string) => void;
  onConfirm: () => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
  title,
  setTitle,
  onConfirm,
}) => (
  <Modal visible={visible} onClose={onClose} title="Nova playlist">
    <View className="gap-4">
      <Input
        value={title}
        onChangeText={setTitle}
        placeholder="Nome da playlist"
        maxLength={30}
      />

      <View className="flex-row gap-3 mt-1">
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          className="flex-1 py-3.5 rounded-xl border dark:border-zinc-700 border-zinc-200 items-center"
        >
          <Text className="text-sm font-medium dark:text-zinc-400 text-zinc-500">
            Cancelar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onConfirm}
          activeOpacity={0.82}
          className="flex-1 py-3.5 rounded-xl bg-indigo-500 items-center shadow-sm shadow-indigo-500/30"
        >
          <Text className="text-sm font-semibold text-white">Criar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default CreatePlaylistModal;
