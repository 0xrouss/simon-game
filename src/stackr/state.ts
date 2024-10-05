import { State } from "@stackr/sdk/machine";
import { BytesLike, solidityPackedKeccak256 } from "ethers";

// Define the structure of a Simon game
interface Game {
    gameId: string;
    owner: string;
    user: string;
    startedAt: number;
    endedAt: number;
    roundCount: number;
    userSequence: string;
    gameSequence: string;
}

// Define the overall application state
export interface AppState {
    games: Record<string, Game>;
}

// SimonState class extends the State class from @stackr/sdk
export class SimonState extends State<AppState> {
    constructor(state: AppState) {
        super(state);
    }

    // Generate a root hash of the current state
    // This is used for state verification and integrity checks
    getRootHash(): BytesLike {
        return solidityPackedKeccak256(
            ["string"],
            [JSON.stringify(this.state.games)]
        );
    }
}
