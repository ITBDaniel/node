import express from 'express';
import methodOverride from 'method-override';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { UserRepository } from './user-repository.js';
import { PORT, SECRET_JWT_KEY } from './config.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', './views');

const getCurrentUser = (req) => {
    const token = req.cookies?.token;
    if (!token) return null;

    try {
        return jwt.verify(token, SECRET_JWT_KEY);
    } catch (error) {
        return null;
    }
};

const setAuthCookie = (res, username) => {
    const token = jwt.sign({ username }, SECRET_JWT_KEY, { expiresIn: '1h' });
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
    });
};

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const id = await UserRepository.create({ username, password });
        setAuthCookie(res, username);
        res.status(201).json({ id, username });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await UserRepository.login({ username, password });
        setAuthCookie(res, user.username);
        res.status(200).json({ username: user.username });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ ok: true });
});

app.get('/protected', (req, res) => {
    const user = getCurrentUser(req);

    if (!user) {
        return res.redirect('/');
    }

    return res.render('register', { username: user.username });
});

app.get('/', (req, res) => {
    const user = getCurrentUser(req);

    if (user) {
        return res.render('register', { username: user.username });
    }

    return res.render('register', {});
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});