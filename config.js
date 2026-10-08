import 'dotenv/config';

// Valores de configuración de la aplicación
export const {
    PORT = 3001,
    SALT_ROUNDS = 10,
    SECRET_JWT_KEY = 'dev-secret-key'
} = process.env;