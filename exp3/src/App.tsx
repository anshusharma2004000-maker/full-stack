import { useState } from "react";
import "./App.css";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { getCurrentUser } from "./utils/auth";

function App() {
  const [isAuthenticated, setIsAuthenticated] =
    useState(Boolean(getCurrentUser()));

  return (
    <div className="app">
      <h1>JWT Authentication & RBAC</h1>

      <p className="description">
        JWT-based authentication with
        role-based access control.
      </p>

      {!isAuthenticated ? (
        <Login
          onLogin={() =>
            setIsAuthenticated(true)
          }
        />
      ) : (
        <Dashboard
          onLogout={() =>
            setIsAuthenticated(false)
          }
        />
      )}
    </div>
  );
}

export default App;