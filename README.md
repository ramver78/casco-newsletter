# Casco Newsletter

A secure internal newsletter application for Casco Auto employees with role-based access control and mandatory MFA.

## Features

- 📰 **Newsletter Management** - Create, edit, and publish articles
- 🔐 **Mandatory MFA** - Two-factor authentication required for all users
- 👥 **Role-Based Access Control**
  - **Admin** - Full access, user management
  - **Editor** - Create and manage articles
  - **Reader** - View published articles
- 📧 **Domain Restriction** - Only @cascoauto.com emails can self-register
- 📱 **Mobile Friendly** - Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, React Router
- **Backend**: Express.js, Node.js
- **Authentication**: JWT + TOTP MFA
- **Storage**: JSON file-based database

## Getting Started

### Option 1: Docker (Recommended for Production)

#### Prerequisites
- Docker & Docker Compose

#### Quick Start
```bash
# Clone the repository
git clone https://github.com/ramver78/casco-newsletter.git
cd casco-newsletter

# Create environment file
cp .env.example .env
# Edit .env and set a secure JWT_SECRET

# Build and run (for Linux AMD64)
docker-compose up -d --build

# View logs
docker-compose logs -f
```

The application will be available at http://localhost:80

#### Docker Commands
```bash
# Stop containers
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# View API logs
docker-compose logs -f api

# Access API container shell
docker exec -it casco-newsletter-api sh
```

---

### Option 2: Local Development

#### Prerequisites

- Node.js 18+ 
- npm or yarn

#### Installation

1. Clone the repository:
```bash
git clone https://github.com/ramver78/casco-newsletter.git
cd casco-newsletter
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd api
npm install
```

### Running the Application

1. Start the backend API (from project root):
```bash
cd api
node server.js
```
API runs on http://localhost:3005

2. Start the frontend (in a new terminal):
```bash
npm start
```
Frontend runs on http://localhost:3000

## Default Admin Account

- **Email**: ramon.vermin@cascoauto.com
- **Password**: admin1234

> Note: MFA setup is required on first login.

## Environment Variables

### Backend (api/.env)
```
PORT=3005
JWT_SECRET=your-secret-key
```

## License

Private - Casco Auto Internal Use Only
