// Servidor principal de la aplicación
import express from 'express';
import methodOverride from 'method-override';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { UserRepository } from './user-repository.js';
import { BookingRepository } from './booking-repository.js';
import { PORT, SECRET_JWT_KEY } from './config.js';
import productRoutes from './routes/products.js';
import bookingRoutes from './routes/bookings.js';
import { authRequired, loadSession, wantsJson } from './middleware/auth.js';

export const app = express();

// Middlewares y configuración global

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(loadSession);

app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/protected');
    res.render('login');
});

app.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/protected');
    res.render('register');
});

app.post('/register', async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    try {
        await UserRepository.create({ username, password });

        if (!wantsJson(req)) {
            return res.redirect('/login');
        }

        return res.status(201).json({ success: true, message: 'User created successfully.' });
    } catch (error) {
        if (!wantsJson(req)) {
            return res.status(400).render('register', { error: error.message });
        }
        return res.status(400).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await UserRepository.login({ username, password });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            SECRET_JWT_KEY,
            { expiresIn: '1h' }
        );

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60
        });

        if (!wantsJson(req)) {
            return res.redirect('/protected');
        }

        return res.json({ success: true, user: { id: user._id, username: user.username }, token });
    } catch (error) {
        if (!wantsJson(req)) {
            return res.status(401).render('login', { error: error.message });
        }
        return res.status(401).json({ error: error.message });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('access_token');
    if (!wantsJson(req)) {
        return res.redirect('/login');
    }
    return res.json({ success: true });
});

app.get('/protected', authRequired, async (req, res) => {
    const bookings = await BookingRepository.list();
    const userBookings = bookings.filter((booking) => booking.userId === req.session.user.id);
    res.render('protected', { user: req.session.user, userBookings });
});

app.get('/profile', authRequired, async (req, res) => {
    const bookings = await BookingRepository.list();
    res.render('profile', {
        user: req.session.user,
        bookings: bookings.filter((booking) => booking.userId === req.session.user.id)
    });
});

app.get('/users', authRequired, async (req, res) => {
    const users = await UserRepository.list();
    if (!wantsJson(req)) {
        return res.render('users', { users, user: req.session.user });
    }
    return res.json(users);
});

app.post('/users', authRequired, async (req, res) => {
    try {
        const userId = await UserRepository.create({
            username: req.body.username,
            password: req.body.password
        });

        if (!wantsJson(req)) {
            return res.redirect('/users');
        }

        return res.status(201).json({ success: true, id: userId });
    } catch (error) {
        if (!wantsJson(req)) {
            return res.status(400).render('users', { error: error.message, user: req.session.user, users: await UserRepository.list() });
        }
        return res.status(400).json({ error: error.message });
    }
});

app.put('/users/:id', authRequired, async (req, res) => {
    try {
        const user = await UserRepository.update(req.params.id, {
            username: req.body.username,
            password: req.body.password
        });

        if (!wantsJson(req)) {
            return res.redirect('/users');
        }

        return res.json({ success: true, user });
    } catch (error) {
        if (!wantsJson(req)) {
            return res.status(400).send(error.message);
        }
        return res.status(400).json({ error: error.message });
    }
});

app.delete('/users/:id', authRequired, async (req, res) => {
    try {
        await UserRepository.remove(req.params.id);
        if (!wantsJson(req)) {
            return res.redirect('/users');
        }
        return res.json({ success: true });
    } catch (error) {
        if (!wantsJson(req)) {
            return res.status(400).send(error.message);
        }
        return res.status(400).json({ error: error.message });
    }
});

app.use('/products', authRequired, productRoutes);
app.use('/api/products', authRequired, productRoutes);
app.use('/bookings', authRequired, bookingRoutes);
app.use('/api/bookings', authRequired, bookingRoutes);

app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/protected');
    }
    res.redirect('/login');
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
