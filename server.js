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


app.use((req,res,next)=>{
    const token =req.cookies.access_token
    req.session={user: null}
    try{
        const data=jwt.verify(token,SECRET_JWT_KEY)
        req.session.user=data
    }catch(error){
        req.session.user=null
    }
    next() // seguir a la siguiente ruta o middleware.
})

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

app.post('/login', async (req,res)=>{
    try{
        const {username,password}=req.body
        console.log("llego aqui")
        const user = await UserRepository.login({username,password})
        console.log("llego aqui 1")
        const token = jwt.sign(
            {id: user._id, username: user.username},
            SECRET_JWT_KEY, 
            {
            expiresIn:'1h'
            })
            console.log("llego aqui 2")
        res
        .cookie('access_token',token,{
            httpOnly:true, //la cookie solo se puede acceder en el servidor, no podrem fer un document.cookie
            //secure:true, //la cookie solo funciona en https
            secure: process.env.NODE_ENV==='production',
            sameSite:'strict', //la cookie es pot accedir dins del domini
            maxAge:1000*60*60 //la cookie te un temps de validesa d'una hora
        })
        .send({ user,token })
    }catch (error){
        //401 = no autorització
        res.status(401).send(error.message)
    }
});

app.post('/logout',(req,res)=>{
    res
    .clearCookie('access_token')
    .json({message:'logout successfull'})
    .send('logout');
});

app.get('/protected', (req, res) => {
    const user = req.session.user;
    if (user) {
        return res.render('register', { username: user.username });
    }
    res.status(403).send("No estas autorizado")
});

app.get('/', (req, res) => {
    const user = req.session.user;
    console.log('ROOT_ROUTE', user);

    if (user) {
        return res.render('register', { username: user.username });
    }

    res.render('register', {});
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

