import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import process from 'node:process';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const owner = process.env.VITE_GITHUB_OWNER;
const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const redirectUri = process.env.GITHUB_REDIRECT_URI;
const sessionSecret = process.env.SESSION_SECRET;

if (!owner || !clientId || !clientSecret || !redirectUri || !sessionSecret) {
  throw new Error('Faltan variables de entorno: VITE_GITHUB_OWNER, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI, SESSION_SECRET.');
}

app.use(express.json());
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

app.get('/auth/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user,repo',
    allow_signup: 'true',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('Falta el código de GitHub');
    return;
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'report-git-app',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      res.status(400).json({ message: 'Error al autenticar con GitHub', details: tokenData });
      return;
    }

    const accessToken = tokenData.access_token;
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'report-git-app',
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      res.status(400).json({ message: 'No se pudo obtener el usuario de GitHub', details: userData });
      return;
    }

    req.session.user = {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      accessToken,
    };

    res.redirect('http://localhost:5173');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en la autenticación de GitHub' });
  }
});

app.get('/auth/session', (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      login: req.session.user.login,
      name: req.session.user.name,
    },
  });
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

function requireAuth(req, res, next) {
  if (!req.session.user?.accessToken) {
    res.status(401).json({ message: 'No autorizado' });
    return;
  }

  next();
}

app.get('/api/repos/:repository/commits', requireAuth, async (req, res) => {
  try {
    const { repository } = req.params;
    const { sha, since, until, per_page } = req.query;
    const { accessToken } = req.session.user;
    const params = new URLSearchParams();
    if (sha) params.set('sha', String(sha));
    if (since) params.set('since', String(since));
    if (until) params.set('until', String(until));
    if (per_page) params.set('per_page', String(per_page));

    const githubRes = await fetch(
      `https://api.github.com/repos/${owner}/${repository}/commits?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'report-git-app',
        },
      }
    );

    const text = await githubRes.text();

    if (!githubRes.ok) {
      res.status(githubRes.status).send(text);
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al consultar commits de GitHub' });
  }
});

app.get('/api/repos/:repository/tags', requireAuth, async (req, res) => {
  try {
    const { repository } = req.params;
    const { per_page } = req.query;
    const { accessToken } = req.session.user;
    const params = new URLSearchParams();
    if (per_page) params.set('per_page', String(per_page));

    const githubRes = await fetch(
      `https://api.github.com/repos/${owner}/${repository}/tags?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'report-git-app',
        },
      }
    );

    const text = await githubRes.text();

    if (!githubRes.ok) {
      res.status(githubRes.status).send(text);
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al consultar tags de GitHub' });
  }
});

app.get('/api/repos/:repository/branches', requireAuth, async (req, res) => {
  try {
    const { repository } = req.params;
    const { per_page } = req.query;
    const { accessToken } = req.session.user;
    const params = new URLSearchParams();
    if (per_page) params.set('per_page', String(per_page));

    const githubRes = await fetch(
      `https://api.github.com/repos/${owner}/${repository}/branches?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'report-git-app',
        },
      }
    );

    const text = await githubRes.text();

    if (!githubRes.ok) {
      res.status(githubRes.status).send(text);
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al consultar branches de GitHub' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
