import { ActionConfirmationStatus, MicroRollup } from "@stackr/sdk";
import { machine } from "./stackr/machine.ts";
import { Playground } from "@stackr/sdk/plugins";
import express, { Request, Response } from "express";
import { mru } from "./stackr/mru.ts";
import path from "path";

/**
 * Main function to set up and run the Stackr micro rollup server
 */
const main = async () => {
    // Initialize the MRU instance
    await mru.init();

    // Initialize the Playground plugin for debugging and testing
    Playground.init(mru);

    // Set up Express server
    const app = express();
    app.use(express.json());

    // Serve static files from the "public" directory
    app.use(express.static(path.join(__dirname, "public")));

    // Enable CORS for all routes
    app.use((_req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    });

    // Serve the HTML file for the Simon game
    app.get("/", (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, "public", "simon.html"));
    });

    /**
     * GET /info - Retrieve information about the MicroRollup instance
     * Returns domain information and schema map for action reducers
     */
    app.get("/info", (req: Request, res: Response) => {
        const schemas = mru.getStfSchemaMap();
        const { name, version, chainId, verifyingContract, salt } =
            mru.config.domain;
        res.send({
            signingInstructions: "signTypedDate(domain, schema.types, inputs)",
            domain: {
                name,
                version,
                chainId,
                verifyingContract,
                salt,
            },
            schemas,
        });
    });

    /**
     * POST /:reducerName - Submit an action to a specific reducer
     * Processes the action and returns the result or any errors
     */
    app.post("/:reducerName", async (req: Request, res: Response) => {
        const { reducerName } = req.params;

        const actionReducer = mru.getStfSchemaMap()[reducerName];

        if (!actionReducer) {
            res.status(400).send({ message: "NO_REDUCER_FOR_ACTION" });
            return;
        }

        try {
            const { msgSender, signature, inputs } = req.body;

            const actionParams = {
                name: reducerName,
                inputs,
                signature,
                msgSender,
            };

            // Submit the action to the MicroRollup instance
            const ack = await mru.submitAction(actionParams);
            // Wait for the action to be confirmed (C1 status)
            const { errors, logs } = await ack.waitFor(
                ActionConfirmationStatus.C1
            );

            if (errors?.length) {
                throw new Error(errors[0].message);
            }

            res.status(201).send({ logs });
        } catch (e: any) {
            console.error("Error processing action:", e.message);
            res.status(400).send({ error: e.message });
        }

        return;
    });

    /**
     * GET /games - Retrieve all games from the state machine
     */
    app.get("/games", async (req: Request, res: Response) => {
        const { games } = machine.state;
        res.json(games);
    });

    /**
     * GET /games/:gameId - Retrieve a specific game by ID
     */
    app.get("/games/:gameId", async (req: Request, res: Response) => {
        const { gameId } = req.params;
        const { games } = machine.state;

        const game = games[gameId];

        if (!game) {
            res.status(404).send({ message: "GAME_NOT_FOUND" });
            return;
        }

        res.json(game);
    });

    // Start the server
    app.listen(3012, () => {
        console.log("Server running on port 3012");
    });
};

// Run the main function
main();
