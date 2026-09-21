import { useState } from "react";
import { login } from "../utils/auth";

interface LoginProps {
  onLogin: () => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    const success = login(username, password);

    if (success) {
      alert("Login Successful ✅");
      onLogin();
    } else {
      alert("Invalid username or password ❌");
    }
  };

  return (
    <div className="auth-card">
      <h2>JWT Authentication Login</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <div className="password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() =>
            setShowPassword((current) => !current)
          }
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleLogin}
      >
        Login
      </button>

      <div className="demo-users">
        <h3>Demo Users</h3>

        <p>
          <strong>Admin:</strong> admin / admin123
        </p>

        <p>
          <strong>Editor:</strong> editor / editor123
        </p>

        <p>
          <strong>Viewer:</strong> viewer / viewer123
        </p>
      </div>
    </div>
  );
}

export default Login;