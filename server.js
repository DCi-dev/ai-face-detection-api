import express from "express";
import bcrypt from "bcrypt-nodejs";
import cors from "cors";
import knex from "knex";

import { handleSignin } from "./controllers/signin.js";
import { handleRegister } from "./controllers/register.js";
import { handleProfileGet } from "./controllers/profile.js";
import { handleApiCall, handleImage } from "./controllers/image.js";

const app = express();
app.use(express.json());
app.use(cors());

// Database
const db = knex({
	client: "pg",
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: true,
	},
});

app.get("/", (req, res) => {
	res.send("it's working");
});

app.post("/signin", (req, res) => {
	handleSignin(req, res, db, bcrypt);
});

app.post("/register", (req, res) => {
	handleRegister(req, res, db, bcrypt);
});

app.get("/profile/:id", (req, res) => {
	handleProfileGet(req, res, db);
});

app.post("/imageurl", (req, res) => {
	handleApiCall(req, res);
});

app.put("/image", (req, res) => {
	handleImage(req, res, db);
});

app.listen(process.env.PORT || 3000, () => {
	console.log(`app is running on port ${process.env.PORT}`);
});
