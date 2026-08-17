# JWT Auth Demo

Minimal demo of JWT-based authentication with a Node.js/Express mock server and a static React client (served from /public via CDN). Shows login, token storage in `localStorage`, attaching `Authorization: Bearer <token>` headers, protected endpoints, and a simple post composer.

Prereqs:
- Node.js >= 14

Install and run:

```bash
npm install
npm start

# Open http://localhost:3000 in your browser
```

Demo credentials (mock users):
- admin / adminpass (role: admin)
- editor / editorpass (role: editor)
- viewer / viewerpass (role: viewer)

Notes:
- Tokens expire after 15 minutes (server-side). The client decodes the token payload locally for display.
- This is a learning demo. In production, use HTTPS, secure cookies or other safe storage patterns, rotate secrets, and implement refresh tokens as needed.
 - After signing in you can select the target platform (Web, Mobile, Admin Panel) from the header. The selected platform is included with posts and persisted in `localStorage`.
 - After signing in you can select the target platform (Twitter, Instagram, Facebook, LinkedIn) from the header. The selected platform is included with posts and persisted in `localStorage`.
