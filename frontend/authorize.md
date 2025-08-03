1. Org1 (Authority Organizations)

Role: High-level management with authority to perform system administration tasks and handle land-related requests, certificates, documents, and transactions.
Users: Only admins or staff of Org1.
Functions:

Land Parcel Management:

Create land parcel: POST /land-parcels
Update land parcel: PUT /land-parcels/:landParcelID
Delete land parcel: DELETE /land-parcels/:id
Bulk operations on land parcels: POST /land-parcels/bulk
View all land parcels: GET /land-parcels
View land parcel by ID: GET /land-parcels/:id
View land parcel history: GET /land-parcels/:id/history
Search land parcels: GET /land-parcels/search
View land parcels by owner: GET /land-parcels/owner/:ownerID


Certificate Management:

Issue certificate: POST /certificates
Revoke certificate: POST /certificates/:certificateID/revoke
View all certificates: GET /certificates
View certificate by ID: GET /certificates/:certificateID
View certificates by owner: GET /certificates/owner/:ownerID
View certificates by land parcel: GET /certificates/land-parcel/:landParcelID
Search certificates: GET /certificates/search


Transaction Management:

Approve transaction: POST /transactions/:txID/approve
Reject transaction: POST /transactions/:txID/reject
View all transactions: GET /transactions
View transaction by ID: GET /transactions/:txID
Search transactions: GET /transactions/search
View transactions by land parcel: GET /transactions/land-parcel/:landParcelID
View transactions by owner: GET /transactions/owner/:ownerID


Document Management:

Upload document: POST /documents
Update document: PUT /documents/:documentID
View document by ID: GET /documents/:docID
Search documents: GET /documents/search/:id
View documents by transaction: GET /documents/transaction/:txID
View documents by IPFS hash: GET /documents/ipfs/:keyword
View all documents: GET /documents


System Management:

View system health: GET /system/health (admin only)
View system reports: GET /reports/system
View analytics: GET /analytics
Global search: GET /search/global
Export data: GET /export/:dataType


User Management (admin only, restricted to Org1 users):

Register user (Org1 only): POST /register
Lock/Unlock account (Org1 users only): POST /account/lock-unlock
Delete account (Org1 users only): DELETE /account/delete
View all users (Org1 only): GET /users
View user by CCCD (Org1 users only): GET /users/:cccd
Update user (Org1 users only): PUT /users/:cccd






2. Org2 (Officer Organizations)

Role: Handles transaction processing, document verification, and land-related management, but cannot issue or revoke certificates.
Users: Admins or staff of Org2.
Functions:

Land Parcel Management:

View all land parcels: GET /land-parcels
View land parcel by ID: GET /land-parcels/:id
Search land parcels: GET /land-parcels/search
View land parcels by owner: GET /land-parcels/owner/:ownerID
View land parcel history: GET /land-parcels/:id/history


Certificate Management:

View all certificates: GET /certificates
View certificate by ID: GET /certificates/:certificateID
View certificates by owner: GET /certificates/owner/:ownerID
View certificates by land parcel: GET /certificates/land-parcel/:landParcelID
Search certificates: GET /certificates/search


Transaction Management:

Process transaction: POST /transactions/:txID/process
Forward transaction: POST /transactions/:txID/forward
View all transactions: GET /transactions
View transaction by ID: GET /transactions/:txID
Search transactions: GET /transactions/search
View transactions by land parcel: GET /transactions/land-parcel/:landParcelID
View transactions by owner: GET /transactions/owner/:ownerID


Document Management:

Upload document: POST /documents
Verify document: POST /documents/:docID/verify
Reject document: POST /documents/:docID/reject
View document by ID: GET /documents/:docID
Search documents: GET /documents/search/:id
View documents by transaction: GET /documents/transaction/:txID
View documents by IPFS hash: GET /documents/ipfs/:keyword
View all documents: GET /documents
View pending documents: GET /documents/pending


System Management:

View system reports: GET /reports/system
View analytics: GET /analytics
Global search: GET /search/global
Export data: GET /export/:dataType


User Management (admin only, restricted to Org2 users):

Register user (Org2 only): POST /register
Lock/Unlock account (Org2 users only): POST /account/lock-unlock
Delete account (Org2 users only): DELETE /account/delete
View all users (Org2 only): GET /users
View user by CCCD (Org2 users only): GET /users/:cccd
Update user (Org2 users only): PUT /users/:cccd






3. Org3 (Citizens)

Role: Citizens or land parcel owners who can manage their own land-related data, certificates, transactions, and documents.
Users: Regular citizens (user role).
Functions:

Registration and Verification:

Register account (Org3, user role only): POST /register
Resend OTP: POST /resend-otp
Verify OTP: POST /verify-otp


Account Management:

Login: POST /login
Logout: POST /logout
Change password: POST /change-password
Forgot password: POST /forgot-password
Reset password: POST /reset-password
View profile: GET /profile
Update profile: PUT /profile


Land Parcel Management:

View land parcel by ID: GET /land-parcels/:id
View land parcels by owner (own data only): GET /land-parcels/owner/:ownerID
View land parcel history: GET /land-parcels/:id/history


Certificate Management:

View certificate by ID: GET /certificates/:certificateID
View certificates by owner (own data only): GET /certificates/owner/:ownerID
View certificates by land parcel: GET /certificates/land-parcel/:landParcelID


Transaction Management:

Create transfer request: POST /transfer-requests
Confirm transfer: POST /transfer-requests/:txID/confirm
Create split request: POST /split-requests
Create merge request: POST /merge-requests
Create change purpose request: POST /change-purpose-requests
Create reissue request: POST /reissue-requests
View transaction by ID: GET /transactions/:txID
View transactions by land parcel: GET /transactions/land-parcel/:landParcelID
View transactions by owner (own data only): GET /transactions/owner/:ownerID


Document Management:

Upload document: POST /documents
View document by ID: GET /documents/:docID
Search documents: GET /documents/search/:id
View documents by transaction: GET /documents/transaction/:txID


Statistics:

View personal statistics: GET /dashboard/stats (own data only)


User Management (admin only, restricted to Org3 users):

Register user (Org3 only): POST /register
Lock/Unlock account (Org3 users only): POST /account/lock-unlock
Delete account (Org3 users only): DELETE /account/delete
View all users (Org3 only): GET /users
View user by CCCD (Org3 users only): GET /users/:cccd
Update user (Org3 users only): PUT /users/:cccd






4. Admin Role (Any Organization)

Additional Functions (restricted to managing users within their own organization):

Register user (only for their own org): POST /register
Lock/Unlock account (only for their own org): POST /account/lock-unlock
Delete account (only for their own org): DELETE /account/delete
View all users (only for their own org): GET /users
View user by CCCD (only for their own org): GET /users/:cccd
Update user (only for their own org): PUT /users/:cccd
View system health: GET /system/health