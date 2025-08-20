# Role-Based Access Control Guide

## User Roles and Permissions

### 🔐 **Role Hierarchy** (from lowest to highest access)

| Role | Level | Description | Access Level |
|------|-------|-------------|--------------|
| **Student** | 1 | Research students | Basic features, read-only protocols |
| **Researcher** | 2 | Research scientists | Research tools + inventory management |
| **Principal Investigator** | 3 | Lab leaders | Lab management + all researcher features |
| **Admin** | 4 | System administrators | Full system access |

---

## 📋 **Detailed Role Permissions**

### **Student Role** (`student`)
- ✅ **View Access**: All protocols, lab notebook, data results, calculators
- ✅ **Basic Operations**: View instruments, access research tools
- ✅ **Lab Management**: Access lab management features
- ❌ **Restricted**: Cannot create/edit protocols or manage inventory

**Available Features:**
- Dashboard overview
- View protocols and lab notebook entries
- Access calculators and research tools
- View data results and presentations
- Access help forum and conferences
- Lab management access

---

### **Researcher Role** (`researcher`)
- ✅ **All Student Features** +
- ✅ **Inventory Management**: Add, edit, delete inventory items
- ✅ **Protocol Management**: Create, edit, delete protocols
- ✅ **Lab Operations**: Full access to research tools

**Available Features:**
- Everything from Student role
- Full protocol management
- Inventory management
- Instrument booking
- Data entry and management

---

### **Principal Investigator Role** (`principal_researcher`)
- ✅ **All Researcher Features** +
- ✅ **Lab Management**: Manage lab members, projects, settings
- ✅ **User Management**: Add/remove lab members
- ✅ **Lab Administration**: Configure lab settings and permissions

**Available Features:**
- Everything from Researcher role
- Lab member management
- Project oversight
- Lab configuration
- Administrative reports

---

### **Admin Role** (`admin`)
- ✅ **Full System Access** +
- ✅ **User Management**: Create, edit, delete all users
- ✅ **System Configuration**: Global settings and configurations
- ✅ **Database Management**: Full data access and management

**Available Features:**
- Everything from Principal Investigator role
- System-wide user management
- Global configuration
- Database administration
- System monitoring

---

## 🛣️ **Route Access Control**

### **Public Routes** (No authentication required)
- `/login` - User authentication
- `/register` - User registration
- `/unauthorized` - Access denied page

### **Protected Routes by Role**

#### **Student+ Access** (All authenticated users)
- `/dashboard` - Main dashboard
- `/lab-notebook` - Lab notebook entries
- `/protocols` - Protocol management
- `/instruments` - Instrument management
- `/data-results` - Data and results
- `/presentations` - Automated presentations
- `/data-sharing` - Global data sharing
- `/help-forum` - Help and support
- `/conferences` - Conference information
- `/calculator-hub` - Scientific calculators
- `/reference-library` - Reference materials
- `/data-analytics` - Data analysis tools
- `/research-assistant` - Research assistance
- `/molecular-biology` - Molecular biology tools
- `/bioinformatics-tools` - Bioinformatics tools

#### **Researcher+ Access**
- `/inventory` - Inventory management

#### **Student+ Access** (All authenticated users)
- `/lab-management` - Lab administration

---

## 🔍 **Testing Different Roles**

### **Demo User Credentials**

| Role | Email | Password | Test Focus |
|------|-------|----------|------------|
| **Student** | `student@researchlab.com` | `student123` | Basic access, restricted features |
| **Researcher** | `researcher@researchlab.com` | `researcher123` | Research tools, inventory access |
| **Principal Investigator** | `pi@researchlab.com` | `pi123` | Lab management, administrative features |
| **Admin** | `admin@researchlab.com` | `admin123` | Full system access |

### **Testing Scenarios**

#### **1. Student Access Test**
1. Login as student
2. Try to access `/inventory` → Should be denied
3. Access `/lab-management` → Should work (now accessible to all)
4. Verify access to basic features works

#### **2. Researcher Access Test**
1. Login as researcher
2. Access `/inventory` → Should work
3. Access `/lab-management` → Should work (now accessible to all)
4. Verify full research tool access

#### **3. Principal Investigator Access Test**
1. Login as PI
2. Access `/lab-management` → Should work
3. Access `/inventory` → Should work
4. Verify administrative features

#### **4. Admin Access Test**
1. Login as admin
2. Access all routes → Should work
3. Verify full system access

---

## 🚨 **Access Denied Behavior**

When a user tries to access a route they don't have permission for:

1. **Automatic Redirect** to `/unauthorized` page
2. **Clear Error Message** explaining the access restriction
3. **User-Friendly Interface** with options to:
   - Go back to previous page
   - Return to dashboard
   - Logout and switch accounts
   - Contact administrator

---

## 🔧 **Technical Implementation**

### **Role Validation**
- Uses `hasMinimumRole()` for hierarchical access
- Uses `hasAllowedRole()` for specific role requirements
- Role checks happen at route level via `ProtectedRoute` component

### **Permission System**
- Centralized in `utils/roleAccess.ts`
- Easy to modify and extend
- Type-safe with TypeScript interfaces

### **Security Features**
- JWT token validation on every request
- Role information embedded in JWT payload
- Server-side role verification for API endpoints
- Client-side role checking for UI components

---

## 📝 **Adding New Roles**

To add a new role:

1. **Update Role Hierarchy** in `utils/roleAccess.ts`
2. **Define Permissions** for the new role
3. **Update Route Access** rules
4. **Add Role Display Names**
5. **Test Access Control** thoroughly

---

## 🎯 **Best Practices**

1. **Principle of Least Privilege**: Users get minimum access needed
2. **Role Hierarchy**: Higher roles inherit lower role permissions
3. **Explicit Permissions**: Clear definition of what each role can do
4. **Audit Trail**: Log all access attempts and role changes
5. **Regular Review**: Periodically review and update role permissions

---

## 🚀 **Getting Started**

1. **Choose a demo user** based on the role you want to test
2. **Login** with the credentials
3. **Navigate** through different sections
4. **Verify** access control is working correctly
5. **Test** restricted features to ensure proper denial

The system is now fully secured with proper role-based access control!
