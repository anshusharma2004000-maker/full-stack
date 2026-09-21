import { getCurrentUser, logout } from "../utils/auth";
import PostManager from "./PostManager";

interface DashboardProps {
  onLogout: () => void;
}

function Dashboard({ onLogout }: DashboardProps) {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="dashboard">
      <div className="user-bar">
        <div>
          <h2>Dashboard</h2>

          <p>
            Logged in as:{" "}
            <strong>{user.username}</strong>
          </p>

          <span className={`role-badge ${user.role}`}>
            Role: {user.role.toUpperCase()}
          </span>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <PostManager role={user.role} />
    </div>
  );
}

export default Dashboard;