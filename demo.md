# ResearchLabSync Fullstack Demo

## 🚀 Quick Demo Guide

Your fullstack application is now running successfully! Here's how to test it:

### Backend API (Port 5001)
- **Health Check**: `http://localhost:5001/api/health`
- **API Base**: `http://localhost:5001/api`

### Frontend (Port 5173)
- **Main App**: `http://localhost:5173`
- **Vite Dev Server**: Running with hot reload

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:5001/api/health
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Test Protected Endpoints
```bash
# Get your token from the login response above
TOKEN="your-jwt-token-here"

# Get all protocols (requires authentication)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/protocols

# Get all inventory items
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/inventory

# Get team members
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/team
```

## 🔐 Default User Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Principal Investigator

## 📱 Frontend Features

1. **Navigate to** `http://localhost:5173`
2. **Login** with admin credentials
3. **Explore** the different sections:
   - Protocols Management
   - Digital Lab Notebook
   - Inventory Management
   - Instrument Booking
   - Calculator Hub
   - Team Management
   - Data Results

## 🗄️ Database

- **SQLite Database**: `./data/researchlab.db`
- **Tables Created**: Users, Protocols, Projects, Experiments, Notebook Entries, Inventory, Instruments, etc.
- **Initial Data**: Admin user, sample instruments, sample inventory items

## 🛠️ Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start only backend
npm run dev:backend

# Start only frontend
npm run dev:frontend

# Setup database
npm run db:setup

# Build for production
npm run build
```

## 🔧 API Endpoints Available

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Core Features
- `GET /api/protocols` - List protocols
- `GET /api/notebook/projects` - List projects
- `GET /api/inventory` - List inventory
- `GET /api/instruments` - List instruments
- `GET /api/team` - List team members
- `GET /api/data` - List results
- `GET /api/calculators/scratchpad` - Get calculator history

## 🎯 Next Steps

1. **Test the frontend** by logging in and navigating through the app
2. **Create new protocols** using the protocol form
3. **Add inventory items** to test the inventory management
4. **Book instruments** to test the booking system
5. **Create lab notebook entries** to test the digital notebook
6. **Customize** the application for your specific lab needs

## 🐛 Troubleshooting

- **Port conflicts**: If port 5001 is busy, change it in `.env`
- **Database issues**: Run `npm run db:setup` to recreate the database
- **Frontend not loading**: Check if Vite is running on port 5173
- **API errors**: Check the backend logs for detailed error messages

## 🎉 Congratulations!

You now have a fully functional fullstack research lab management system with:
- ✅ React frontend with TypeScript
- ✅ Node.js backend with Express
- ✅ SQLite database with proper schema
- ✅ JWT authentication
- ✅ RESTful API endpoints
- ✅ Role-based access control
- ✅ Modern development setup with hot reload
