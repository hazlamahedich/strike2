# Role-Based Access Control (RBAC) System

This document provides an overview of the Role-Based Access Control (RBAC) system implemented in the application.

## Overview

The RBAC system controls user access to various features and data within the application. It consists of:

- **Users**: Individuals who access the system
- **Roles**: Named collections of permissions (e.g., Admin, Manager, Agent, Viewer)
- **Permissions**: Specific actions that can be performed (e.g., view_campaigns, edit_leads)

## Database Schema

The RBAC system uses the following tables:

1. **roles**: Defines the available roles in the system
2. **permissions**: Defines the available permissions in the system
3. **user_roles**: Maps users to roles
4. **role_permissions**: Maps roles to permissions

## Default Roles

The system comes with the following default roles:

- **Admin**: Full access to all features
- **Manager**: Can manage campaigns, leads, and view analytics
- **Agent**: Can work with leads and campaigns but cannot create or delete them
- **Viewer**: Read-only access to campaigns and leads

## SQL Scripts

The following SQL scripts are available for managing the RBAC system:

### Setup and Initialization

- **rbac_init.sql**: Initializes the RBAC system, creates tables, functions, and default roles/permissions

### User Role Management

- **list_users_and_roles.sql**: Lists all users and their assigned roles
- **assign_admin_role.sql**: Assigns the Admin role to a user by email
- **assign_role_by_email.sql**: Assigns any role to a user by email
- **assign_role_interactive.sql**: Interactive script to assign roles to users
- **remove_role_from_user.sql**: Removes a role from a user

### Permission Management

- **view_role_permissions.sql**: Lists all permissions assigned to each role
- **manage_role_permissions.sql**: Adds or removes permissions from a role
- **add_new_permissions.sql**: Adds new permissions to the system
- **check_user_permissions.sql**: Checks what permissions a user has

### Role Management

- **create_custom_role.sql**: Creates a new custom role with specific permissions

### Maintenance

- **rbac_maintenance.sql**: Performs maintenance tasks on the RBAC system

## Usage in Application

To check if a user has a specific permission in your application code, use the `has_permission` function:

```sql
SELECT has_permission('user@example.com', 'view_campaigns');
```

This will return `true` if the user has the permission, and `false` otherwise.

To get all permissions for a user, use the `get_user_permissions` function:

```sql
SELECT get_user_permissions('user@example.com');
```

This will return an array of permission names that the user has.

## Best Practices

1. Always assign at least one role to each user
2. Use the principle of least privilege - assign only the permissions needed
3. Regularly audit user roles and permissions
4. Use the maintenance script to clean up orphaned records

## Troubleshooting

If a user cannot access a feature they should have access to:

1. Check if the user has a role assigned
2. Check if the role has the required permission
3. Verify that the permission is correctly implemented in the application

If you need to add new permissions:

1. Use the `add_new_permissions.sql` script to add them to the database
2. Assign the permissions to the appropriate roles
3. Update the application code to check for these permissions 