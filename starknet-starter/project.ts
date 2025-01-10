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
  `.env${mode !== "production" ? `.${mode}` : ""}`
);
dotenv.config({ path: dotenvPath });

// Can expand the Datasource processor types via the generic param
const project: StarknetProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "starknet-starter",
  description:
    "This project can be use as a starting point for developing your new Starknet SubQuery project",
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
      startBlock: 995339,
      options: {
        // Must be a key of assets
        abi: "zkLend",
        // # this is the contract address for zkLend market https://starkscan.co/contract/0x04c0a5193d58f74fbace4b74dcf65481e734ed1714121bdc571da345540efa05
        address:
          "0x04c0a5193d58f74fbace4b74dcf65481e734ed1714121bdc571da345540efa05",
      },
      assets: new Map([["zkLend", { file: "./abis/zkLend.abi.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: StarknetHandlerKind.Call,
            handler: "handleTransaction",
            filter: {
              to: "0x04c0a5193d58f74fbace4b74dcf65481e734ed1714121bdc571da345540efa05",
              type: "INVOKE",
              /**
               * The function can either be the function fragment or signature
               * function: 'withdraw'
               * function: '0x015511cc3694f64379908437d6d64458dc76d02482052bfb8a5b33a72c054c77'
               */
              function: "withdraw",
            },
          },
          {
            kind: StarknetHandlerKind.Event,
            handler: "handleLog",
            filter: {
              /**
               * Follows standard log filters for Starknet
               * zkLend address: "0x04c0a5193d58f74fbace4b74dcf65481e734ed1714121bdc571da345540efa05"
               */
              topics: [
                "Deposit", //0x9149d2123147c5f43d258257fef0b7b969db78269369ebcf5ebb9eef8592f2
              ],
            },
          },
        ],
      },
    },
  ],
  repository: "https://github.com/subquery/starknet-subql-starter",
};

// Must set default to the project instance
export default project;
