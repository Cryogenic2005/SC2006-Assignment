## 🛠️ Project Setup Guide (HawkerGo with Expo + Node Backend)

This guide walks you through setting up the full stack project on your local machine.

---

## 📦 Prerequisites

Make sure you have the following installed:

### ✅ 1. **Install Node.js (includes npm) (only if necessary)**

- Go to: [https://nodejs.org](https://nodejs.org)
- Download the **LTS version**
- Verify installation:

```bash
node -v
npm -v
```

---

## 🚀 FRONTEND (React Native using Expo)

### 📁 Navigate to frontend directory

```bash
cd hawkergo-expo
```

### 1 Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
```

### 2 Install project dependencies

```bash
npm install
```

### 3⃣ Install Expo Go app on your phone

- Android: [Play Store link](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS: [App Store link](https://apps.apple.com/app/expo-go/id982107779)

> 💡 This app lets you preview the app on your real phone via QR code.

### 4⃣ Start the Expo development server

```bash
npx expo start
```

- A QR code will appear in your terminal.
- Open **Expo Go** on your phone.
- Scan the QR code to launch the app.

---

## How Expo + Backend Works

> Your **laptop acts as the backend server**, and your **phone connects to it over Wi-Fi**.

- Both **phone and laptop must be connected to the same Wi-Fi**.
- Expo sends the React Native JS bundle to your phone.
- All API requests go to your laptop's `localhost` **(e.g., 192.168.x.x)**.

---

## Configuring the Backend API URL

1. In `hawkergo-expo/constants/api.js`, set your laptop's IP:

```js
export const API_URL = "http://192.168.X.X:5000/api";
```

> You can find your local IP with:

```bash
ipconfig   # Windows
ifconfig   # Mac/Linux
```

---

## 💻 BACKEND (Node.js + Express + MongoDB)

### 📁 Navigate to the server folder

```bash
cd ../HawkerGo/server
```

### 1⃣️ Install backend dependencies

```bash
npm install
```

### 2⃣️ Create `.env` file

In the `server` directory, create a file named `.env` with the following:

```
MONGO_URI=mongodb://localhost:27017/hawkergo
JWT_SECRET=your_jwt_secret
PORT=5000
```

Update values if needed.

### 3⃣️ Start the backend server with Nodemon

```bash
npm run server
```

If successful, you should see:

```
Server running on port 5000
MongoDB connected
```

---

## 🧪 Troubleshooting

- **"Module not found" error on phone?**
  → Run `npx expo start -c` to clear cache

- **Nothing happens on phone?**
  → Check both devices are on **same Wi-Fi**

- **Still can't fetch data?**
  → Try disabling your computer's firewall temporarily

---

## ✅ Summary of Useful Commands

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `npx expo start`    | Start the Expo app locally        |
| `npm run server`    | Start backend server with nodemon |
| `npm install`       | Install dependencies              |
| `npx expo start -c` | Clear Expo cache and restart      |

---
