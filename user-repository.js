import bcrypt from 'bcryptjs'
import DBLocal from 'db-local'
import crypto from 'node:crypto'
import { SALT_ROUNDS } from './config.js'
const {Schema}=new DBLocal({path:'./db'})

//Creem un esquema per les dades amb els camps especificats.
const User = Schema('User',{
    _id:{type:String,required:true},
    username:{type:String,required:true},
    password:{type:String,required:true}
})

// exportem en una classe per crear usuaris i fer login
export class UserRepository{
    static async create({username,password}){
        Validation.username(username)
        Validation.password(password)

        const user = await User.findOne({ username })
        if (user) throw new Error('username already exists')

        const id = crypto.randomUUID()
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

        User.create({
            _id: id,
            username,
            password: hashedPassword
        }).save()

        return id
    }

    static async login({username,password}){
        Validation.username(username)
        Validation.password(password)

        const user = await User.findOne({ username })
        if (!user) throw new Error('username does not exist')

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) throw new Error('password is invalid')

        const { password: _, ...publicUser } = user
        return publicUser
    }
}

class Validation {
    static username(username){
        if (typeof username !== 'string') throw new Error('username must be a string')
        if (username.length < 3) throw new Error('Username must be at least 3 characters long')
    }

    static password(password){
        if (typeof password !== 'string') throw new Error('password must be a string')
        if (password.length < 6) throw new Error('password must be at least 6 characters long')
    }
}