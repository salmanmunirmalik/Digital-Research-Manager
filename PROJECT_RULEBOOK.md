# Digital Research Lab Platform - Project Rulebook

## CORE PRINCIPLES

### 1. BUILD FULL CRUD FUNCTIONS OUT
- ✅ Always implement complete Create, Read, Update, Delete operations
- ✅ Never leave partial implementations
- ✅ Test all CRUD endpoints thoroughly
- ✅ Document all API endpoints and their usage
- ✅ Ensure proper error handling for all CRUD operations
- ✅ Implement proper validation for all inputs

### 2. SCHEMA AND DATABASE MANAGEMENT
- ✅ Update the local PostgreSQL database schema as we develop
- ✅ Never use hardcoded mock data - always work with real database
- ✅ Create migrations for schema changes
- ✅ Maintain data integrity at all times
- ✅ Use proper foreign key relationships
- ✅ Implement database indexing for performance
- ✅ Regular backup strategies

### 3. TESTING REQUIREMENTS
- ✅ Write tests for every feature as it's built
- ✅ Include unit tests, integration tests, and end-to-end tests
- ✅ Test all CRUD operations
- ✅ Test error handling and edge cases
- ✅ Include CORS testing for API endpoints
- ✅ Test authentication and authorization flows
- ✅ Performance testing for critical user journeys

### 4. ANALYSIS AND QUALITY ASSURANCE
- ✅ Analyze code performance and optimization opportunities
- ✅ Review security implications of each implementation
- ✅ Check for accessibility compliance (WCAG 2.1 AA)
- ✅ Validate responsive design across devices
- ✅ Code review process for all changes
- ✅ Regular security audits

### 5. FIX BEFORE MOVING ON
- ✅ Resolve all linting errors before proceeding
- ✅ Fix all failing tests before new features
- ✅ Address security vulnerabilities immediately
- ✅ Optimize performance issues before adding complexity
- ✅ Ensure no memory leaks or resource wastage

## TECHNICAL STANDARDS

### Development Environment
- ✅ Use NPM/PNPM for all package management
- ✅ Development server runs on port 5173 (frontend) and 5001 (backend)
- ✅ Local PostgreSQL database for development
- ✅ Always consider user journey optimization
- ✅ Optimize for desktop, tablet, and mobile experiences
- ✅ Environment-specific configurations
- ✅ Hot module replacement for development efficiency

### Code Quality Standards
- ✅ TypeScript for type safety and better developer experience
- ✅ ESLint and Prettier for consistent code formatting
- ✅ Comprehensive error handling with proper error boundaries
- ✅ Proper logging and monitoring for production
- ✅ Follow React best practices and hooks guidelines
- ✅ Component composition over inheritance
- ✅ Proper state management patterns
- ✅ Code splitting and lazy loading for performance

### Database Management
- ✅ Use migrations for all schema changes
- ✅ Maintain referential integrity with proper foreign keys
- ✅ Implement proper indexing for query performance
- ✅ Regular database backups and disaster recovery
- ✅ Data validation at multiple layers (client, API, database)
- ✅ Connection pooling for scalability
- ✅ Query optimization and monitoring

### Testing Strategy
- ✅ Jest for unit testing
- ✅ React Testing Library for component tests
- ✅ Cypress for end-to-end testing
- ✅ API testing with proper test data
- ✅ Performance testing for critical paths
- ✅ Visual regression testing
- ✅ Accessibility testing
- ✅ Cross-browser compatibility testing

### Security Standards
- ✅ JWT for authentication with proper expiration
- ✅ CSRF protection for state-changing operations
- ✅ CORS properly configured for allowed origins
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting on API endpoints
- ✅ Secure password hashing (bcrypt)
- ✅ HTTPS enforcement in production
- ✅ Security headers (CSP, HSTS, etc.)
- ⚠️  NO CREDENTIALS POSTED ONLINE - only through environment variables

### Media Optimization
- ✅ Images served as WebP with fallbacks
- ✅ Video compression and adaptive streaming
- ✅ Lazy loading for media content
- ✅ CDN integration for static assets
- ✅ Image optimization and responsive images
- ✅ Progressive image loading

### CLI INTEGRATIONS (Production Ready)
- ✅ Stripe CLI for payment processing
- ✅ Google Cloud CLI for cloud services
- ✅ GitHub CLI for repository management
- ✅ Render CLI for deployment
- ✅ PostgreSQL CLI tools
- ✅ Docker for containerization

## WORKFLOW PROCESS

### 1. **PLAN** - Requirements Analysis
- [ ] Understand user stories and acceptance criteria
- [ ] Identify all stakeholders and their needs
- [ ] Define scope and boundaries clearly
- [ ] Create wireframes and user flow diagrams
- [ ] Estimate effort and timeline

### 2. **DESIGN** - Architecture First
- [ ] Create database schema and relationships
- [ ] Design API endpoints with proper REST conventions
- [ ] Define component architecture and state flow
- [ ] Security architecture and threat modeling
- [ ] Performance considerations and bottlenecks

### 3. **IMPLEMENT** - Full Stack Development
- [ ] Build complete CRUD functionality
- [ ] Implement proper error handling
- [ ] Add input validation at all layers
- [ ] Ensure responsive design
- [ ] Follow accessibility guidelines

### 4. **TEST** - Comprehensive Coverage
- [ ] Unit tests for all functions
- [ ] Integration tests for API endpoints
- [ ] Component tests for UI
- [ ] End-to-end user journey tests
- [ ] Performance and load testing

### 5. **ANALYZE** - Quality Assurance
- [ ] Code review with focus on security
- [ ] Performance profiling and optimization
- [ ] Accessibility audit
- [ ] Security vulnerability scanning
- [ ] Code quality metrics review

