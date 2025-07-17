import {
  StarknetProject,
  StarknetDatasourceKind,
  StarknetHandlerKind,
} from "@subql/types-starknet";

import * as dotenv from "dotenv";
import path from "path";

const mode = process.env.NODE_ENV || "production";

// Load the appropriate .env file
const dotenvPath = path.resolve(
  __dirname,
  `.env${mode !== "production" ? `.${mode}` : ""}`,
);
dotenv.config({ path: dotenvPath });

// Can expand the Datasource processor types via the generic param
const project: StarknetProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "starknet-sepolia-starter",
  description:
    "This project can be use as a starting point for developing your new Starknet Sepolia SubQuery project",
  runner: {
    node: {
      name: "@subql/node-starknet",
      version: "*",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /**
     * chainId is the Chain ID, for Starknet mainnet this is 0x534e5f4d41494e
     * https://docs.metamask.io/services/reference/starknet/json-rpc-methods/starknet_chainid/
     */
    chainId: process.env.CHAIN_ID!,
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: process.env.ENDPOINT!?.split(",") as string[] | string,
  },
  dataSources: [
    {
      kind: StarknetDatasourceKind.Runtime,
      startBlock: 943973,
      endBlock: 944000,
      options: {
        abi: "strk",
        address:
          "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      },
      assets: new Map([["strk", { file: "./abis/strk.abi.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: StarknetHandlerKind.Event,
            handler: "strk_handleTransferEvent",
            filter: { topics: ["Transfer"] },
          },
        ],
      },
    },
  ],
  repository: "https://github.com/subquery/starknet-subql-starter",
};

// Must set default to the project instance
export default project;
