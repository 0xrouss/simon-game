import { Transitions, SolidityType } from "@stackr/sdk/machine";
import { SimonState } from "./state";
import { hashMessage } from "ethers";

const colors: string[] = ["red", "blue", "yellow", "green"];

// Define the createGame transition
const createGame = SimonState.STF({
    schema: {
        timestamp: SolidityType.UINT,
        owner: SolidityType.ADDRESS,
    },
    handler: ({ state, inputs, msgSender, block, emit }) => {
        // Generate a unique game ID
        const gameId = hashMessage(
            `${msgSender}::${block.timestamp}::${
                Object.keys(state.games).length
            }`
        );

        // Create a new game in the state
        state.games[gameId] = {
            gameId: gameId,
            owner: inputs.owner,
            user: msgSender,
            startedAt: block.timestamp,
            endedAt: 0,
            roundCount: 1,
            userSequence: "",
            gameSequence: generateNewMove(),
        };

        // Emit an event for game creation
        emit({
            name: "Game Created",
            value: gameId,
        });

        return state;
    },
});

// Helper function to generate a new move in the game sequence
function generateNewMove(moves: string = "") {
    const randomIndex = Math.floor(Math.random() * colors.length);
    const newMove = colors[randomIndex];
    if (moves.length > 0) {
        return moves.concat(`,${newMove}`);
    }
    return moves.concat(`${newMove}`);
}

// Define the userMoves transition
const userMoves = SimonState.STF({
    schema: {
        gameId: SolidityType.STRING,
        moves: SolidityType.STRING,
    },
    handler: ({ state, inputs, msgSender, block, emit }) => {
        const { gameId, moves } = inputs;
        const game = state.games[gameId];

        // Check if the user is valid
        if (game.user != msgSender) {
            emit({
                name: "Invalid User",
                value: `${gameId},${game.user},${msgSender}`,
            });
            return state;
        }

        game.userSequence = moves;

        // Check if the user's moves match the game sequence
        if (game.gameSequence == moves) {
            // If correct, generate a new move and increment the round
            game.gameSequence = generateNewMove(game.gameSequence);
            game.roundCount += 1;

            emit({
                name: "New Move",
                value: `${gameId},${game.roundCount}`,
            });
        } else {
            // If incorrect, end the game
            game.endedAt = block.timestamp;

            emit({
                name: "Game Ended",
                value: `${gameId},${game.roundCount}`,
            });
        }

        return state;
    },
});

// Export the transitions
export const transitions: Transitions<SimonState> = {
    createGame,
    userMoves,
};
