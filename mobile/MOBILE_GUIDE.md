# 📱 NearLink Mobile Deployment Guide

This directory contains the mobile-wrapped version of the NearLink frontend using **Capacitor**. This setup allows you to convert the Next.js web application into a native Android APK without modifying the core logic.

---

## 🛠 Prerequisites

1.  **Node.js**: Installed on your machine.
2.  **Android Studio**: Installed and configured with SDKs for Android.
3.  **Physical Device/Emulator**: A phone connected via USB with **USB Debugging** enabled.
4.  **Network**: Both your PC (running the backend) and your phone must be on the **same Wi-Fi network**.

---

## 🚀 One-Time Setup

Run these commands in the `mobile/` directory:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Build the Project**:
    ```bash
    npm run static
    ```

3.  **Initialize Capacitor Android**:
    ```bash
    npx cap add android
    ```

---

## 📦 Generating an APK

1.  **Sync Web Assets**:
    Whenever you make changes to the code, run:
    ```bash
    npm run static
    npx cap sync
    ```

2.  **Build in Android Studio**:
    ```bash
    npx cap open android
    ```
    - In Android Studio, wait for Gradle to sync.
    - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
    - Once finished, a popup will show you the location of the `app-debug.apk`.

---

## ⚡ Live Testing (Development Mode)

To run the app on your phone with **Live Reload** (changes reflect instantly):

1.  **Start your Backend**: Ensure the FastAPI server is running in the `backend/` directory.
2.  **Run with Live Reload**:
    ```bash
    npx cap run android --live-reload --external
    ```
    - Select your connected device.
    - The app will now use your PC's IP (`192.168.230.145`) to communicate with the backend.

---

## ⚙️ Configuration Notes

-   **API URL**: Configured in `mobile/.env.local`. If your PC's IP address changes, update `NEXT_PUBLIC_API_URL` there.
-   **Static Export**: Next.js is configured to `output: 'export'` in `next.config.mjs`.
-   **Dynamic Routes**: To support static export, I have converted the dynamic booking route from `/booking/[id]` to `/booking?id=...`. This ensures the app works perfectly as a static APK.
-   **Images**: `unoptimized: true` is enabled in `next.config.mjs`.

---

## 📂 Folder Structure
-   `/android`: The native Android Studio project.
-   `/src`: The React/Next.js frontend code (copied from root frontend).
-   `capacitor.config.json`: Capacitor settings.
