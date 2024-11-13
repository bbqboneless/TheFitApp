import dotenv from "dotenv";
import express from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

dotenv.config();

const supabaseKey = process.env.SUPABASE_KEY;
const supabaseURL = process.env.SUPABASE_URL;
const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

const supabase = createClient(supabaseURL, supabaseKey);

function hashPassword(password){
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password,salt,10000,64,'sha512').toString('hex');
    return {salt,hash};
}

async function insertUser(username, password, email){
    const {salt, hash} = hashPassword(password);
    console.log(hash);
    let now = new Date();
    now = now.toISOString();
    const {data,error} = await supabase
    .from('users')
    .insert([
        {
            username: username,
            email: email,
            created_at: now,
            password: hash,
        }
    ]);

    if(error){
        console.log("Error creating user: ", error);
        return 0;
    }else{
        console.log("User successfully created: ",data);
        return data;
    }
}

app.post("/register", async (req, res) =>{
    const {email, password, username} = req.body;
    try{
        const response = await insertUser(username,password,email);
        res.redirect("/");
    }catch(error){
        console.log("Error while inserting new user into table.",error);
    }
});

app.listen(port, () =>{
    console.log(`Server is running on http://localhost:${port}`);
});