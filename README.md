# 📞 PhoneApp

**PhoneApp** is a senior-friendly, high-performance **Companion Phone, Contacts & Call Log Hub** built with React Native and Expo SDK 57. It is designed specifically for ease of use, featuring complete bilingual support (**हिन्दी & English**), instant speech search, dynamic Devanagari alphabet indexing, and smart T9 dialpad search.

---

## 🌟 Key Features

### 1. 🌐 Bilingual Localization (हिन्दी & English)
* **Full Translation Support:** Easily toggle between English and Hindi (`hi`) in settings.
* **Senior-Friendly Typography:** High contrast, legible font sizes, and large touch targets throughout the app.
* **Pristine White Settings Screen:** Dedicated `/settings` screen with language selector, live permission status dashboard, contact creation, and data management.

### 2. 🔤 Dynamic Varnamala & Alphabet Quick-Jump Bar
* **Filtered by Active Contacts:** Dynamically inspects your 500+ contacts and displays only letters that exist in your phonebook.
* **Large Touch Targets:** 1-tap jumping to all contacts under a root letter (e.g., tapping **`[ र ]`** instantly shows *रमेश*, *रेखा*, *राहुल*, etc.).
* **Zero Clutter:** Eliminates unused alphabets for a clean, fast experience.

### 3. 🎙️ Native Voice Search & Calling
* **Built-in Android Speech Recognition:** Integrated via native Android `RecognizerIntent.ACTION_RECOGNIZE_SPEECH` (`VoiceSearchModule.kt`).
* **Multi-Language Voice Support:** Seamlessly recognizes spoken Hindi (`hi-IN`) and English (`en-IN`) contact queries.
* **1-Tap Action:** Tap the `🎙️` button in Contacts or Recents, speak the person's name (e.g., *"रमेश"* or *"डॉक्टर"*), and get instant 1-tap call cards.

### 4. ⌨️ Smart Hindi & English T9 Dialpad
* **Inherent Vowel Transliteration Engine:** Understands implicit Devanagari vowels (`'a'`):
  * Typing **`7-2`** matches both **"पापा"** (`7272`) and **"रमेश"** (`726374`)!
  * Typing **`5-2`** matches **"कमल"** (`52625`).
  * Typing **`3-6`** matches **"डॉक्टर"** (`36527`).
* **Indian Mobile Keypad Varna Mapping:** Keypad keys display Hindi alphabets (`2: अ-क-ग`, `3: च-छ-ज`, `6: प-ब-म`, etc.) when in Hindi mode.
* **Quick Number Actions:** Instant chips for **`[ 👤➕ Add Contact ]`**, **`[ 💬 WhatsApp ]`**, and **`[ ✉️ SMS ]`** for unsaved numbers.

### 5. 📋 Rich Call History (Recents)
* **Grouped Consecutive Calls:** Merges repeated calls to/from the same contact into clean single entries with badge counts (e.g. `(3)`).
* **1-Tap Filter Pills:** Filter instantly by `All (सभी)`, `Missed (मिस्ड)`, `Incoming (आए हुए)`, and `Outgoing (किए गए)`.
* **Expandable History Details:** Tap any call to expand the full timestamp breakdown and talk duration.
* **Live Updates:** Android native `ContentObserver` immediately refreshes call logs when calls finish.

### 6. ⭐ Contacts & Speed Dial Favorites
* **Pinned Favorites Grid:** Large photo avatars at the top for 1-tap family speed dialing.
* **Built-in Contact Creator:** In-app senior-friendly contact creation modal with direct phonebook saving.
* **Personal Notes & Tags:** Attach custom notes/tags to contacts (e.g. *"Plumber"*, *"Family"*, *"Shop"*).

---

## 🛠️ Architecture & Tech Stack

```
PhoneApp
├── React Native (0.81) / Expo SDK 57 (Managed Native Workflow)
├── Expo Router (File-based navigation: / and /settings)
├── TypeScript (Strict Type Safety)
├── Android Native Modules (Kotlin):
│   ├── CallLogModule.kt (CallLog.Calls query + ContentObserver)
│   └── VoiceSearchModule.kt (Native Speech Recognizer Bridge)
└── Storage & Services:
    ├── expo-contacts/legacy (Device contacts book)
    └── react-native-mmkv (High-performance synchronous C++ storage)
```

---

## 📁 Project Structure

```
├── android/                             # Android native project & Gradle build
│   └── app/src/main/java/com/ils_nazir/PhoneApp/
│       ├── MainApplication.kt          # Registers custom packages
│       ├── calllog/                     # CallLogModule & CallLogPackage
│       └── voice/                       # VoiceSearchModule & VoiceSearchPackage
├── src/
│   ├── app/                             # Expo Router pages
│   │   ├── _layout.tsx                  # Stack layout configuration
│   │   ├── index.tsx                    # Main Hub (Recents + Contacts + Dialpad)
│   │   └── settings.tsx                 # Dedicated full-screen white settings
│   ├── components/
│   │   ├── CallLog/                     # Call log list and grouped item components
│   │   ├── Contacts/                    # Contacts list, details modal, create modal
│   │   ├── Dialpad/                     # Smart T9 dialpad with Hindi varna mapping
│   │   └── Favorites/                   # Senior-friendly speed dial grid
│   └── services/
│       ├── ActionService.ts             # Phone calls, WhatsApp, SMS, haptics
│       ├── CallLogService.ts            # Log querying, grouping, and duration formatters
│       ├── ContactsService.ts           # Contact querying, T9 indexer & Devanagari engine
│       ├── LanguageContext.tsx          # i18n localization (English / हिन्दी)
│       ├── StorageService.ts            # Synchronous MMKV storage bridge
│       └── VoiceSearchService.ts        # Native Speech Recognizer bridge
└── app.json                             # Expo app configuration & permissions
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18 or higher
* **Java**: JDK 17 (e.g., Azul Zulu 17)
* **Android SDK**: Android 14+ / API 34+

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run TypeScript typecheck:**
   ```bash
   npx tsc --noEmit
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on Android device/emulator:**
   ```bash
   npx expo run:android
   ```

---

## 📦 Building Android Release APK

To create a standalone release APK for local device installation:

```bash
cd android
./gradlew assembleRelease
```

The compiled APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🗺️ Roadmap (Version 2)

* [ ] **Full-Screen Caller ID Photo Overlay:** Truecaller-style `SYSTEM_ALERT_WINDOW` incoming call overlay to show full-screen contact photos.
