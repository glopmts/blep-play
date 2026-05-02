import Header from "@/components/header";
import { LayoutWithHeader } from "@/components/LayoutWithHeader";
import { useTheme } from "@/context/ThemeContext";
import * as Application from "expo-application";
import { router } from "expo-router";
import {
  ChevronRight,
  Download,
  FileMusicIcon,
  Settings,
} from "lucide-react-native";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const NAVE_OPTIONS: NaveOptionsProps[] = [
  {
    id: 1,
    label: "Biblioteca local",
    description:
      "Gerencia todos os dados armazenado no cache do dispositivo e pasta local audios.",
    icon: FileMusicIcon,
    action: () => {
      router.navigate("/(main)/(pages)/local-library");
    },
  },
  {
    id: 2,
    label: "Configuração de privacidade",
    description: "Gerencia suas configurações de privacidade e dados pessoais",
    icon: Settings,
    action: () => {
      Alert.alert("Privacidade", "Configurações de privacidade");
    },
  },
  {
    id: 3,
    label: "Verifica atualização App",
    description: "Clique aqui para verificar se há novas atualizações",
    infor: `v${Application.nativeApplicationVersion}`,
    icon: Download,
    action: () => {
      Alert.alert("Atualização", "Verificando por atualizações...");
    },
  },
];

const Configurations = () => {
  const { colors, isDark, toggleColorScheme } = useTheme();

  return (
    <LayoutWithHeader header={false} statusBarOpen={false}>
      <Header />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="px-4 pt-4">
          {/* Switch de tema */}
          <View
            className="flex-row items-center justify-between p-4 rounded-2xl mb-6"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-1">
              <Text
                className="text-base font-semibold mb-1"
                style={{ color: colors.text }}
              >
                Tema escuro
              </Text>
              <Text className="text-sm" style={{ color: colors.textMuted }}>
                Alterar entre tema claro e escuro
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleColorScheme}
              className="w-12 h-6 rounded-full justify-center px-1"
              style={{
                backgroundColor: isDark ? colors.primary : colors.border,
              }}
            >
              <View
                className="w-4 h-4 rounded-full bg-white"
                style={{
                  transform: [{ translateX: isDark ? 20 : 0 }],
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Opções de navegação */}
          <View className="gap-3">
            {NAVE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={option.action}
                activeOpacity={0.7}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: colors.card }}
              >
                <View className="flex-row items-center">
                  {/* Ícone */}
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: isDark ? "#27272A" : "#E4E4E7" }}
                  >
                    {option.icon && (
                      <option.icon
                        size={24}
                        color={isDark ? colors.primary : "#18181B"}
                      />
                    )}
                  </View>

                  {/* Conteúdo */}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-base font-semibold mb-1"
                        style={{ color: colors.text }}
                      >
                        {option.label}
                      </Text>
                      {option.infor && (
                        <View
                          className="px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: isDark ? "#3F3F46" : "#E4E4E7",
                          }}
                        >
                          <Text
                            className="text-xs"
                            style={{ color: colors.textMuted }}
                          >
                            {option.infor}
                          </Text>
                        </View>
                      )}
                    </View>
                    {option.description && (
                      <Text
                        className="text-sm"
                        style={{ color: colors.textMuted }}
                      >
                        {option.description}
                      </Text>
                    )}
                  </View>

                  {/* Ícone de seta */}
                  <ChevronRight size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Seção adicional de suporte */}
          <View className="mt-8">
            <Text
              className="text-sm font-semibold mb-3 uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              Suporte
            </Text>

            <TouchableOpacity
              className="p-4 rounded-2xl mb-3"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                className="text-base font-medium"
                style={{ color: colors.text }}
              >
                Central de ajuda
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: colors.textMuted }}
              >
                Tire dúvidas e encontre soluções
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 rounded-2xl"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                className="text-base font-medium"
                style={{ color: colors.text }}
              >
                Termos e políticas
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: colors.textMuted }}
              >
                Leia nossos termos de uso e política de privacidade
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center justify-center pt-8 pb-4">
          <Text
            className="text-sm text-center"
            style={{ color: colors.textMuted }}
          >
            Versão atual do app:
          </Text>
          <Text
            className="text-sm font-medium text-center"
            style={{ color: colors.textMuted }}
          >
            {Application.nativeApplicationVersion ?? "0.0.0"}
          </Text>
        </View>
      </ScrollView>
    </LayoutWithHeader>
  );
};

export default Configurations;
