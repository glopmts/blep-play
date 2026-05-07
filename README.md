# 🎵 BlepPlay - Reprodutor de Música Moderno

<div align="center">

[![React Native](https://img.shields.io/badge/React%20Native-0.83.4-blue?style=flat-square)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-55.0.14-black?style=flat-square)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-latest-blue?style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

Um reprodutor de música moderno, rápido e intuitivo para Android, iOS e Web, construído com React Native e Expo.

</div>

## Screenshots

<p align="center">
  <img src="assets/screenshorts/1.jpg?v=2" width="200" />
  <img src="assets/screenshorts/2.jpg?v=2" width="200" />
  <img src="assets/screenshorts/3.jpg?v=2" width="200" />
  <img src="assets/screenshorts/4.jpg?v=2" width="200" />
</p>

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Requisitos do Sistema](#requisitos-do-sistema)
- [Instalação](#instalação)
- [Comandos Disponíveis](#comandos-disponíveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Arquitetura da Lógica](#arquitetura-da-lógica)
- [Contextos e Hooks](#contextos-e-hooks)
- [Serviços](#serviços)
- [Build Local - APK](#build-local---apk-android)
- [Screenshots](#screenshots)
- [Configuração](#configuração)
- [Troubleshooting](#troubleshooting)
- [Contribuindo](#contribuindo)

---

## 🎯 Visão Geral

**BlepPlay** é um aplicativo de reprodução de música com recursos avançados, incluindo:

- Suporte para múltiplos formatos de áudio (MP3, AAC, FLAC, WAV, AIFF)
- Biblioteca de mídia local integrada
- Sistema de playlists personalizadas
- Letras sincronizadas em tempo real
- Interface responsiva e tema escuro/claro
- Suporte a múltiplos idiomas (Português e Inglês)
- Sincronização de metadados
- Notificações em tempo real

---

## ✨ Funcionalidades

### 🎧 Reprodução de Áudio

- ✅ Reprodução de múltiplos formatos de áudio
- ✅ Controle de playback (play, pause, próxima, anterior)
- ✅ Barra de progresso interativa com scrubbing
- ✅ Modo loop e shuffle
- ✅ Ajuste de volume e velocidade de reprodução
- ✅ Picture-in-Picture (PiP) mode

### 📚 Gerenciamento de Biblioteca

- ✅ Varredura automática de biblioteca de mídia
- ✅ Caching inteligente de metadados e capas
- ✅ Suporte a álbuns e artistas
- ✅ Visualização em grade ou lista
- ✅ Ordenação e filtros personalizados
- ✅ Detecção de mudanças automática

### 📝 Playlists

- ✅ Criar e editar playlists personalizadas
- ✅ Capas customizadas para playlists
- ✅ Adicionar/remover músicas de playlists
- ✅ Reordenação de faixas
- ✅ Favoritos e histórico de reprodução

### 🎤 Recursos Avançados

- ✅ Visualização de letras sincronizadas
- ✅ Busca global de músicas
- ✅ Recomendações baseadas em histórico
- ✅ Histórico recente de reprodução
- ✅ Compressão automática de capas para otimização

### 🌐 Interoperabilidade

- ✅ Integração com APIs de música online
- ✅ Busca na web de músicas adicionais
- ✅ Compartilhamento de faixas
- ✅ Links de stream de múltiplas plataformas

### 🎨 Interface e UX

- ✅ Tema escuro/claro adaptável
- ✅ Cores dinâmicas baseadas nas capas das músicas
- ✅ Animações suaves
- ✅ Layout responsivo
- ✅ Interface acessível

### 🌍 Suporte Multilíngue

- ✅ Português Brasileiro
- ✅ Inglês
- ✅ Fácil extensão para novos idiomas

### 📱 Notificações e Widgets

- ✅ Notificações de controle de reprodução
- ✅ Widgets da home screen
- ✅ Quick Actions (ações rápidas)
- ✅ Notificações do sistema

---

## 🛠 Tecnologias Utilizadas

### Core

- **React Native** (0.83.4) - Framework de desenvolvimento mobile
- **Expo** (55.0.14) - Plataforma para desenvolvimento React Native
- **Expo Router** (55.0.12) - Roteamento baseado em arquivos
- **TypeScript** - Tipagem estática

### Reprodução de Áudio

- **react-native-track-player** (5.0.0-alpha) - Engine de reprodução
- **expo-av** - APIs de áudio e vídeo
- **expo-audio** - Controle de áudio

### Gerenciamento de Mídia

- **expo-media-library** - Acesso à biblioteca de mídia
- **expo-document-picker** - Seletor de arquivos
- **expo-file-system** - Gerenciamento de sistema de arquivos
- **expo-image-manipulator** - Manipulação de imagens

### UI/UX

- **NativeWind** (4.2.3) - Tailwind CSS para React Native
- **@gorhom/bottom-sheet** - Bottom sheets de alta performance
- **lucide-react-native** - Ícones vetoriais
- **expo-linear-gradient** - Gradientes
- **expo-glass-effect** - Efeitos glassmorphism

### Gerenciamento de Estado

- **React Context API** - Gerenciamento global de estado
- **react-native-mmkv** - Armazenamento rápido de key-value
- **@react-native-async-storage** - Armazenamento persistente

### Banco de Dados

- **expo-sqlite** - Banco de dados SQLite local

### Networking

- **axios** (1.16.0) - Cliente HTTP
- **@react-native-community/netinfo** - Detecção de conectividade

### Autenticação e Segurança

- **expo-crypto** - Criptografia

### Internacionalização

- **i18next** (26.0.8) - Framework i18n
- **react-i18next** (17.0.6) - Integração com React
- **expo-localization** - Localização do dispositivo

### Recursos Adicionais

- **@shopify/flash-list** - Lista otimizada de alta performance
- **expo-haptics** - Feedback tátil
- **expo-notifications** - Notificações push
- **expo-quick-actions** - Quick actions do sistema
- **expo-widgets** - Widgets da home screen
- **react-native-image-colors** - Extração de cores de imagens
- **expo-image-picker** - Seletor de imagens
- **expo-intent-launcher** - Launcher de intents (Android)

---

## 📦 Requisitos do Sistema

### Requisitos de Desenvolvimento

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 ou **yarn**: >= 3.0.0
- **Java Development Kit (JDK)**: >= 11 (para Android)
- **Android Studio** ou **Xcode**: Para emuladores

### Requisitos em Tempo de Execução

- **Android**: >= 9 (API 28)
- **iOS**: >= 14.0
- **Web**: Navegadores modernos (Chrome, Firefox, Safari, Edge)

### Permissões Necessárias

- 📁 Leitura/Escrita de armazenamento externo
- 🎵 Acesso à mídia de áudio
- 📷 Acesso à câmera (para capas de playlist)
- 🔔 Notificações

---

## 🚀 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/glopmts/blep-play.git
cd blep-play
```

### 2. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 3. Instalar Dependências Nativas (Opcional)

```bash
npx expo install react-native-track-player
npx expo install @miblanchard/react-native-slider
npx expo install expo-blur
```

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# API Backend
API_URL=http://192.168.18.11:3333/api/v1
# ou para produção
# API_URL=https://seu-api.com/api/v1

# Opcional: Chaves de API para serviços externos
SPOTIFY_API_KEY=seu_chave_aqui
LYRICS_API_KEY=seu_chave_aqui
```

### 5. Iniciar o Aplicativo

#### Modo Desenvolvimento

```bash
npm start
```

#### Android

```bash
npm run android
# ou
npx expo run:android
```

#### iOS

```bash
npm run ios
# ou
npx expo run:ios
```

#### Web

```bash
npm run web
# ou
npx expo start --web
```

---

## 💻 Comandos Disponíveis

| Comando                 | Descrição                                 |
| ----------------------- | ----------------------------------------- |
| `npm start`             | Inicia o servidor de desenvolvimento Expo |
| `npm run android`       | Compila e executa no emulador Android     |
| `npm run ios`           | Compila e executa no simulador iOS        |
| `npm run web`           | Executa a versão web no navegador         |
| `npm run lint`          | Executa ESLint para validar código        |
| `npm run reset-project` | Reseta o projeto para estado inicial      |

### Exemplos Práticos

```bash
# Iniciar com preset específico (Android/iOS/Web)
npx expo start --android
npx expo start --ios
npx expo start --web

# Limpar cache e reiniciar
npx expo start --clear

# Executar com EAS Build (produção)
eas build --platform android
eas build --platform ios

# Preview de build
eas build:preview --platform android
```

## 🧩 Arquitetura da Lógica

O projeto segue uma arquitetura em camadas bem definida:

### 📁 Camadas Principais

| Camada         | Responsabilidade                   |
| -------------- | ---------------------------------- |
| **Components** | Componentes UI e apresentação      |
| **Contexts**   | Gerenciamento de estado global     |
| **Hooks**      | Lógica reutilizável e custom hooks |
| **Services**   | Lógica de negócio e APIs           |
| **Database**   | Persistência, cache e SQLite       |
| **Modules**    | Integração com APIs nativas        |

---

## 📊 Fluxo de Dados

## 🔄 Contextos e Hooks

### 🎯 Contextos Globais

| Contexto                   | Responsabilidade                                            |
| -------------------------- | ----------------------------------------------------------- |
| **PlayerContext**          | Controle centralizado do player (play, pause, volume, fila) |
| **ThemeContext**           | Gerenciamento de tema escuro/claro e paleta de cores        |
| **LibrarySettingsContext** | Configurações e preferências da biblioteca                  |
| **BottomSheetContext**     | Gerenciamento de bottom sheets modais                       |
| **PlayerHeightContext**    | Cálculo e sincronização da altura do player                 |
| **LinkPreviewContext**     | Cache e gerenciamento de previews                           |

### 🪝 Custom Hooks

| Hook                     | Responsabilidade                                            |
| ------------------------ | ----------------------------------------------------------- |
| **usePlayer()**          | Controle de reprodução (play, pause, próxima, seek, volume) |
| **usePlaylists()**       | CRUD de playlists e gerenciamento de faixas                 |
| **useSearchSong()**      | Busca global de músicas                                     |
| **useMusicHistory()**    | Histórico e últimas reproduções                             |
| **useArtworkColor()**    | Extração de cores dominantes de imagens                     |
| **useAppUpdater()**      | Verificação e download de atualizações                      |
| **useTrackCover()**      | Cache e obtenção de capas de faixas                         |
| **usePlaylistCover()**   | Gerenciamento de capas customizadas                         |
| **uselibrarysettings()** | Configurações de ordenação e filtros                        |

---

## 🔧 Serviços (Lógica de Negócio)

| Serviço                       | Responsabilidade                                      |
| ----------------------------- | ----------------------------------------------------- |
| **musicApi.service**          | Integração com API (busca, stream, lyrics, metadados) |
| **playback.service**          | Engine de reprodução e controle remoto                |
| **cacheManager.service**      | Gerenciamento de cache com TTL e MMKV                 |
| **playlists.service**         | CRUD de playlists e gerenciamento de faixas           |
| **lyrics.service**            | Busca e sincronização de letras                       |
| **notification.service**      | Notificações de playback                              |
| **cover-compression.service** | Otimização e redimensionamento de imagens             |
| **delete-album.service**      | Exclusão segura de álbuns                             |

---

## 📱 Build Local - APK (Android)

### 🔧 Ferramentas Necessárias para Build

Antes de compilar localmente, certifique-se de ter instalado:

- **Java Development Kit (JDK)**: >= 11
- **Android SDK**: API 28 e superior
- **Gradle**: >= 7.0 (incluído no projeto)
- **Node.js**: >= 18.0
- **npm**: >= 9.0 ou **yarn**: >= 3.0

### 📋 Pré-requisitos

1. Variáveis de ambiente configuradas:

```bash
# Linux/Mac
export ANDROID_HOME=~/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Windows (adicione ao PATH do sistema)
ANDROID_HOME=C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk
```

2. Dependências instaladas:

```bash
npm install
# ou
yarn install
```

### 🏗️ Gerar APK Local com Gradle

#### Opção 1: Build Release (Otimizado)

```bash
cd android
./gradlew assembleRelease
```

Arquivo gerado: `android/app/build/outputs/apk/release/app-release.apk`

#### Opção 2: Build Debug (Teste Rápido)

```bash
cd android
./gradlew assembleDebug
```

Arquivo gerado: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Opção 3: Build Signed Release (Para Loja)

```bash
cd android
./gradlew bundleRelease --build-cache
```

Obs: Requer configuração de keystore no arquivo `android/app/build.gradle`

### 📦 Limpeza e Rebuild

```bash
cd android
./gradlew clean

# Depois execute o build novamente
./gradlew assembleRelease
```

### 📊 Verificar Tamanho do APK

```bash
# Linux/Mac
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Windows PowerShell
Get-Item android\app\build\outputs\apk\release\app-release.apk | Select-Object Length
```

### 🚀 Instalar APK em Dispositivo

```bash
# Listar dispositivos conectados
adb devices

# Instalar APK
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### 🐛 Troubleshooting Build

| Erro                           | Solução                                              |
| ------------------------------ | ---------------------------------------------------- |
| "ANDROID_HOME not set"         | `export ANDROID_HOME=~/Android/Sdk`                  |
| "Permission denied: ./gradlew" | `chmod +x android/gradlew`                           |
| "No matching variant"          | Limpe: `cd android && ./gradlew clean && cd ..`      |
| Build muito lento              | Use cache: `./gradlew assembleRelease --build-cache` |

---

## ⚙️ Configuração

### 🔑 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Backend API
API_URL=http://192.168.18.11:3333/api/v1

# Modo desenvolvimento
DEV_MODE=true

# Timeout de requisições (ms)
API_TIMEOUT=15000

# Cache TTL (segundos)
CACHE_TTL=3600

# Qualidade de compressão de capas (0-100)
IMAGE_COMPRESSION_QUALITY=75

# Limite de size de cache (MB)
CACHE_SIZE_LIMIT=500
```

### 📱 `app.json` - Configuração EAS

```json
{
  "expo": {
    "name": "BlepPlay",
    "slug": "blep-play",
    "version": "1.2.5",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "blepplay",
    "userInterfaceStyle": "automatic",
    "ios": {
      "bundleIdentifier": "com.glopblog.blepplay",
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#1A1C22"
      }
    }
  }
}
```

### 🎨 `tailwind.config.js`

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### 🛠️ NativeWind

O projeto usa **NativeWind** para estilos Tailwind no React Native:

```tsx
<View className="bg-black p-4 rounded-lg">
  <Text className="text-white text-lg font-bold">BlepPlay</Text>
</View>
```

---

## 🌍 Internacionalização (i18n)

O projeto suporta múltiplos idiomas via **i18next**.

### Adicionar Novo Idioma

1. Crie arquivo `i18next/locales/xx.ts`:

```typescript
// i18next/locales/xx.ts
export default {
  translation: {
    home: {
      title: "Título em novo idioma",
      description: "Descrição...",
    },
  },
};
```

2. Registre em `i18next/i18next.ts`:

```typescript
import xx from "./locales/xx";

const resources = {
  en,
  pt,
  xx, // Novo idioma
};
```

### Usar em Componentes

```tsx
import { useTranslation } from "react-i18next";

export function MyComponent() {
  const { t } = useTranslation();

  return <Text>{t("home.title")}</Text>;
}
```

---

## 🚀 Build e Deploy

### Build para Produção

#### Android

```bash
eas build --platform android --auto-submit
```

#### iOS

```bash
eas build --platform ios
```

### Submissão à Loja

#### Google Play Store

```bash
eas submit --platform android
```

#### Apple App Store

```bash
eas submit --platform ios
```

---

## 🐛 Troubleshooting

### Problemas Comuns

**O app não inicia**

```bash
# Limpar cache Expo
npx expo start --clear

# Resetar módulos node
rm -rf node_modules package-lock.json
npm install
```

**Erro de permissões no Android**

- Verifique `app.json` para permissões
- Teste em Android 12+ (requer permissão em runtime)

**Letras não sincronizam**

- Verifique conexão com API de letras
- Valide formato de letras sincronizadas

**Capas de álbuns não carregam**

- Limpe cache: `npm run reset-cache`
- Verifique permissões de armazenamento

---

## 📚 Recursos e Documentação

- **Expo Documentation**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Expo Router**: https://docs.expo.dev/routing/introduction/
- **NativeWind**: https://www.nativewind.dev
- **react-native-track-player**: https://rntp.dev
- **i18next**: https://www.i18next.com

---

## 📝 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript
- Siga ESLint config do projeto
- Crie testes para novas funcionalidades
- Atualize documentação se necessário

---

## 👨‍💻 Autor

**GlopMts**

- GitHub: [@glopmts](https://github.com/glopmts)

---

## 🎉 Agradecimentos

Obrigado a todos que contribuem para tornar BlepPlay melhor!

- [Expo](https://expo.dev) - Plataforma de desenvolvimento
- [React Native](https://reactnative.dev) - Framework
- [Tailwind CSS](https://tailwindcss.com) - Estilos
- Todos os autores de bibliotecas open-source utilizadas

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela! ⭐**

Made with ❤️ by GlopMts

</div>

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
