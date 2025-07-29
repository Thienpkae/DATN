# Land Registry Frontend with IPFS Integration - Quick Start Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 3000
- **IPFS daemon** running on port 5001 (for document storage)

### Start the Application

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start IPFS daemon** (required for document storage):
   ```bash
   ipfs daemon
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** to:
   ```
   http://localhost:3001
   ```

## 🏢 Organization Structure & Access

### Organization 1 (Land Authority) - Admin Access
- **Role**: Full system administration
- **Registration**: Admin-only (created through admin panel)
- **Capabilities**: 
  - Create and manage land parcels
  - Issue certificates
  - Approve/reject transactions
  - **Admin Account Management** (Create Org1/Org2 users)
  - IPFS document storage management
  - Manage users and organizations
  - Generate comprehensive reports

### Organization 2 (Government Officers)
- **Role**: Transaction processing and verification
- **Registration**: Admin approval required
- **Capabilities**:
  - Process pending requests
  - Verify documents
  - Forward transactions to authority
  - Access IPFS stored documents

### Organization 3 (Citizens)
- **Role**: Land owners and applicants
- **Registration**: **Direct self-registration** (no admin approval needed)
- **Capabilities**:
  - View personal land assets
  - Submit transaction requests
  - Upload documents to IPFS
  - Track request status
  - Download certificates

## 🔐 Registration Process

### Citizens (Org3) - Self Registration
1. **Visit Registration Page**: Select "Citizen (Self Registration)"
2. **Fill Form**: Provide personal details (automatically assigned to Org3)
3. **Phone Verification**: Enter OTP sent to phone
4. **Immediate Access**: Login after verification

### Government Users (Org1/Org2) - Admin Registration
**Option 1: Admin Creates Account**
1. **Admin Login**: Land Authority admin logs in
2. **Account Management**: Navigate to "Account Management"
3. **Create User**: Fill user details and select organization
4. **Account Activated**: User receives credentials

**Option 2: User Requests Account**
1. **Visit Registration Page**: Select "Land Authority" or "Government Officer"
2. **Fill Form**: Provide details and select organization
3. **Admin Approval**: Account pending until admin approval
4. **Email Notification**: User notified when approved

## 📁 IPFS Integration Features

### Document Storage
- **Decentralized Storage**: All documents stored on IPFS network
- **Immutable Records**: Documents cannot be altered after upload
- **Global Access**: Documents accessible from any IPFS node
- **Hash Verification**: Each document has unique IPFS hash

### Supported File Types
- PDF documents
- Images (JPG, PNG)
- Word documents
- Text files

### IPFS Setup
1. **Install IPFS**: Download from https://ipfs.io/
2. **Initialize Node**: `ipfs init`
3. **Start Daemon**: `ipfs daemon`
4. **Web UI**: http://localhost:5001/webui

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Check IPFS status
ipfs id

# View IPFS stats
ipfs stats
```

## ⚙️ Environment Variables

