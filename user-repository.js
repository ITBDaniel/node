import bcrypt from 'bcryptjs';
import DBLocal from 'db-local';
import crypto from 'node:crypto';
import { SALT_ROUNDS } from './config.js';

// Repositorio de usuarios con autenticación segura
const { Schema } = new DBLocal({ path: './db' });

const User = Schema('User', {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }
});

export class UserRepository {
    static async list() {
        const users = User.find({});
        return users.map(({ _id, username }) => ({ _id, username }));
    }

    static async getById(id) {
        const user = User.findOne(id);
        if (!user) return null;
        const { password: _, ...safeUser } = user;
        return safeUser;
    }

    static async create({ username, password }) {
        Validation.username(username);
        Validation.password(password);

        const existingUser = await User.findOne({ username });
        if (existingUser) throw new Error('username already exists');

        const id = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        User.create({
            _id: id,
            username,
            password: hashedPassword
        }).save();

        return id;
    }

    static async update(id, { username, password }) {
        const user = User.findOne(id);
        if (!user) throw new Error('User not found');

        if (username) {
            Validation.username(username);
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id !== id) throw new Error('username already exists');
            user.username = username;
        }

        if (password) {
            Validation.password(password);
            user.password = await bcrypt.hash(password, SALT_ROUNDS);
        }

        user.save();
        const { password: _, ...publicUser } = user;
        return publicUser;
    }

    static async remove(id) {
        const user = User.findOne(id);
        if (!user) throw new Error('User not found');
        user.remove();
        return true;
    }

    static async login({ username, password }) {
        Validation.username(username);
        Validation.password(password);

        const user = await User.findOne({ username });
        if (!user) throw new Error('username does not exist');

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error('password is invalid');

        const { password: _, ...publicUser } = user;
        return publicUser;
    }
}

class Validation {
    static username(username) {
        if (typeof username !== 'string') throw new Error('username must be a string');
        if (username.trim().length < 3) throw new Error('Username must be at least 3 characters long');
    }

    static password(password) {
        if (typeof password !== 'string') throw new Error('password must be a string');
        if (password.length < 6) throw new Error('password must be at least 6 characters long');
    }
}