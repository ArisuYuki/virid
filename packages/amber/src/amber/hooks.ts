import {
  type ExecuteHook,
  type TickHook,
  BaseMessage,
  ErrorMessage,
  WarnMessage,
} from "@virid/core";
import { amberStore } from "./amber";
import { VIRID_METADATA } from "../decorators";

const dirtyBuffer = new Set<any>();

export const afterExecuteHooks: ExecuteHook<BaseMessage> = (
  message,
  context,
) => {
  if (message instanceof ErrorMessage || message instanceof WarnMessage) return;

  context.context.params.forEach((paramClass) => {
    // 只要有 @Backup 标签，就先标记为“可能脏了”
    if (Reflect.getMetadata(VIRID_METADATA.BACKUP, paramClass)) {
      dirtyBuffer.add(paramClass);
    }
  });
};

export const afterTickHooks: TickHook = (_context) => {
  dirtyBuffer.forEach((compClass) => {
    amberStore.seal(compClass);
  });
  dirtyBuffer.clear();
};
