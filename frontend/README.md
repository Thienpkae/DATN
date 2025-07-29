# Land Registry System - Frontend

A comprehensive React-based frontend application for the Hyperledger Fabric Land Registry System, providing role-based interfaces for three different organizations.

## Features

### 🏛️ Organization 1 (Land Authority)
- **Dashboard Overview**: System statistics and activity monitoring
- **Land Parcel Management**: Create, update, and manage land parcels
- **Certificate Management**: Issue and manage land certificates
- **Transaction Management**: Process and approve land transactions
- **Document Management**: Upload, verify, and manage documents
- **User Management**: Lock/unlock user accounts
- **Reports**: Generate comprehensive system reports

### 🏢 Organization 2 (Government Officers)
- **Dashboard Overview**: Officer-specific statistics
- **Transaction Processing**: Process pending citizen requests
- **Document Verification**: Verify uploaded documents
- **Reports**: Generate processing reports

### 👥 Organization 3 (Citizens)
- **Dashboard Overview**: Personal asset overview
- **My Land Parcels**: View owned land parcels
- **My Certificates**: View issued certificates
- **Submit Requests**: Create transfer, split, merge requests
- **My Transactions**: Track transaction status
- **My Documents**: Manage personal documents

## Technology Stack

- **Frontend Framework**: React 18
- **UI Library**: Ant Design
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Authentication**: JWT tokens
- **Styling**: CSS with Ant Design themes

## Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:3000
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── Auth/                 # Authentication components
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── VerifyOTP.js
│   ├── Common/               # Shared components
│   │   └── DashboardOverview.js
│   ├── Organization/         # Org-specific dashboards
│   │   ├── Org1Dashboard.js
│   │   ├── Org2Dashboard.js
│   │   └── Org3Dashboard.js
│   ├── LandParcel/          # Land parcel components
│   │   ├── LandParcelManagement.js
│   │   └── MyLandParcels.js
│   ├── Certificate/         # Certificate components
│   │   ├── CertificateManagement.js
│   │   └── MyCertificates.js
│   ├── Transaction/         # Transaction components
│   │   ├── TransactionManagement.js
│   │   ├── TransactionProcessing.js
│   │   ├── TransactionRequests.js
│   │   └── MyTransactions.js
│   ├── Document/           # Document components
│   │   ├── DocumentManagement.js
│   │   ├── DocumentVerification.js
│   │   └── MyDocuments.js
│   ├── User/               # User management
│   │   └── UserManagement.js
│   └── Reports/            # Reports and analytics
│       └── Reports.js
├── services/               # API services
│   ├── auth.js            # Authentication services
│   └── api.js             # Business logic APIs
├── App.js                 # Main application component
├── index.js              # Application entry point
└── index.css             # Global styles
```

## API Integration

The frontend integrates with the Node.js backend through RESTful APIs:

### Authentication APIs
- `POST /register` - User registration
- `POST /login` - User login
- `POST /verify-otp` - Phone verification
- `POST /logout` - User logout

### Land Parcel APIs
- `POST /land-parcels` - Create land parcel
- `PUT /land-parcels/:id` - Update land parcel
- `GET /land-parcels/:id` - Get land parcel details
- `GET /land-parcels/owner/:id` - Get parcels by owner

### Certificate APIs
- `POST /certificates` - Issue certificate
- `GET /certificates/:id` - Get certificate details
- `GET /certificates/owner/:id` - Get certificates by owner

### Transaction APIs
- `POST /transfer-requests` - Create transfer request
- `POST /split-requests` - Create split request
- `POST /merge-requests` - Create merge request
- `POST /transactions/:id/process` - Process transaction
- `POST /transactions/:id/approve` - Approve transaction

### Document APIs
- `POST /documents` - Upload document
- `PUT /documents/:id` - Update document
- `POST /documents/:id/verify` - Verify document
- `GET /documents/:id` - Get document details

## Role-Based Access Control

The application implements role-based access control with three distinct user roles:

### Org1 (Land Authority)
- Full system access
- Create and manage land parcels
- Issue certificates
- Approve/reject transactions
- Manage users
- Generate reports

### Org2 (Government Officers)
- Process citizen requests
- Verify documents
- Forward transactions to authority
- Generate processing reports

### Org3 (Citizens)
- View personal assets
- Submit transaction requests
- Upload documents
- Track request status

## Styling and Theming

The application uses Ant Design with custom organization-specific themes:

- **Org1**: Blue theme (#1890ff)
- **Org2**: Green theme (#52c41a)
- **Org3**: Orange theme (#fa8c16)

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Component-level access control
- **Input Validation**: Client-side validation for all forms
- **Secure HTTP Headers**: CSRF protection and security headers
- **Session Management**: Automatic token refresh and logout

## Development Guidelines

### Component Structure
- Use functional components with React Hooks
- Implement proper error handling
- Include loading states for async operations
- Follow consistent naming conventions

### State Management
- Use React's built-in state management
- Implement proper data flow patterns
- Handle side effects with useEffect

### API Integration
- Centralized API service layer
- Consistent error handling
- Request/response interceptors
- Loading state management

## Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- **Static Hosting**: Deploy build folder to any static hosting service
- **Docker**: Use included Dockerfile for containerized deployment
- **CI/CD**: Integrate with automated deployment pipelines

## Contributing

1. Follow the established project structure
2. Use consistent coding standards
3. Write meaningful commit messages
4. Test thoroughly before submitting
5. Update documentation as needed

## License

This project is part of the Hyperledger Fabric Land Registry System.

## Support

For technical support or questions about the frontend application, please refer to the main project documentation or contact the development team.
