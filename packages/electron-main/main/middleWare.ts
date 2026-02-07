import { Middleware, MessageWriter } from "@virid/core";
import { MainRequestMessage } from "./types";
import { WINDOWS_MAP, VIRID_CHANNEL } from "./routingCenter";
export const middleWare: Middleware = (message, next) => {
  //如果消息是继承自MainRequestMessage，拦截并发往对应的渲染进程
  if (message instanceof MainRequestMessage) {
    if (WINDOWS_MAP.has(message.__virid_target)) {
      const window = WINDOWS_MAP.get(message.__virid_target);
      window.webContents.send(VIRID_CHANNEL, {
        __virid_source: MainRequestMessage.__virid_source,
        __virid_target: message.__virid_target,
        __virid_messageType: message.__virid_messageType,
        payload: { ...message },
      });
    } else if (
      message.__virid_target === "*" ||
      message.__virid_target === "all"
    ) {
      WINDOWS_MAP.forEach((window) => {
        window.webContents.send(VIRID_CHANNEL, {
          __virid_source: MainRequestMessage.__virid_source,
          __virid_target: message.__virid_target,
          __virid_messageType: message.__virid_messageType,
          payload: { ...message },
        });
      });
    } else {
      MessageWriter.error(
        new Error(
          `[Virid Electron-Main]No Window Found: Message target ${message.__virid_target} cannot be found.`,
        ),
      );
    }
  } else {
    next();
  }
};
