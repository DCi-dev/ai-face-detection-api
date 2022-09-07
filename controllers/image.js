import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";

// Clarifai API settings
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key 3c290d71e7ec49839a69f5e1c407486d");

// Call Clarifai API
function handleApiCall(req, res) {
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

			for (const c of response.outputs[0].data.concepts) {
				console.log(c.name + ": " + c.value);
			}
			res.json(response);
		}
	);
}

// Update user entries
function handleImage(req, res, db) {
	const { id } = req.body;
	db("users")
		.where("id", "=", id)
		.increment("entries", 1)
		.returning("entries")
		.then((entries) => {
			res.json(entries[0].entries);
		})
		.catch((err) => res.status(400).json("unable to get entries"));
}

export { handleApiCall, handleImage };
