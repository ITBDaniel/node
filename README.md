# README

Aplicació web de gestió d'usuaris, productes i reserves construïda amb Express, EJS i autenticació per JWT + cookies.

## Descripció

La app permet:

- registrar i iniciar sessió usuaris
- protegir pàgines i endpoints amb autenticació
- gestionar productes
- crear, editar i eliminar reserves
- consultar la informació de l'usuari actual i la llista d'usuaris

Les dades es guarden localment a la carpeta `db/` mitjançant `db-local`.

## Funcionament general

- El servidor principal està a `server.js`.
- Les rutes principals es carreguen des de `routes/products.js` i `routes/bookings.js`.
- La autenticació i la sessió es gestionen a `middleware/auth.js`.
- Els repositoris de dades (`user-repository.js`, `product-repository.js` i `booking-repository.js`) encapsulen la lògica d'accés a la base local.
- Les vistes EJS es troben a `views/` i el frontend de formularis a `public/register.js`.

## Rutes principals

### Autenticació

- `GET /login` → mostra el formulari d'inici de sessió.
- `GET /register` → mostra el formulari de registre.
- `POST /register` → crea un usuari nou. Si el client envia JSON, respon en format JSON.
- `POST /login` → valida usuari i contrasenya i genera un JWT que es guarda en una cookie `access_token`.
- `POST /logout` → tanca la sessió i elimina la cookie.
- `GET /protected` → pàgina protegida per usuaris autenticats.
- `GET /profile` → mostra el perfil de l'usuari i les seves reserves.

### Usuaris

- `GET /users` → llista els usuaris autenticats.
- `POST /users` → crea un usuari des del backend.
- `PUT /users/:id` → actualitza un usuari.
- `DELETE /users/:id` → elimina un usuari.

### Productes

- `GET /products` → llista els productes i renderitza la vista `products.ejs`.
- `POST /products` → crea un producte.
- `GET /products/:id/edit` → mostra el formulari per editar un producte.
- `PUT /products/:id` → actualitza un producte.
- `DELETE /products/:id` → elimina un producte.

També existeixen versions API JSON amb les mateixes operacions:

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Reserves

- `GET /bookings` → llista reserves i renderitza `bookings.ejs`.
- `POST /bookings` → crea una reserva associada a l'usuari autenticat.
- `GET /bookings/:id/edit` → mostra el formulari per editar la reserva.
- `PUT /bookings/:id` → actualitza una reserva.
- `DELETE /bookings/:id` → elimina una reserva.

També hi ha versions JSON:

- `GET /api/bookings`
- `POST /api/bookings`
- `PUT /api/bookings/:id`
- `DELETE /api/bookings/:id`

## Regles de negoci

- Els usuaris han de tenir nom d'usuari mínim de 3 caràcters i contrasenya mínim de 6.
- Les contrasenyes es guarden hashejades amb `bcryptjs`.
- Les reserves no poden solapar hores per al mateix producte.
- L'accés a les pàgines protegides es controla amb `authRequired`.
- La cookie `access_token` és llegida a cada request per reconstruir la sessió.

## Execució

1. Installa les dependències:
   ```bash
   npm install
   ```
2. Inicia el servidor:
   ```bash
   npm run dev
   ```
3. Obre el navegador a:
   ```bash
   http://localhost:3001
   ```

## Notes

La pàgina principal redirigeix automàticament a `/login` si l'usuari no està autenticat, o a `/protected` si ja hi ha sessió activa.
