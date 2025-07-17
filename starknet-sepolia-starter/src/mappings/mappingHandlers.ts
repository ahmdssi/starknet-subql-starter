import {StarknetLog} from "@subql/types-starknet";
import {Wallet} from "../types";
import {Contract} from "starknet";
import strkAbi from "../../abis/strk.abi.json";

export const debug = (subject: string, value: any) =>
  logger.info(
    JSON.stringify(
      { subject, value },
      (_, value) => (typeof value === "bigint" ? value.toString() : value),
      2,
    ),
  );

const STRK_ADDRESS =
  "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

export async function getWallet(
  address: string,
  updateBalance = false,
): Promise<Wallet> {
  let wallet = await Wallet.get(address.toLowerCase());
  if (wallet && !updateBalance) return wallet;

  const strkContract = new Contract(strkAbi, STRK_ADDRESS, api);
  const rawBalance = await strkContract.balance_of(address);

  if (!wallet) {
    wallet = new Wallet(address.toLowerCase(), rawBalance);
  } else if (updateBalance) {
    wallet.balance = rawBalance;
  }
  await wallet.save();
  return wallet;
}

const ARGS_KEY = "src::strk::erc20_lockable::ERC20Lockable::Transfer";
type TransferArgs = {
  [ARGS_KEY]: {
    from: bigint;
    to: bigint;
    value: bigint;
  };
};

export async function strk_handleTransferEvent(log: StarknetLog<TransferArgs>) {
  const transferArgs = log.args?.[ARGS_KEY];
  if (!transferArgs) return;

  const from = "0x" + transferArgs.from.toString().padStart(63, "0");
  const to = "0x" + transferArgs.to.toString().padStart(63, "0");

  logger.info("strk_handleTransferEvent");
  debug("strk_handleTransferEvent/log", log);
  debug("strk_handleTransferEvent/from", from);
  debug("strk_handleTransferEvent/to", to);
  logger.info(
    `New Transfer event from ${from} to ${to} with value ${transferArgs.value}`,
  );

  await Promise.all([
    getWallet(from, true),
    getWallet(to, true),
  ]);
}
