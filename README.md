<h1 align="center">🍽️ React Native Recipe App 🍽️</h1>

![Demo App](/mobile/assets/images//screenshot-for-readme.png)

Highlights:

- 🔐 Signup, Login, and Session Management with **Supabase Auth** (email + password)
- 🍳 Browse Featured Recipes & Filter by Categories
- 🔍 Search Recipes and View Detailed Cooking Instructions
- 🎥 Recipe Pages Include YouTube Video Tutorials
- ❤️ Add Recipes to Favorites and Access Them from Favorites Tab
- ⚡ Tech Stack: React Native + Express + PostgreSQL + Expo
- 🌈 Includes Multiple Color Themes
- 🆓 100% Free Tools — No Paid Services Required

Recipe content (recipes, categories, ingredients, and videos) is powered by the
free [TheMealDB](https://www.themealdb.com/api.php) API. The Express backend and
PostgreSQL database are used only to store each user's favorites.

---

## 🧪 .env Setup

### Backend (`/backend`)

```bash
PORT=5001
DATABASE_URL=your_neon_db_url
NODE_ENV=development
```

### Mobile App (`/mobile`)

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** The mobile app talks to the backend at the URL defined in
> `mobile/constants/api.js` (defaults to `http://localhost:5001/api`). If you run
> the app on a physical device, update that value to your machine's LAN IP or a
> deployed backend URL.

---

## 🔧 Run the Backend

```bash
cd backend
npm install
npm run dev
```

## 📱 Run the Mobile App

```bash
cd mobile
npm install
npx expo start
```
