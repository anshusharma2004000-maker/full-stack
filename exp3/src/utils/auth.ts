export type Role = "admin" | "editor" | "viewer";

export interface User {
  username: string;
  role: Role;
}

interface StoredUser extends User {
  password: string;
}

const users: StoredUser[] = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
  },
  {
    username: "editor",
    password: "editor123",
    role: "editor",
  },
  {
    username: "viewer",
    password: "viewer123",
    role: "viewer",
  },
];

const TOKEN_KEY = "jwt_token";

/*
  Creates a simulated JWT.

  In a real application this token would be generated and
  cryptographically signed by the backend.
*/
const createFakeJWT = (user: User): string => {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    username: user.username,
    role: user.role,
    iat: Date.now(),
  };

  const encode = (data: object) =>
    btoa(JSON.stringify(data))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${encode(header)}.${encode(payload)}.demo-signature`;
};

export const login = (
  username: string,
  password: string
): boolean => {
  const user = users.find(
    (item) =>
      item.username === username &&
      item.password === password
  );

  if (!user) {
    return false;
  }

  const token = createFakeJWT({
    username: user.username,
    role: user.role,
  });

  localStorage.setItem(TOKEN_KEY, token);

  return true;
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getCurrentUser = (): User | null => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    const decoded = JSON.parse(
      atob(
        payload
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return {
      username: decoded.username,
      role: decoded.role,
    };
  } catch {
    return null;
  }
};