# Debate-It

[![Backend Build](https://github.com/hemant-mistry/debate-it/actions/workflows/debate-it-backend.yml/badge.svg?branch=main)](https://github.com/hemant-mistry/debate-it/actions/workflows/debate-it-backend.yml)
[![Frontend: Vite](https://img.shields.io/badge/frontend-vite%2Breact-blue.svg)](https://vitejs.dev/)
[![Backend: ASP.NET Core](https://img.shields.io/badge/backend-asp.net%20core-blueviolet.svg)](https://docs.microsoft.com/aspnet/core)
[![Supabase](https://img.shields.io/badge/auth-supabase-3ecf8e.svg)](https://supabase.com/)
[![Deployed on Vercel](https://vercelbadge.vercel.app/api/hemant-mistry/debate-it)](https://debate-it.vercel.app/)

---

**Debate-It** is an interactive debate game platform where users can create or join rooms, sign in via Google, and immediately start debating AI-generated topics. Players take turns presenting arguments; once all turns are used, the AI judges the debate and awards scores.

---

## Features

- **Modern Tech Stack:** React + TypeScript + Vite frontend, ASP.NET Core (C#) backend
- **Real-Time Debates:** SignalR for instant updates
- **Flexible Modes:** Debate via text or voice
- **AI Integration:** Topics and scoring powered by Google Gemini
- **Authentication:** Secure sign-in via Supabase (Google Auth)
- **Responsive UI:** Styled with Tailwind CSS and DaisyUI
- **Easy Deployment:** Ready for Vercel (frontend) and any .NET hosting (backend)

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- .NET 7 SDK or later
- npm or yarn
- Supabase project (URL + anon key + service key)
- Gemini API key (for AI features)

---

### 1. Clone the Repository

```sh
git clone https://github.com/hemant-mistry/debate-it.git
cd debate-it
```

---

### 2. Environment Setup

#### Frontend (`/frontend`)

Create a `.env` file in the `frontend` folder:

```
VITE_TWIST_IT_BACKEND_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

#### Backend (`/backend`)

Configure environment variables or `appsettings.json`:

- `SupabaseUrl`
- `SupabaseKey`
- `GeminiKey`

---

### 3. Install Dependencies

#### Frontend

```sh
cd frontend
npm install
```

#### Backend

```sh
cd ../backend/debate-it-backend
dotnet restore
```

---

### 4. Run Locally

#### Backend

```sh
dotnet run
```
By default, runs on [https://localhost:5000](https://localhost:5000)

#### Frontend

```sh
cd ../../frontend
npm run dev
```
By default, runs on [http://localhost:5173](http://localhost:5173)

---

## Main Endpoints

- **Rooms**
  - `GET /api/rooms/fetch-rooms` – List rooms
  - `POST /api/rooms/create-room` – Create a room
  - `POST /api/rooms/join-room` – Join a room
  - `POST /api/rooms/ai/create` – Generate AI content
- **Real-time:** SignalR Hub at `/roomhub`

---

## Project Structure

```text
debate-it/
├── frontend/         # React + TypeScript + Vite app
│   ├── src/          # Components, Redux, assets, etc.
│   └── ...           
├── backend/
│   ├── debate-it-backend/  # ASP.NET Core backend
│   └── ...
└── README.md         # (This file)
```

---

## Deployment

### Frontend

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hemant-mistry/debate-it&template=vite-react)

You can deploy your frontend to Vercel with:

```sh
vercel
```

### Backend

Backend deployment is automated with GitHub Actions via [debate-it-backend.yml](.github/workflows/debate-it-backend.yml), which builds, tests, and deploys to Azure WebApp.  
You can also deploy to your preferred .NET hosting platform (Azure, AWS, Railway, etc.).

---

## Technologies Used

- **Frontend:** React, TypeScript, Vite, Redux Toolkit, Tailwind CSS, DaisyUI, SignalR JS, Supabase JS
- **Backend:** ASP.NET Core, C#, SignalR, Supabase .NET, Google Gemini AI
- **CI/CD:** GitHub Actions ([workflow file](.github/workflows/debate-it-backend.yml))
- **Deployment:** Vercel (frontend), Azure WebApps (backend)

---

## About

Debate-It enables users to:
- Sign in with Google
- Create/join rooms via code
- Debate AI-generated topics
- Get AI-based winner scoring

---

## License

Licensed under the [Apache License 2.0](./backend/LICENSE.txt).

---

## Contributing

Feel free to open an issue or pull request for suggestions, bug fixes, or enhancements!

---

**Note:**  
This README only includes the badge for the backend workflow (`debate-it-backend.yml`). If you add more workflows (e.g., for the frontend), add additional badges using this format:

```
[![Workflow Name](https://github.com/hemant-mistry/debate-it/actions/workflows/YOUR_WORKFLOW_FILE.yml/badge.svg?branch=main)](https://github.com/hemant-mistry/debate-it/actions/workflows/YOUR_WORKFLOW_FILE.yml)
```

[View workflows and more in the GitHub UI →](https://github.com/hemant-mistry/debate-it/actions)
