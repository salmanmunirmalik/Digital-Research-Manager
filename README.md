# Digital Research Manager - Advanced Research Lab Management Platform

A comprehensive fullstack application for managing research laboratory protocols, experiments, inventory, and team collaboration with advanced AI-powered features including global data sharing, automated paper generation, and intelligent research insights.

## Features

### Frontend (React + TypeScript)
- **Protocol Management**: Create, edit, fork, and share lab protocols with advanced privacy controls
- **Digital Personal NoteBook**: Organize experiments and results with AI-powered insights and global collaboration
- **Inventory Management**: Track reagents, antibodies, and lab supplies with smart alerts
- **Instrument Booking**: Schedule and manage lab equipment usage with conflict resolution
- **Calculator Hub**: Scientific calculators for common lab calculations with result history
- **Team Collaboration**: Real-time team status and project management with role-based access
- **Data Management**: Store and analyze experimental results with AI-powered insights
- **Global Data Sharing**: Share and request research data globally with trusted collaborators
- **AI Paper Suggestions**: Get personalized paper recommendations based on research interests
- **Automated Presentations**: Generate presentations and reports from your research data
- **Conference News**: Stay updated with upcoming conferences and workshops in your field
- **Help Forum**: Collaborative problem-solving with lab colleagues and global science community

### Backend (Node.js + Express + SQLite)
- **RESTful API**: Complete CRUD operations for all entities
- **Authentication**: JWT-based user authentication and authorization
- **Database**: SQLite database with proper relationships and constraints
- **File Uploads**: Support for protocol attachments and images
- **Role-based Access Control**: Different permission levels for users

## Tech Stack

### Frontend
- React 19 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Vite for build tooling

### Backend
- Node.js with Express
- TypeScript for type safety
- SQLite database with SQLite3
- JWT authentication
- bcrypt for password hashing
- CORS and security middleware

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd researchlab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   npm run db:setup
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the frontend (Vite dev server) and backend (Express server) concurrently.

### Development Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend dev server
- `npm run dev:backend` - Start only the backend server
- `npm run build` - Build the frontend for production
- `npm run build:backend` - Build the backend TypeScript
- `npm run start` - Start the production server
- `npm run db:setup` - Initialize the database and create tables

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Protocols
- `GET /api/protocols` - List all protocols
- `GET /api/protocols/:id` - Get protocol details
- `POST /api/protocols` - Create new protocol
- `PUT /api/protocols/:id` - Update protocol
- `DELETE /api/protocols/:id` - Delete protocol
- `POST /api/protocols/:id/fork` - Fork existing protocol

### Personal NoteBook
- `GET /api/notebook/projects` - List user projects
- `POST /api/notebook/projects` - Create new project
- `GET /api/notebook/projects/:id` - Get project with experiments
- `POST /api/notebook/projects/:id/experiments` - Create experiment
- `POST /api/notebook/experiments/:id/entries` - Create notebook entry

### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Remove item

### Instruments
- `GET /api/instruments` - List all instruments
- `GET /api/instruments/:id` - Get instrument with bookings
- `POST /api/instruments/:id/book` - Book instrument

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `protocols` - Lab protocols and procedures
- `protocol_steps` - Individual steps within protocols
- `projects` - Research projects
- `experiments` - Experiments within projects
- `notebook_entries` - Personal NoteBook entries
- `content_blocks` - Rich content within notebook entries
- `inventory_items` - Lab supplies and reagents
- `instruments` - Lab equipment
- `bookings` - Instrument reservations
- `results` - Experimental results and data

## Default Login

After running `npm run db:setup`, you can log in with:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Principal Investigator

## Environment Variables

Create a `.env` file based on `env.example`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key-here
```

## Project Structure

```
researchlab/
├── components/          # React components
├── pages/              # Page components
├── services/           # API services and utilities
├── types/              # TypeScript type definitions
├── data/               # Mock data and database files
├── server/             # Backend server
│   ├── routes/         # API route handlers
│   ├── middleware/     # Express middleware
│   ├── database/       # Database setup and utilities
│   └── index.ts        # Main server file
├── App.tsx             # Main React app
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue on GitHub or contact the development team.
