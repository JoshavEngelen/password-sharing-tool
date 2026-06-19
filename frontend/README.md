# Password Sharing Tool - Frontend

Vite Shadcn React + TypeScript SPA for securely sharing encrypted secrets.

See [main README](../README.md) for architecture, security details, and full setup instructions.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Development

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5174`

## Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:8000/api
```

## Available Scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # Build for production
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

## Key Files

- `src/crypto.ts` - AES encryption/decryption logic
- `src/apiClient.ts` - Backend API communication
- `src/components/forms/` - Secret creation and retrieval forms
