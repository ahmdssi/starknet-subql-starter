import assert from "assert";
import { StarknetLog, StarknetTransaction } from "@subql/types-starknet";
import { Address, Deposit, Withdraw } from "../types/models";
import { BigNumber, BigNumberish } from "ethers";

/***
 *
 *     "kind": "struct",
 *     "name": "zklend::market::Market::Deposit",
 *     "type": "event",
 *     "members": [
 *       {
 *         "kind": "data",
 *         "name": "user",
 *         "type": "core::starknet::contract_address::ContractAddress"
 *       },
 *       {
 *         "kind": "data",
 *         "name": "token",
 *         "type": "core::starknet::contract_address::ContractAddress"
 *       },
 *       {
 *         "kind": "data",
 *         "name": "face_amount",
 *         "type": "core::felt252"
 *       }
 *     ]
 *
 */

type DespositEvent = {
  user: BigNumberish;
  token: BigNumberish;
  face_amount: string;
};
type DespositArgs = {
  "zklend::market::Market::Deposit": DespositEvent;
  block_hash: string;
  block_number: number;
  transaction_hash: string;
};

// @ts-ignore
type DepositLog = StarknetLog<DespositArgs>;
type WithdrawTransaction = StarknetTransaction;

// Custom method replace "num.toHexString", due to sandbox TextEncoder issue
//  at utf8ToBytes (webpack://stark-starter/./node_modules/@scure/starknet/node_modules/@noble/hashes/utils.js:109:31)
function convertBigNumberish(bigNumberish: BigNumberish): string {
  const bigNumber = BigNumber.from(bigNumberish);
  const hexValue = bigNumber.toHexString();
  return hexValue;
}

async function checkGetAddress(addressString: string): Promise<Address> {
  let address = await Address.get(addressString.toLowerCase());
  if (!address) {
    address = Address.create({
      id: addressString.toLowerCase(),
    });
    await address.save();
  }
  return address;
}

export async function handleLog(log: DepositLog): Promise<void> {
  logger.info(`New deposit event at block ${log.blockNumber}`);
  assert(log.args, `No log.args, check tx ${log.transactionHash}`);
  const event = log.args["zklend::market::Market::Deposit"];
  const token = convertBigNumberish(event.token);

  // Get Address
  const addressString = convertBigNumberish(event.user);
  const address = await checkGetAddress(addressString);

  const deposit = Deposit.create({
    id: `${log.transactionHash}_${address.id}`,
    token: token,
    amount: BigInt(event.face_amount),
    addressId: address.id,
    createdBlock: BigInt(log.blockNumber),
    created: new Date(log.transaction.blockTimestamp * 1000),
  });
  await deposit.save();
}

export async function handleTransaction(
  tx: WithdrawTransaction
): Promise<void> {
  logger.info(`New Withdraw transaction at block ${tx.blockNumber}`);
  assert(tx.decodedCalls, "No tx decodedCalls");

  // Get Address
  const addressString = convertBigNumberish(tx.from);
  const address = await checkGetAddress(addressString);

  for (let i = 0; i < tx.decodedCalls.length; i++) {
    const call = tx.decodedCalls[i];
    // Because the entire invoke transaction is returned, so we need to filter out the calls with filter here again
    // This should not have major impact on performance
    if (
      call.selector ===
        "0x015511cc3694f64379908437d6d64458dc76d02482052bfb8a5b33a72c054c77" ||
      call.selector ===
        "0x15511cc3694f64379908437d6d64458dc76d02482052bfb8a5b33a72c054c77"
    ) {
      if (!call.decodedArgs) {
        throw new Error(
          `Expect decodedArgs in withdraw tx ${tx.hash}, call #${i}`
        );
      }

      const withdraw = Withdraw.create({
        id: `${tx.hash}_${i}`,
        addressId: address.id,
        token: convertBigNumberish(call.decodedArgs.token),
        amount: BigInt(call.decodedArgs.amount),
        created: new Date(tx.blockTimestamp * 1000),
        createdBlock: BigInt(tx.blockNumber),
      });
      await withdraw.save();
    }
  }
}
