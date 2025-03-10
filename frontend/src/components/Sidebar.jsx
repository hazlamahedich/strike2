import { PermissionGuard } from '../utils/rbac';
import SecurityIcon from '@mui/icons-material/Security';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo">
        {/* Logo content */}
      </div>
      <nav>
        <ul>
          {/* Existing menu items */}
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              <DashboardIcon /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/campaigns" className={({ isActive }) => isActive ? 'active' : ''}>
              <CampaignIcon /> Campaigns
            </NavLink>
          </li>
          <li>
            <NavLink to="/leads" className={({ isActive }) => isActive ? 'active' : ''}>
              <PersonIcon /> Leads
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
              <AnalyticsIcon /> Analytics
            </NavLink>
          </li>
          <li>
            <NavLink to="/integrations" className={({ isActive }) => isActive ? 'active' : ''}>
              <IntegrationInstructionsIcon /> Integrations
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
              <SettingsIcon /> Settings
            </NavLink>
          </li>
          
          {/* RBAC Management link with permission guard */}
          <PermissionGuard permissions="manage_users">
            <li>
              <NavLink to="/rbac" className={({ isActive }) => isActive ? 'active' : ''}>
                <SecurityIcon /> User Access
              </NavLink>
            </li>
          </PermissionGuard>
        </ul>
      </nav>
      {/* Other sidebar content */}
    </div>
  );
}

export default Sidebar; 