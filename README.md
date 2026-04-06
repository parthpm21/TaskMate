# TaskMate 🛠️

> A local task marketplace — post tasks, get bids, pay securely. Built with MERN stack + Socket.io + Razorpay.

---

## What It Does

TaskMate is a two-sided gig marketplace where:
- **Posters** publish tasks (delivery, academic help, coding, cleaning, etc.) with a budget and deadline
- **Taskers** browse the feed, place competitive bids, and earn money
- **Payments** are held in escrow via Razorpay and released only when the task is complete
- **Chat** is built-in and real-time — no phone number sharing needed

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Realtime | Socket.io |
| Auth | JWT (custom) |
| Payments | Razorpay |
| Media | Cloudinary |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
taskmate/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Landing, Browse, TaskDetail, PostTask, Dashboard, Profile, Chat, Login, Register
│   │   ├── components/      # Navbar, TaskCard
│   │   ├── context/         # AuthContext, SocketContext
│   │   └── utils/           # axios instance with JWT interceptor
│   └── vite.config.js       # Proxy /api → localhost:5000
│
├── server/                  # Express backend
│   ├── models/              # User, Task, Bid, Chat, Review
│   ├── routes/              # auth, tasks, bids, chats, payments, reviews, users
│   ├── middleware/          # protect (JWT auth)
│   ├── socket.js            # Socket.io event handlers
│   └── index.js             # Entry point
│
└── package.json             # Root scripts to run both together
```

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/parthpm21/taskmate.git
cd taskmate
npm run install:all
```

### 2. Set up the server environment

```bash
cd server
cp .env.example .env
```

Fill in your `.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskmate
JWT_SECRET=some_random_secret_string_here

# Get from cloudinary.com (free account)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Get from razorpay.com (test mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3. Run everything

```bash
# From root folder — starts both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:5000/api  
- Health check: http://localhost:5000/api/health

---

## Setting Up MongoDB Atlas (Free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user (username + password)
4. Whitelist your IP (or use `0.0.0.0/0` for dev)
5. Click **Connect → Drivers** and copy the connection string
6. Replace `<password>` in the string and paste into `MONGO_URI`

---

## Setting Up Razorpay (Test Mode)

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys**
3. Generate test mode keys
4. Paste `Key ID` and `Key Secret` into your `.env`
5. Test card: `4111 1111 1111 1111`, any future date, any CVV

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user (🔒) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Browse feed (filters: category, sort, search, page) |
| GET | `/api/tasks/:id` | Task detail |
| POST | `/api/tasks` | Create task (🔒) |
| PUT | `/api/tasks/:id` | Edit task (🔒 poster only) |
| DELETE | `/api/tasks/:id` | Cancel task (🔒 poster only) |
| PUT | `/api/tasks/:id/complete` | Mark complete (🔒) |
| PUT | `/api/tasks/:id/dispute` | Raise dispute (🔒) |
| GET | `/api/tasks/my/posted` | My posted tasks (🔒) |
| GET | `/api/tasks/my/accepted` | Tasks I'm doing (🔒) |

### Bids
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bids/task/:taskId` | Get bids for task (🔒 poster only) |
| POST | `/api/bids` | Place a bid (🔒) |
| PUT | `/api/bids/:id/accept` | Accept bid → creates chat (🔒 poster) |
| PUT | `/api/bids/:id/start` | Start task (🔒 tasker) |

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats/task/:taskId` | Get chat for task (🔒 participants) |
| POST | `/api/chats/task/:taskId/message` | Send message (🔒) |
| GET | `/api/chats/my` | All my chats (🔒) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order (🔒) |
| POST | `/api/payments/verify` | Verify payment signature (🔒) |
| POST | `/api/payments/release` | Release escrow to tasker (🔒 poster) |

### Reviews & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit a review (🔒) |
| GET | `/api/reviews/user/:userId` | Get reviews for a user |
| GET | `/api/users/:id` | Public profile |
| PUT | `/api/users/profile` | Update own profile (🔒) |

---

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user:online` | client → server | Register as online |
| `chat:join` | client → server | Join task chat room |
| `chat:message` | both | Send/receive a message |
| `task:statusChange` | client → server | Notify status update |
| `task:updated` | server → client | Task status changed |
| `bid:new` | server → client | New bid placed |
| `payment:released` | server → client | Payment released |
| `users:online` | server → client | List of online user IDs |

---

## Deployment

### Backend on Render (free tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set root to `server/`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all env variables in Render dashboard

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect repo, set root to `client/`
3. Add env variable: `VITE_API_URL=https://your-render-url.onrender.com`
4. Update `vite.config.js` proxy target to your Render URL for production
5. Deploy

---

## Features Roadmap

- [x] User auth (JWT)
- [x] Post & browse tasks with filters
- [x] Bidding system
- [x] Real-time chat (Socket.io)
- [x] Razorpay escrow payments
- [x] Two-way reviews & ratings
- [x] Dashboard for poster & tasker
- [x] Public profiles
- [ ] Image uploads via Cloudinary
- [ ] Google Maps location picker
- [ ] Push notifications (Firebase FCM)
- [ ] Admin panel for disputes
- [ ] AI task price suggestions

---

## Author

Built by **Parth** — [GitHub @parthpm21](https://github.com/parthpm21)
