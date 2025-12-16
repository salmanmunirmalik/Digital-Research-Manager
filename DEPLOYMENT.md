# 🚀 Deployment Guide for ResearchLabSync

This guide will help you deploy ResearchLabSync to production.

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Supabase project configured and running
- [ ] Database schema deployed to Supabase
- [ ] Environment variables configured for production
- [ ] JWT secret changed from default value
- [ ] Frontend URL updated for production domain

### ✅ Code Quality
- [ ] All tests passing (if applicable)
- [ ] No linting errors
- [ ] Build process successful
- [ ] Dependencies up to date

### ✅ Security
- [ ] JWT secret is strong and unique
- [ ] CORS configured for production domain
- [ ] Environment variables properly secured
- [ ] No sensitive data in code

## 🏗️ Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend (Vercel)
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Add environment variables from `env.production`
   - Update `FRONTEND_URL` to your Vercel domain

#### Backend (Railway)
1. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   
   # Deploy
   railway up
   ```

2. **Configure Environment Variables**
   - Add all environment variables from `env.production`
   - Update `FRONTEND_URL` to your Vercel domain

### Option 2: Heroku

#### Frontend
1. **Build and Deploy**
   ```bash
   # Build the project
   npm run build
   
   # Create Heroku app
   heroku create your-app-name
   
   # Add buildpack
   heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static
   
   # Deploy
   git push heroku main
   ```

#### Backend
1. **Deploy Backend**
   ```bash
   # Create Heroku app for backend
   heroku create your-backend-name
   
   # Add Node.js buildpack
   heroku buildpacks:set heroku/nodejs
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secure-secret
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   
   # Deploy
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform

1. **Connect Repository**
   - Connect your GitHub repository
   - Select the main branch
   - Choose Node.js as the environment

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

3. **Set Environment Variables**
   - Add all variables from `env.production`

## 🔧 Production Configuration

### Environment Variables
Create a `.env` file in production with:

```env
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-domain.com
JWT_SECRET=your-super-secure-jwt-secret
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build Commands
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Build backend
npm run build:backend

# Start production server
npm start
```

### PM2 Configuration (Optional)
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'researchlabsync',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
```

## 🌐 Domain Configuration

### CORS Settings
Update your backend CORS configuration to allow your production domain:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### SSL/HTTPS
- Ensure your hosting provider supports HTTPS
- Configure SSL certificates
- Redirect HTTP to HTTPS

## 📊 Monitoring & Maintenance

### Health Checks
- Set up health check endpoints
- Monitor application performance
- Set up error logging and alerting

### Database Monitoring
- Monitor Supabase usage and performance
- Set up backup strategies
- Monitor API rate limits

### Performance Optimization
- Enable gzip compression
- Optimize bundle sizes
- Implement caching strategies

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript compilation errors

2. **Environment Variable Issues**
   - Verify all required variables are set
   - Check variable names and values
   - Ensure no spaces in values

3. **CORS Errors**
   - Verify FRONTEND_URL is correct
   - Check CORS configuration
   - Ensure HTTPS is used in production

4. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Verify database schema is deployed

## 📚 Additional Resources

- [Vercel Deployment Guide](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Heroku Deployment Guide](https://devcenter.heroku.com)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform)

## 🎯 Next Steps After Deployment

1. **Test All Features**
   - User authentication
   - Protocol management
   - Personal NoteBook functionality
   - Inventory management
   - Calculator tools

2. **Performance Testing**
   - Load testing
   - Response time monitoring
   - Database query optimization

3. **Security Review**
   - Penetration testing
   - Security audit
   - Vulnerability scanning

4. **Documentation Update**
   - Update README with production URLs
   - Document deployment process
   - Create maintenance procedures

---

**Need Help?** Check the troubleshooting section or refer to the hosting provider's documentation for specific deployment issues.
