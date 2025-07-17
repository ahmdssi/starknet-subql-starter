// Polyfills for starknet js to work
import { TextEncoder, TextDecoder } from "text-encoding";
import fetch from "node-fetch";

global.TextEncoder ??= TextEncoder;
global.TextDecoder ??= TextDecoder;
(global as any).fetch ??= fetch;

//Exports all handler functions
export * from "./mappings/mappingHandlers";
