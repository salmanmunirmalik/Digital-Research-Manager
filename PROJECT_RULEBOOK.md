# Digital Research Manager - Development Rules

## CORE PRINCIPLES

### 1. BUILD FULL CRUD FUNCTIONS OUT
- Always implement complete Create, Read, Update, Delete operations
- Never leave partial implementations
- Test all CRUD endpoints thoroughly
- Document all API endpoints and their usage
- **Specific to DRM**: Implement full CRUD for users, labs, protocols, experiments, inventory, and all research data

### 2. SCHEMA AND DATABASE MANAGEMENT
- Use PostgreSQL for production-ready database management
- Never use hardcoded mock data - always work with real database
- Create migrations for schema changes
- Maintain data integrity at all times
- **Specific to DRM**: Implement proper relationships between users, labs, projects, and research data

### 3. TESTING REQUIREMENTS
- Write tests for every feature as it's built
- Include unit tests, integration tests, and end-to-end tests
- Test all CRUD operations
- Test error handling and edge cases
- Include CORS testing for API endpoints
- **Specific to DRM**: Test authentication, role-based access control, and data privacy features

### 4. ANALYSIS AND QUALITY ASSURANCE
- Analyze code performance and optimization opportunities
- Review security implications of each implementation
- Check for accessibility compliance
- Validate responsive design across devices
- **Specific to DRM**: Ensure research data security and privacy compliance

### 5. FIX BEFORE MOVING ON
- Resolve all linting errors before proceeding
- Fix all failing tests before new features
- Address security vulnerabilities immediately
- Optimize performance issues before adding complexity

## TECHNICAL STANDARDS

### Development Environment
- Use npm for package management (as per current setup)
- Development server runs on port 5001 (backend) and 5173 (frontend)
- PostgreSQL database for development and production
- Always consider user journey optimization
- Optimize for desktop, tablet, and mobile experiences

### Code Quality
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Comprehensive error handling
- Proper logging and monitoring
- Follow React best practices and hooks guidelines

### Database Management
- Use migrations for all schema changes
- Maintain referential integrity
- Implement proper indexing
- Regular database backups
- Data validation at multiple layers
- **Specific to DRM**: Implement proper user role and permission schemas

### Testing Strategy
- Jest for unit testing
- React Testing Library for component tests
- Cypress for end-to-end testing
- API testing with proper mock data
- Performance testing for critical paths

### Security Standards
- JWT for authentication
- CSRF protection
- CORS configuration
- Role-based access control (RBAC)
- Data privacy controls
- NO CREDENTIALS POSTED ONLINE - only through environment settings

### CLI Tools Setup
- GitHub integration for version control
- Render for deployment
- Google Cloud (when needed)
- Stripe (when needed)

## WORKFLOW PROCESS

1. **Plan** - Understand requirements fully before coding
2. **Design** - Create schema and API design first
3. **Implement** - Build full CRUD functionality
4. **Test** - Comprehensive testing at all levels
5. **Analyze** - Code review and performance analysis
6. **Fix** - Address all issues before proceeding
7. **Document** - Update documentation and comments
8. **Deploy** - Only when all tests pass and code is optimized

## NEVER COMPROMISE ON

- Security best practices
- Data integrity
- Test coverage
- Performance optimization
- User experience quality
- Code maintainability
- Research data privacy and security
- Image and Video optimization (WebP files, compression)

## PROJECT-SPECIFIC REQUIREMENTS

### User Management System
- **Roles**: Admin, Principal Researcher, Co Supervisor, Researcher, Student
- **Lab Management**: Principal Researchers can create lab accounts and manage team access
- **Permission Levels**: Granular control over data access and sharing
- **Privacy Controls**: Data owners decide access levels (Personal, Lab, Global)

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Session management
- Secure password handling

### Data Privacy & Sharing
- Personal data remains private by default
- Lab-level sharing with controlled access
- Global sharing with explicit user consent
- Audit trail for all data access

### Core Features Priority
1. **User Management & Authentication**
2. **Lab Management & Team Access**
3. **Personal Dashboard** (Calendar, Tasks, Sticky Notes, Experiment Updates)
4. **Protocol Library** with sharing controls
5. **Lab Notebook** with privacy options
6. **Inventory & Instruments** management
7. **AI Features** (later phase)
8. **Global Data Sharing** (later phase)

## SUGGESTED IMPROVEMENTS

- AI-powered research insights and recommendations
- Real-time collaboration tools
- Advanced analytics and reporting
- Mobile-first design for field research
- Integration with external research databases
- Automated data backup and recovery
- Performance monitoring and optimization
- Accessibility compliance for research tools
