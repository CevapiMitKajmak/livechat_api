import express from 'express';
import dotenv from 'dotenv';
import { genSaltSync, hashSync } from 'bcrypt';
import { StreamChat } from 'stream-chat';

dotenv.config();

const { PORT, STREAM_API_KEY, STREAM_API_SECRET } = process.env;
const client = StreamChat.getInstance(STREAM_API_KEY!, STREAM_API_SECRET);

const app = express();
app.use(express.json());
const salt = genSaltSync(10);

interface User {
    id: string;
    email: string;
    hashed_password: string;
}
const USER: User[] = [];

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
             error: 'Invalid Request' });
    }

    if (password.length < 6) {
        return res.status(400).json({
            error: 'Password must be at least 6 characters' });
    }

    try {
        const hashed_password = hashSync(password, salt);
        const id = Math.random().toString(36).slice(2);
        const newUser = {
            id,
            email,
            hashed_password,
        };
        USER.push(newUser);

        await client.upsertUser({
            id,
            email,
            name: email
        });

        const token = client.createToken(id);

        return res.status(200).json({
            token,
            user: {
                id,
                email,
            },
         });

    } catch (err) {
        res.status(500).json({ error: 'Something went wrong' });
    }

});


app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = USER.find((u) => u.email === email);
    const hashed_password = hashSync(password, salt);

    if (!user || user.hashed_password !== hashed_password) {
        return res.status(400).json({
            error: 'Invalid credentials' });
    }

    const token = client.createToken(user.id);

    return res.status(200).json({
        token,
        user: {
            id: user.id,
            email: user.email,
        },
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});