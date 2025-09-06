# Modern Chyrp Blog

A full-featured markdown blogging platform built with **FastAPI**, **MongoDB Atlas**, and **Supabase Storage** for media file uploads. The frontend uses **React** with **React Query** and **NextAuth** for authentication.

---

## 🚀 Features

- Markdown-based post creation and editing with optional media uploads  
- User registration, authentication, and session management  
- Post likes, comments, views tracking, and author subscriptions  
- Webmentions support for social interactions  
- Infinite scroll post listing with smooth loading transitions  
- Dark/light mode toggle with responsive UI design  

---

## 🛠️ Technology Stack

| Component          | Technology                         |
|-------------------|-------------------------------------|
| Backend Framework | FastAPI (Python 3.11)              |
| Database          | MongoDB Atlas (Async driver Motor) |
| File Storage      | Supabase Storage with RLS          |
| Frontend          | React, React Query, Framer Motion  |
| Authentication    | NextAuth                           |
| Markdown Rendering| React Markdown Components          |

---

## ⚙️ Getting Started

### Prerequisites

- Python 3.11 or higher  
- Node.js and npm or yarn  
- MongoDB Atlas cluster with connection URI  
- Supabase account with configured Storage bucket  

### 🌍 Environment Variables

Create a `.env` file or configure deployment environment variables with the following keys:

```env
MONGODB_URI="your_mongodb_connection_string"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_BUCKET="uploads"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"  # or your deployed backend URL
```

> ⚠️ **Important:**  
Use **Supabase service role key** in backend only (**never expose on frontend**).  
This key has elevated permissions required to upload files bypassing RLS policies.

---

## 🧩 Backend Setup Instructions

1. Create and activate Python virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run development server:

```bash
uvicorn main:app --reload
```

### 📡 API Endpoints Overview

- `/posts` (GET, POST) — Fetch or create posts  
- `/posts/{id}` (GET) — Fetch single post details  
- `/api/auth/login` — User login  
- `/api/auth/demo-register` — Demo user registration  
- `/upload` — File upload endpoint (backend uploads via Supabase)  
- ...and others for comments, likes, subscriptions  

---

## 🖼️ Frontend Setup Instructions

1. Navigate to frontend folder (if separated):

```bash
cd frontend
```

2. Install Node.js dependencies:

```bash
npm install
# or
yarn install
```

3. Run development server:

```bash
npm run dev
# or
yarn dev
```

Then visit: [http://localhost:3000](http://localhost:3000)

---

## 🚢 Deployment Notes

- Deploy **backend** on Render, AWS, DigitalOcean, etc.  
- Set backend environment variables for DB connection and Supabase keys.  
- Deploy **frontend** on Vercel or Netlify.  
- Ensure `NEXT_PUBLIC_BACKEND_URL` points to backend API URL.  
- Confirm Supabase Storage bucket **RLS policies** allow uploads using the **service role key**.  
- **Never expose service role key** on frontend.  

---

## 📝 Additional Notes

- Markdown content is stored in MongoDB and rendered client-side with React Markdown.  
- File URLs from Supabase are fetched per post and rendered in galleries or media players dynamically.  
- View counts are incremented on post view via API.  
- Comments and likes support asynchronous interaction.  
- Webmention receiving is supported on backend for semantic web integration.  

---

## 🛠️ Troubleshooting Tips

- If uploads fail, verify service role key usage and RLS policy for uploads.  
- Check API logs for errors related to MongoDB or Supabase connections.  
- Verify correct environment variables on all deployment platforms.  
- Use browser dev tools and network tab to inspect API payloads and responses.  

---

## 🤝 Contributing

Pull requests, bug reports, and suggestions are welcome!  
Please fork the repo and submit changes via PR.

---

## 📄 License

**MIT License** © Team igniv0x