### 6. **FIX** - Zero Compromise
- [ ] Address all linting errors
- [ ] Fix failing tests
- [ ] Resolve security issues
- [ ] Optimize performance bottlenecks
- [ ] Ensure cross-browser compatibility

### 7. **DOCUMENT** - Knowledge Sharing
- [ ] Update API documentation
- [ ] Code comments for complex logic
- [ ] User documentation
- [ ] Deployment guides
- [ ] Troubleshooting guides

### 8. **DEPLOY** - Production Ready
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Database migrations tested
- [ ] Monitoring and alerting configured

## NEVER COMPROMISE ON

### Security Best Practices
- ✅ Authentication and authorization at every level
- ✅ Input validation and sanitization
- ✅ Secure communication (HTTPS/WSS)
- ✅ Principle of least privilege
- ✅ Regular security updates

### Data Integrity
- ✅ ACID compliance for critical operations
- ✅ Backup and recovery procedures
- ✅ Data validation at multiple layers
- ✅ Audit trails for sensitive operations
- ✅ Referential integrity constraints

### Test Coverage
- ✅ Minimum 80% code coverage
- ✅ Critical path coverage at 100%
- ✅ Integration test coverage
- ✅ End-to-end scenario coverage
- ✅ Performance regression tests

### Performance Optimization
- ✅ Database query optimization
- ✅ Frontend bundle optimization
- ✅ Caching strategies
- ✅ CDN utilization
- ✅ Mobile performance targets

### User Experience Quality
- ✅ Responsive design across all devices
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Fast loading times (< 3 seconds)
- ✅ Intuitive navigation
- ✅ Error handling with user-friendly messages

### Code Maintainability
- ✅ Clean, readable code
- ✅ Proper documentation
- ✅ Modular architecture
- ✅ Consistent coding standards
- ✅ Regular refactoring

## SPECIFIC IMPLEMENTATION GUIDELINES

### Research Lab Platform Features
- ✅ Multi-tenant lab management
- ✅ Role-based access control (Admin, PI, Researcher, Student)
- ✅ Protocol management with version control
- ✅ Personal NoteBook with collaborative editing
- ✅ Inventory tracking with low-stock alerts
- ✅ Instrument booking and management
- ✅ Data analytics and visualization
- ✅ Real-time collaboration features

### User Roles and Permissions
- **Admin**: Full system access, user management, system configuration
- **Principal Investigator**: Lab management, member management, protocol approval
- **Researcher**: Lab operations, protocol creation, data entry
- **Student**: Limited access, supervised operations, read-only protocols

### Performance Targets
- ✅ Page load time < 2 seconds
- ✅ API response time < 500ms
- ✅ Database query time < 100ms
- ✅ 99.9% uptime
- ✅ Mobile performance score > 90

## SUGGESTED IMPROVEMENTS

### Infrastructure Enhancements
1. **Implement Redis for caching** - Session storage, frequently accessed data
2. **Add Elasticsearch** - Advanced search capabilities across all content
3. **Implement WebSocket** - Real-time collaboration and notifications
4. **Add CDC (Change Data Capture)** - Real-time data synchronization
5. **Implement message queues** - Background job processing

### Development Process
1. **GitHub Actions CI/CD** - Automated testing and deployment
2. **Dependabot integration** - Automated dependency updates
3. **Code quality gates** - SonarQube integration
4. **Performance monitoring** - New Relic or DataDog integration
5. **Error tracking** - Sentry integration

### Security Enhancements
1. **Multi-factor authentication** - Enhanced security for sensitive operations
2. **OAuth integration** - Google, GitHub, institutional SSO
3. **API rate limiting** - DDoS protection
4. **Security scanning** - Automated vulnerability detection
5. **Audit logging** - Comprehensive activity tracking

### User Experience
1. **Progressive Web App** - Offline capabilities
2. **Dark mode support** - User preference accommodation
3. **Advanced search** - Faceted search across all content
4. **Mobile app** - Native iOS/Android applications
5. **Keyboard shortcuts** - Power user efficiency

### Analytics and Insights
1. **Usage analytics** - User behavior tracking
2. **Performance metrics** - Real-time monitoring dashboards
3. **Predictive analytics** - Inventory forecasting, usage patterns
4. **A/B testing framework** - Feature optimization
5. **Business intelligence** - Lab productivity insights

## QUESTIONS FOR CLARITY

### Technical Architecture
1. **Microservices vs Monolith**: Should we consider breaking into microservices for scalability?
2. **Real-time Features**: Do you need real-time collaboration (live cursors, simultaneous editing)?
3. **Mobile Strategy**: Native apps or PWA for mobile experience?
4. **Data Warehouse**: Do you need analytical data warehouse for reporting?

### Security and Compliance
1. **Compliance Requirements**: Any specific regulatory compliance (HIPAA, SOX, etc.)?
2. **Data Residency**: Any requirements for data location/sovereignty?
3. **Backup Strategy**: RTO/RPO requirements for disaster recovery?
4. **Audit Requirements**: What level of audit logging is needed?

### Business Logic
1. **Multi-tenancy**: Should labs be completely isolated or allow cross-lab collaboration?
2. **Billing/Subscription**: Will this be a SaaS product with subscription tiers?
3. **Integration Requirements**: Need to integrate with existing lab equipment/software?
4. **Workflow Automation**: Should we include workflow automation capabilities?

### Performance and Scale
1. **Expected Load**: How many concurrent users per lab?
2. **Data Volume**: Expected data storage requirements?
3. **Geographic Distribution**: Multiple regions/CDN requirements?
4. **Offline Capabilities**: Should the app work offline?

Please clarify these points so I can implement the most appropriate solutions for your specific needs.
