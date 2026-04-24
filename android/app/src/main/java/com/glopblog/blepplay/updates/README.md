# 🚀 Blep Play — Sistema de Atualização OTA + APK

Sistema completo de atualização híbrida para Expo + React Native com TypeScript.
Verifica automaticamente o GitHub Releases de `glopmts/blep-play`.

---

## 📁 Estrutura dos Arquivos

```
📦 Projeto
├── android/app/src/main/
│   ├── java/com/blepplay/update/
│   │   ├── UpdateService.kt          ← Foreground Service (download em background)
│   │   ├── UpdateEventEmitter.kt     ← Bridge de eventos Kotlin → React Native
│   │   ├── UpdateModule.kt           ← NativeModule exposto ao RN
│   │   └── UpdatePackage.kt          ← Registro do módulo
│   └── res/xml/
│       └── file_paths.xml            ← Configuração do FileProvider
│
├── src/
│   ├── services/
│   │   ├── githubApi.ts              ← Fetch GitHub Releases + cache + retry
│   │   └── updateBridge.ts           ← Wrapper TypeScript do NativeModule
│   ├── hooks/
│   │   └── useAppUpdater.ts          ← Hook principal (state machine)
│   └── components/
│       ├── UpdateModal.tsx           ← UI do modal com animações
│       └── AppUpdater.tsx            ← Componente drop-in
```

---

## ⚙️ Setup

### 1. Dependências

```bash
npm install @react-native-community/netinfo @react-native-async-storage/async-storage
```

Se ainda não tiver, adicione também:

```bash
npm install nativewind
```

### 2. Arquivos Kotlin

Copie os 4 arquivos `.kt` para:

```
android/app/src/main/java/com/blepplay/update/
```

### 3. Registrar o Package no MainApplication

Abra `android/app/src/main/java/com/blepplay/MainApplication.kt` e adicione:

```kotlin
import com.blepplay.update.UpdatePackage

// Dentro de getPackages():
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(UpdatePackage())
    }
```

### 4. AndroidManifest.xml

Adicione as permissões e declarações do arquivo `android_manifest_additions.xml`
no seu `android/app/src/main/AndroidManifest.xml`.

### 5. file_paths.xml

Crie o arquivo `android/app/src/main/res/xml/file_paths.xml` com o conteúdo do
bloco XML no final do `android_manifest_additions.xml`.

### 6. Dependência OkHttp (build.gradle)

No `android/app/build.gradle`, adicione dentro de `dependencies`:

```groovy
implementation("com.squareup.okhttp3:okhttp:4.12.0")
```

### 7. Usar no App

No seu layout raiz (ex: `app/_layout.tsx`):

```tsx
import { AppUpdater } from "@/components/AppUpdater";

export default function RootLayout() {
  return (
    <>
      <Stack />
      <AppUpdater autoCheck={true} />
    </>
  );
}
```

Ou use o hook diretamente para controle manual:

```tsx
import { useAppUpdater } from "@/hooks/useAppUpdater";

export function MyScreen() {
  const { status, checkForUpdates, isUpdateModalVisible } =
    useAppUpdater(false);

  return (
    <Button
      title="Verificar atualização"
      onPress={() => checkForUpdates(true)}
    />
  );
}
```

---

## 🔄 Fluxo de Atualização

```
App abre
    │
    ▼
checkForUpdates()
    │
    ├─ offline? → status: "offline"
    │
    ├─ fetch GitHub API (com cache 5min + retry 3x)
    │
    ├─ versão atual >= remota? → status: "up_to_date"
    │
    └─ nova versão encontrada → modal aparece
            │
            ▼
        usuário clica "Baixar"
            │
            ├─ verifica permissão REQUEST_INSTALL_PACKAGES
            │
            └─ inicia UpdateService (Foreground Service)
                    │
                    ├─ download em background com OkHttp
                    ├─ notificação nativa com progresso
                    ├─ emite eventos para React Native
                    │
                    └─ download completo → instala APK via Intent
```

---

## 📡 Eventos Emitidos

| Evento              | Payload                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `progressoDownload` | `{ progress, downloadedBytes, totalBytes, speed, *Formatted }`    |
| `downloadCompleto`  | `{ filePath }`                                                    |
| `erroDownload`      | `{ error }`                                                       |
| `statusInstalacao`  | `{ status: 'installing' \| 'launched' \| 'permission_required' }` |

---

## 📌 Notas Importantes

- **Android 10+ (API 29+)**: O APK é salvo em `getExternalFilesDir()` — não requer permissão `WRITE_EXTERNAL_STORAGE`.
- **Android 8+ (API 26+)**: A permissão `REQUEST_INSTALL_PACKAGES` é solicitada via Settings se não estiver concedida.
- **Resume de download**: Se o download for interrompido, o sistema tenta retomar do ponto onde parou (Range header).
- **Cache**: A verificação do GitHub é cacheada por 5 minutos no AsyncStorage.
- **Retry**: Em caso de falha de rede, há 3 tentativas com back-off progressivo.

---

## 🐛 Troubleshooting

**"UpdateModule is not available"**: O módulo Kotlin não foi registrado. Verifique o passo 3.

**APK não instala**: Verifique se o `FILE_PROVIDER_PATHS` aponta para o mesmo diretório usado em `UpdateService.kt`.

**Download para ao minimizar**: Confirme que o `UpdateService` está declarado com `foregroundServiceType="dataSync"` no manifest.
