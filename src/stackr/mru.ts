import { MicroRollup } from "@stackr/sdk";
import { stackrConfig } from "../../stackr.config";
import { machine } from "./machine";

// Create a new MRU instance
const mru = await MicroRollup({
    config: stackrConfig, // Configuration for the MRU
    stateMachines: [machine], // State machines used by the MRU
});

export { mru };
