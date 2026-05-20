# SkillSwap

A peer-to-peer skill-sharing mobile application built with React Native (Expo) and Node.js. Users can teach and learn skills by joining or creating small groups, scheduling sessions, chatting, and asking an AI assistant questions about uploaded session materials.

---

## Project Structure

```
SkillSwap/
├── backend/          # Node.js / Express API
└── frontend/         # React Native / Expo app
```

---

## Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) - `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) app on your phone **or** an Android/iOS emulator
- A [Supabase](https://supabase.com/) project (free tier is sufficient)
- A [Groq](https://console.groq.com/) API key (free tier available)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for the password-reset email feature

---

## Backend Setup

### 1. Navigate to the backend folder

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Create a file named `.env` in the `backend/` folder and fill in the values below:

```env
# Server
NODE_ENV=development
PORT=5000

# Supabase - get these from your Supabase project Settings > API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# JWT - any long random string works
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS - must match the IP your phone/emulator uses to reach the backend
CLIENT_URL=http://192.168.x.x:5000

# Email (Gmail) - use an App Password, not your regular Gmail password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=SkillSwap <your-email@gmail.com>

# Frontend URL for password-reset links
FRONTEND_URL=http://192.168.x.x:8081

# Groq AI - get from https://console.groq.com/
GROQ_API_KEY=your_groq_api_key
```

> **Tip:** To find your local IP address run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) and look for your Wi-Fi IPv4 address (e.g. `192.168.1.8`).

### 4. Set up the Supabase database

In your Supabase project, you need the following tables. You can create them via the Supabase SQL editor.

<details>
<summary>Click to expand - required tables</summary>

- `users` - id, email, password_hash, full_name, nick_name, gender, date_of_birth, biography, education_level, profile_image_url, created_at
- `user_settings` - id, user_id, allow_notifications, show_skills, allow_friend_requests, auto_accept_group_invites
- `skills` - id, name, icon_url, is_default, created_at
- `user_skills` - id, user_id, skill_id, role, proficiency_level, is_favorite
- `friends` - id, requester_id, addressee_id, status, created_at
- `recent_searches` - id, searcher_id, searched_user_id, created_at
- `groups` - id, name, description, skill_id, creator_id, difficulty, visibility, status, cover_image_url, max_participants, created_at
- `group_members` - id, group_id, user_id, role, has_joined, joined_at
- `group_chats` - id, group_id, created_at
- `chat_messages` - id, group_chat_id, sender_id, message_type, content, poll_id, reply_to_message_id, is_pinned, pinned_by, pinned_at, created_at
- `polls` - id, question, group_id, created_by, allow_multiple_answers, is_closed, closed_at, expires_at, created_at
- `poll_options` - id, poll_id, option_text, display_order
- `poll_votes` - id, poll_id, poll_option_id, user_id, created_at
- `sessions` - id, group_id, title, description, session_type, scheduled_date, start_time, end_time, status, created_at
- `session_participants` - id, session_id, user_id, attendance_status
- `artifacts` - id, session_id, uploaded_by, file_url, file_type, file_name, created_at
- `artifact_embeddings` - id, artifact_id, chunk_text, chunk_index, embedding, metadata
- `notifications` - id, related_entity_type, related_entity_id, sender_id, title, message, created_at
- `user_notifications` - id, notification_id, recipient_id, is_read, created_at
- `qa_conversations` - id, group_id, user_id, created_at, updated_at
- `qa_messages` - id, conversation_id, role, content, created_at
- `password_resets` - id, user_id, reset_token, expires_at, used

</details>

You also need two **Storage buckets** in Supabase:
- `avatars` - for profile images and group cover images
- `artifacts` - for session file uploads

For each bucket, go to **Storage > Policies** and add a policy that allows `INSERT` for `anon` and `authenticated` roles.

To enable the **vector similarity search** used by the AI Q&A feature, run this in the SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then add a `vector` column to `artifact_embeddings`:

```sql
ALTER TABLE artifact_embeddings ADD COLUMN IF NOT EXISTS embedding vector(384);
```

And create the similarity search function:

```sql
CREATE OR REPLACE FUNCTION match_artifact_chunks(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  artifact_ids uuid[]
)
RETURNS TABLE (
  id uuid,
  artifact_id uuid,
  chunk_text text,
  chunk_index int,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ae.id,
    ae.artifact_id,
    ae.chunk_text,
    ae.chunk_index,
    ae.metadata,
    1 - (ae.embedding <=> query_embedding) AS similarity
  FROM artifact_embeddings ae
  WHERE ae.artifact_id = ANY(artifact_ids)
    AND 1 - (ae.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

### 5. Start the backend server

```bash
npm run dev
```

The server will start on `http://localhost:5000`. You should see:

```
SkillSwap API running on port 5000
Email service ready
Socket.io initialized
```

---

## Frontend Setup

### 1. Navigate to the frontend folder

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set the backend URL

Open `src/services/api.ts` and `src/services/socketService.ts` and replace the IP address with your own local IP:

**`src/services/api.ts`** - line ~8:
```ts
const API_URL = "http://192.168.x.x:5000/api";
```

**`src/services/socketService.ts`** - line ~4:
```ts
const SOCKET_URL = "http://192.168.x.x:5000";
```

> Use the same IP you put in the backend `.env` file.

### 4. Start the Expo development server

```bash
npm start
```

This opens the Expo Dev Tools in your browser and shows a QR code.

### 5. Run the app

**On a physical device:** Install [Expo Go](https://expo.dev/client) and scan the QR code.

**On an Android emulator:** Press `a` in the terminal.

**On an iOS simulator:** Press `i` in the terminal (Mac only).

---

## Running Both Together

Open two terminal windows:

```bash
# Terminal 1 - backend
cd backend && npm run dev

# Terminal 2 - frontend
cd frontend && npm start
```

---

## Default Test Flow

1. Register a new account
2. Complete your profile (nickname, DOB, gender, education, and select at least 2 teaching + 2 learning skills)
3. As a **teacher**: go to a teaching skill → create a group → create a session → upload a PDF
4. As a **learner** (second account): find and join the group → tap the robot button to open the Q&A and ask a question about the uploaded material

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo managed workflow) |
| Language | TypeScript |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Real-time | Socket.IO |
| AI / Q&A | Groq API (llama-3.3-70b) + RAG pipeline |
| Embeddings | @xenova/transformers (all-MiniLM-L6-v2) |
| Auth | JWT |
| Email | Nodemailer (Gmail SMTP) |
