# ✅ Supabase Setup Checklist

## 🎯 **Step-by-Step Setup (No Technical Knowledge Required)**

### **Phase 1: Create Supabase Project**
- [ ] Go to https://supabase.com
- [ ] Sign in to your account
- [ ] Click "New Project"
- [ ] Enter project name: `researchlab`
- [ ] Enter database password: `researchlab123`
- [ ] Choose region (closest to you)
- [ ] Click "Create new project"
- [ ] Wait for setup to complete (1-2 minutes)

### **Phase 2: Get Your Keys**
- [ ] In your project, click "Settings" (gear icon)
- [ ] Click "API" in left menu
- [ ] Copy "Project URL" (looks like: `https://abcdefghijklmnop.supabase.co`)
- [ ] Copy "anon public" key (long string starting with `eyJ...`)

### **Phase 3: Update Your App**
- [ ] Find `.env` file in your project folder
- [ ] Open it with any text editor
- [ ] Replace `YOUR_PROJECT_URL_HERE` with your actual Project URL
- [ ] Replace `YOUR_ANON_KEY_HERE` with your actual anon key
- [ ] Save the file

### **Phase 4: Set Up Database**
- [ ] Go back to Supabase dashboard
- [ ] Click "SQL Editor" on left menu
- [ ] Click "New query"
- [ ] Copy entire contents of `supabase-schema.sql`
- [ ] Paste into SQL editor
- [ ] Click "Run" button
- [ ] Wait for all tables to be created

### **Phase 5: Test Your App**
- [ ] Run: `./start.sh`
- [ ] Open browser to http://localhost:5173
- [ ] App should load without blank page
- [ ] You should see the ResearchLabSync interface

## 🚨 **Common Issues & Solutions**

### **Blank Page Issue**
- **Cause**: Backend not running or database error
- **Solution**: Run `./start.sh` or check if backend is running

### **"Cannot connect to database" Error**
- **Cause**: Wrong Supabase credentials
- **Solution**: Check your `.env` file has correct URL and key

### **"Permission denied" Error**
- **Cause**: Database not set up yet
- **Solution**: Run the SQL schema in Supabase SQL Editor

## 📞 **Need Help?**

1. **Check this checklist** - Make sure you completed all steps
2. **Look at error messages** - They usually tell you what's wrong
3. **Check SUPABASE_SETUP.md** - More detailed technical guide
4. **Verify your .env file** - Make sure credentials are correct

## 🎉 **You're Done When...**

- [ ] App opens in browser without blank page
- [ ] You can see the ResearchLabSync interface
- [ ] No error messages in browser console
- [ ] Backend shows "✅ All tables created successfully"

---

**Remember**: Take it one step at a time. Each step builds on the previous one!
