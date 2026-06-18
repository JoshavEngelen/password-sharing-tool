# Password Sharing Tool - Secure SPA

A privacy-focused, end-to-end encrypted password and secret sharing application. Sender and recipient browsers handle all encryption/decryption client-side, ensuring the server never has access to plaintext secrets.

## Overview

This is a Single Page Application (SPA) for securely sharing sensitive information like passwords, API keys, or confidential messages. The application uses AES encryption to ensure secrets are encrypted before leaving the sender's browser and can only be decrypted by the recipient.

## Architecture & Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PASSWORD SHARING FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. SENDER SIDE (Browser)
   ├─ User enters secret
   ├─ Generate AES Key (encryption key)
   └─ Encrypt secret using AES Key
        │
        ├─ Ciphertext → [Vile_Shadow SPA]
        └─ AES Key → [URL Fragment #key]

2. VILE_SHADOW SPA (Browser)
   ├─ Receive ciphertext
   ├─ Create metadata (timestamp, recipient info)
   └─ Send to Laravel API

3. LARAVEL API (Backend)
   ├─ Receive: { ciphertext, metadata }
   ├─ Store in Redis Cache
   └─ Return: { token, expires_in }

4. SHARED LINK
   └─ URL Format: https://example.com?key=TOKEN#key=AES_KEY
      (Token in query params, AES Key in URL fragment for browser-only access)

5. RECIPIENT SIDE (Browser)
   ├─ Click shared link
   ├─ Extract token from URL params
   ├─ Extract AES Key from URL fragment
   ├─ Fetch ciphertext from API using token
   ├─ Decrypt locally using AES Key
   └─ Display plaintext secret

6. REDIS CACHE (Docker Container)
   └─ One-time read: Token retrieves ciphertext once, then deleted automatically
```

### Key Security Features

- **Client-Side Encryption**: All encryption/decryption happens in the browser
- **Server-Side Ignorance**: Backend never sees plaintext secrets
- **One-Time Read**: Secrets are automatically deleted after first retrieval
- **AES-256 Encryption**: Industry-standard encryption algorithm
- **URL Fragment for Keys**: AES keys stay in browser (never sent to server)
- **Automatic Expiration**: Secrets expire after configurable TTL (default: 15 minutes)

## Tech Stack

### Frontend
- **React** + **TypeScript** - UI framework and type safety
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Styling
- **Web Crypto API** - Client-side AES encryption

### Backend
- **Laravel 11** - PHP web framework
- **Redis** - In-memory cache for secret storage (run via Docker Compose)
- **Composer** - PHP package manager

## Project Structure

```
password-sharing-tool/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── crypto.ts        # Encryption/decryption logic
│   │   ├── apiClient.ts     # API communication
│   │   └── App.tsx          # Main app component
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/ # API controllers
│   │   └── Models/
│   ├── routes/
│   │   └── web.php          # API routes
│   ├── config/              # Configuration
│   ├── database/            # Migrations & seeders
│   └── artisan
│
└── docker-compose.yml       # Multi-container setup
```

## Setup & Installation

### Prerequisites
- **Docker & Docker Compose** (for Redis only)
- **Node.js 18+** (for frontend development)
- **PHP 8.2+** (for backend development)
- **Composer** (for PHP dependencies)

### Quick Start

#### 1. Start Redis (Docker)

```bash
# From project root
docker-compose up -d

# Redis will be available at localhost:6379
```

#### 2. Setup Backend (Local PHP)

```bash
cd backend

# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Start server
php artisan serve
# Backend API: http://localhost:8000
```

#### 3. Setup Frontend (Local Node.js)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Frontend: http://localhost:5174
```

All three services will now be running:
- **Frontend SPA**: http://localhost:5174
- **Backend API**: http://localhost:8000
- **Redis Cache**: localhost:6379

## API Documentation

### Create Secret (Store)
**POST** `/api/secrets`

Request:
```json
{
  "ciphertext": "encrypted_secret_data",
  "expires_in": 900
}
```

Response (201 Created):
```json
{
  "token": "p4TKuQpG3ptzlT82AdhCG6af640CmKIi",
  "expires_in": 900
}
```

Parameters:
- `ciphertext` (required): AES-encrypted secret
- `expires_in` (optional): TTL in seconds (60-21600, default: 900)

### Retrieve Secret (One-Time Read)
**GET** `/api/secrets/{token}`

Response (200 OK):
```json
{
  "ciphertext": "encrypted_secret_data"
}
```

- Returns 404 if token doesn't exist or already consumed
- Automatically deletes secret after retrieval (one-time read)

## Usage Workflow

### Sending a Secret

1. Open the application
2. Enter your secret (password, API key, etc.)
3. Click "Generate Shareable Link"
4. A link is generated: `https://example.com?key=TOKEN#key=AES_KEY`
5. Copy and send the link to recipient (via email, chat, etc.)

### Receiving a Secret

1. Click the shared link
2. The application automatically decrypts the secret
3. Secret is displayed in plaintext
4. Secret is deleted from server (automatic, one-time read)
5. Clear browser history for security

## Environment Variables

### Backend (.env)
```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=null
SECRET_TTL_SECONDS=900
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

## Testing

### Backend Tests
```bash
cd backend
php artisan test
```

### Frontend Tests (if configured)
```bash
cd frontend
npm run test
```

## Security Considerations

- ⚠️ **Always use HTTPS** in production
- ⚠️ **Secure Redis** with password authentication
- ⚠️ **Clear browser history** after viewing secrets
- ⚠️ **URL fragments** (#key) are never sent to server
- ⚠️ **Set appropriate TTL** for your use case
- ✅ **Client-side validation** prevents plaintext storage
- ✅ **One-time read** prevents secret reuse
- ✅ **Automatic expiration** prevents long-term access

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License.