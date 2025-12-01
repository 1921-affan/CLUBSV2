# Admin and Role Setup Guide

## Overview
This system implements a secure role-based access control with three main roles:
- **Student**: Default role for all new users
- **Club Head**: Users who manage specific clubs
- **Admin**: Single platform administrator (only ONE allowed)

## Security Features

### 1. Admin Role Restriction
- **Only ONE admin** can exist in the system at any time
- This is enforced by a database trigger (`check_single_admin`)
- Any attempt to create a second admin will fail with an error

### 2. Role Assignment
- Roles are stored in the `user_roles` table, separate from user profiles
- This prevents privilege escalation attacks
- All role checks use security definer functions that bypass RLS

### 3. Club Head Management
- Club heads are assigned per club via the `club_members` table
- The `role_in_club` field can be 'head' or 'member'
- When a club is approved by admin, the creator becomes the club head automatically

## Setting Up the First Admin

### Option 1: Using Backend (Recommended)
1. Open your backend dashboard
2. Navigate to Database → user_roles table
3. Click "Insert row"
4. Fill in:
   - `user_id`: Copy the user's ID from the profiles table
   - `role`: Select 'admin'
5. Click "Save"

### Option 2: Using SQL
```sql
-- First, find the user ID from profiles table
SELECT id, name, email FROM profiles WHERE email = 'admin@example.com';

-- Insert admin role (replace <user-id> with actual UUID)
INSERT INTO user_roles (user_id, role)
VALUES ('<user-id>', 'admin');
```

## Creating Club Heads

### Automatic Assignment (Recommended)
When an admin approves a club creation request in the Admin Panel:
1. The club is created in the `clubs` table
2. The requester is automatically assigned as club head in `club_members`
3. Their `role_in_club` is set to 'head'

### Manual Assignment
```sql
-- Insert club head role (replace <user-id> and <club-id> with actual UUIDs)
INSERT INTO club_members (club_id, user_id, role_in_club)
VALUES ('<club-id>', '<user-id>', 'head');
```

## Role-Based Navigation

After login, users are automatically redirected based on their role:
- **Admin** → `/admin` (Admin Panel)
- **Club Head** → `/dashboard` (Club Dashboard)
- **Student** → `/` (Home Page)

## Admin Panel Features
- Approve/reject club creation requests
- View platform analytics (users, clubs, events)
- Monitor club and event creation trends
- Manage user roles (via backend)

## Club Dashboard Features (Club Heads Only)
- Update club information
- Create and manage events
- Post announcements to club members
- View and manage club members
- Track event participants

## Security Notes

⚠️ **Important:**
- Never store roles in client-side storage (localStorage, sessionStorage)
- Never hardcode admin credentials in the application
- Always verify roles server-side using RLS policies
- The system uses security definer functions to prevent recursive RLS issues

## Testing

### Test Admin Login
1. Assign admin role to a test user (see setup instructions above)
2. Login with that user's credentials
3. You should be redirected to `/admin`
4. The navbar should show "Admin Panel" link

### Test Club Head Login
1. Create a club through the pending clubs workflow OR assign manually
2. Login with the club head's credentials
3. You should be redirected to `/dashboard`
4. The navbar should show "Club Dashboard" link

### Test Regular Student Login
1. Login with any user who is not admin or club head
2. You should be redirected to `/` (Home)
3. The navbar should NOT show Admin or Dashboard links

## Troubleshooting

### Cannot access Admin Panel
- Verify the user has 'admin' role in `user_roles` table
- Check that only ONE admin exists (system enforces this)
- Clear browser cache and login again

### Cannot access Club Dashboard
- Verify the user has `role_in_club = 'head'` in `club_members` table
- Check the club exists and is approved
- Ensure RLS policies are enabled on `club_members` table

### Multiple admins error
- This is intentional! Only ONE admin is allowed
- To change admin, first remove the existing admin role
- Then assign the new admin role

## Database Functions Reference

### `has_role(user_id, role)`
Checks if a user has a specific global role (admin, club_head, student)

### `is_club_head(user_id)`
Checks if a user is a club head of ANY club

### `check_single_admin()`
Trigger function that enforces single admin rule
