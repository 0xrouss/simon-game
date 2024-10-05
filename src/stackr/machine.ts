import { StateMachine } from "@stackr/sdk/machine";
import genesisState from "../../genesis-state.json";
import { SimonState } from "./state";
import { transitions } from "./transitions";

// Define the State Machine for the Simon game
const machine = new StateMachine({
    id: "simon", // Unique identifier for this state machine
    stateClass: SimonState, // The state class used by this machine
    initialState: genesisState.state, // Initial state loaded from a JSON file
    on: transitions, // Transitions that can be applied to the state
});

export { machine };
