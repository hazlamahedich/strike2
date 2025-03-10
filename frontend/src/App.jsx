import RBACManagement from './components/RBACManagement';
import { PermissionGuard } from './utils/rbac';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/integrations" element={<Integrations />} />
            {/* RBAC Management Route with Permission Guard */}
            <Route 
              path="/rbac" 
              element={
                <PermissionGuard 
                  permissions="manage_users" 
                  fallback={<AccessDenied message="You don't have permission to access this page" />}
                >
                  <RBACManagement />
                </PermissionGuard>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Simple Access Denied component
const AccessDenied = ({ message }) => (
  <div style={{ 
    padding: '2rem', 
    textAlign: 'center', 
    color: '#d32f2f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh'
  }}>
    <h2>Access Denied</h2>
    <p>{message || "You don't have permission to access this resource"}</p>
  </div>
);

export default App; 