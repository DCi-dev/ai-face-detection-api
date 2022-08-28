import express from "express";
import bcrypt from "bcrypt-nodejs";
import cors from "cors";
import knex from "knex";
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";

const app = express();
app.use(express.json());
app.use(cors());

// Clarifai API settings
const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
metadata.set("authorization", "Key 3c290d71e7ec49839a69f5e1c407486d");

// Database
const db = knex({
	client: "pg",
	connection: {
		host: "127.0.0.1", //localhost
		port: 5432,
		user: "postgres",
		password: "pringles9",
		database: "smart-brain",
	},
});

app.get("/", (req, res) => {
	res.send("it's working");
});

app.post("/signin", (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json("incorrect form submission");
	}
	db.select("email", "hash")
		.from("login")
		.where("email", "=", email)
		.then((data) => {
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if (isValid) {
				return db
					.select("*")
					.from("users")
					.where("email", "=", email)
					.then((user) => {
						res.json(user[0]);
					})
					.catch((err) => res.status(400).json("unable to get user"));
			} else {
				res.status(400).json("wrong credentials");
			}
		})
		.catch((err) => res.status(400).json("wrong credentials"));
});

app.post("/register", (req, res) => {
	const { email, name, password } = req.body;
	if (!email || !name || !password) {
		return res.status(400).json("incorrect form submission");
	}
	const hash = bcrypt.hashSync(password);
	db.transaction((trx) => {
		trx
			.insert({
				hash: hash,
				email: email,
			})
			.into("login")
			.returning("email")
			.then((loginEmail) => {
				return trx("users")
					.returning("*")
					.insert({
						email: loginEmail[0].email,
						name: name,
						joined: new Date(),
					})
					.then((user) => {
						res.json(user[0]);
					});
			})
			.then(trx.commit)
			.catch(trx.rollback);
	}).catch((err) => res.status(400).json("unable to register"));
});

app.get("/profile/:id", (req, res) => {
	const { id } = req.params;
	db.select("*")
		.from("users")
		.where({ id })
		.then((user) => {
			if (user.length) {
				res.json(user[0]);
			} else {
				res.status(400).json("not found");
			}
		})
		.catch((err) => res.status(400).json("unable to get user"));
});

app.put("/image", (req, res) => {
	const { id } = req.body;
	db("users")
		.where("id", "=", id)
		.increment("entries", 1)
		.returning("entries")
		.then((entries) => {
			res.json(entries[0].entries);
		})
		.catch((err) => res.status(400).json("unable to get entries"));
});

app.post("/imageurl", (req, res) => {
	stub.PostModelOutputs(
		{
			user_app_id: {
				user_id: "cdi",
				app_id: "facial-recognition",
			},
			model_id: "a403429f2ddf4b49b307e318f00e528b",
			inputs: [{ data: { image: { url: req.body.input } } }],
		},
		metadata,
		(err, response) => {
			if (err) {
				console.log("Error: " + err);
				return;
			}

			if (response.status.code !== 10000) {
				console.log(
					"Received failed status: " +
						response.status.description +
						"\n" +
						response.status.details
				);
				return;
			}

			console.log("Predicted concepts, with confidence values:");
			for (const c of response.outputs[0].data.concepts) {
				console.log(c.name + ": " + c.value);
			}
			res.json(response);
		}
	);
});

app.listen(3000, () => {
	console.log("app is running on port 3000");
});