Create `.env` file in frontend directory:
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_IPFS_URL=http://localhost:5001
```

## 🔧 Configuration

### IPFS Configuration
The application connects to IPFS on:
- **Host**: localhost
- **Port**: 5001
- **Protocol**: HTTP

### Backend Integration
- **API Base**: http://localhost:3000/api
- **Authentication**: JWT tokens
- **File Upload**: Multipart form data

## 🎯 Key Features by Organization

### Org1 Dashboard Sections:
- 📊 **Dashboard Overview**: System statistics and metrics
- 🏠 **Land Parcel Management**: Full CRUD operations
- 📜 **Certificate Management**: Issue, revoke, verify certificates
- 🔄 **Transaction Management**: Approve/reject requests
- 📁 **Document Management**: Traditional and IPFS storage
- ☁️ **IPFS Storage**: Dedicated IPFS file management
- 👥 **Account Management**: Create and manage user accounts
- 🔧 **User Management**: Advanced user operations
- 📊 **Reports**: Comprehensive system reports

### Org2 Dashboard Sections:
- 📊 **Dashboard Overview**: Personal statistics
- ⚡ **Transaction Processing**: Handle pending requests
- ✅ **Document Verification**: Verify submitted documents
- 📁 **Document Management**: Access IPFS documents
- 📊 **Reports**: Department-specific reports

### Org3 Dashboard Sections:
- 📊 **Dashboard Overview**: Personal land portfolio
- 🏠 **My Land Parcels**: View owned properties
- 📜 **My Certificates**: Download certificates
- 📝 **Submit Requests**: New transaction requests
- 🔄 **My Transactions**: Track request status
- 📁 **My Documents**: Upload to IPFS, manage files

## 🌐 API Integration

### Authentication Endpoints
- **Login**: `POST /api/auth/login`
- **Register Citizen**: `POST /api/auth/register/citizen`
- **Admin Register**: `POST /api/auth/register`
- **Verify OTP**: `POST /api/auth/verify-otp`

### IPFS Endpoints
- **Upload File**: `POST /api/ipfs/upload`
- **Get File**: `GET /api/ipfs/{hash}`
- **Pin File**: `POST /api/ipfs/{hash}/pin`
- **List Pinned**: `GET /api/ipfs/pinned`

### Admin Endpoints
- **Create User**: `POST /api/admin/users`
- **Get All Users**: `GET /api/admin/users`
- **Update User**: `PUT /api/admin/users/{id}`
- **System Stats**: `GET /api/admin/stats`

## 🚨 Troubleshooting

### Common Issues:

1. **IPFS Connection Error**
   ```bash
   # Check if IPFS daemon is running
   ipfs id
   
   # Start IPFS daemon
   ipfs daemon
   
   # Check IPFS web UI
   open http://localhost:5001/webui
   ```

2. **Backend Connection Error**
   - Ensure backend server is running on port 3000
   - Check API URL in environment variables
   - Verify CORS settings on backend

3. **Registration Issues**
   - Citizens: Check phone number format and OTP delivery
   - Admin users: Verify admin approval status
   - Check organization selection is correct

4. **File Upload Problems**
   - Ensure IPFS daemon is running
   - Check file size limits
   - Verify supported file types

5. **Permission Errors**
   - Ensure user has correct organization role
   - Check API endpoints for organization restrictions
   - Verify JWT token validity

### IPFS Troubleshooting
```bash
# Check IPFS version
ipfs version

# Check IPFS configuration
ipfs config show

# Reset IPFS (if needed)
ipfs repo gc

# Check peers
ipfs swarm peers
```

## 📈 Performance Optimization

### IPFS Performance
- **Pin Important Files**: Pin frequently accessed documents
- **Garbage Collection**: Regularly run `ipfs repo gc`
- **Configure Peers**: Connect to reliable IPFS peers

### Application Performance
- **File Size Limits**: Implement client-side file size validation
- **Caching**: Cache IPFS hashes for quick access
- **Lazy Loading**: Load IPFS content on demand

## 🔒 Security Considerations

1. **IPFS Security**
   - Files are public by nature in IPFS
   - Consider encryption for sensitive documents
   - Use private IPFS networks for confidential data

2. **Authentication**
   - JWT tokens have expiration
   - Implement refresh token mechanism
   - Secure token storage

3. **File Validation**
   - Validate file types before upload
   - Scan for malware
   - Limit file sizes

## 📚 Additional Resources

- **IPFS Documentation**: https://docs.ipfs.io/
- **React Documentation**: https://reactjs.org/docs/
- **Ant Design**: https://ant.design/components/
- **Hyperledger Fabric**: https://hyperledger-fabric.readthedocs.io/

## 🆘 Support

For technical issues:
1. Check browser console for errors
2. Verify all services are running (backend, IPFS)
3. Review network requests in browser dev tools
4. Check configuration files and environment variables
