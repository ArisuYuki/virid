import { MessageWriter } from "@virid/core";
import { MainRequestMessage } from "./types";
import { BrowserWindow } from "electron";
export const WINDOWS_MAP = new Map<string, BrowserWindow>();
let REGISTER_MESSAGE_MAP = new Map<string, any>();
export const VIRID_CHANNEL = "VIRID_INTERNAL_BUS";
export function registerMessage(registerMap: Map<string, any>): void {
  REGISTER_MESSAGE_MAP = registerMap;
}

//主进程接收消息并发给自己的system
function ReceiveMessages(message: any): void {
  const { __virid_source, __virid_messageType, __virid_target, payload } =
    message;
  // 查找主进程注册的消息类
  const MessageClass = REGISTER_MESSAGE_MAP.get(__virid_messageType);
  if (!MessageClass) {
    // 主进程没注册这个消息,直接报错
    MessageWriter.error(
      new Error(
        `[Virid Electron-Main] Unknown Message Type: Cannot find ${__virid_messageType} in the main process registry.`,
      ),
    );
    return;
  }
  // 实例化
  let instance = new (MessageClass as any)();
  // 不能重新发一个MainMessage，避免套娃
  if (instance instanceof MainRequestMessage) {
    MessageWriter.error(
      new Error(
        `[Virid Electron-Main] Prohibition Of Conversion:\nProhibit registering the type ${MessageClass} in the conversion table`,
      ),
    );
    return;
  }

  // 数据还原
  if (payload) {
    Object.assign(instance, payload);
  }
  // 注入身份元数据
  instance.__virid_source = __virid_source;
  instance.__virid_target = __virid_target;
  instance.__virid_messageType = __virid_messageType;
  // 注入物理上下文
  const context = WINDOWS_MAP.get(__virid_source);
  if (context) {
    instance.senderWindow = context;
  }

  // 派发给主进程的 System 群
  MessageWriter.write(instance);
}

function TransmitMessages(message: any): void {
  const { __virid_source, __virid_messageType, __virid_target, payload } =
    message;
  // 查找主进程注册的消息类
  const targetWindow = WINDOWS_MAP.get(__virid_target);
  if (!targetWindow) {
    // 主进程没注册这个消息,直接报错
    MessageWriter.error(
      new Error(
        `[Virid Electron-Main] Unknown Window: Cannot find ${__virid_target} in the windows registry.`,
      ),
    );
    return;
  }
  targetWindow.webContents.send(VIRID_CHANNEL, {
    __virid_source,
    __virid_messageType,
    __virid_target,
    payload,
  });
}
function broadcastMessage(message: any) {
  const { __virid_source, __virid_messageType, __virid_target, payload } =
    message;
  WINDOWS_MAP.forEach((window) => {
    window.webContents.send(VIRID_CHANNEL, {
      __virid_source,
      __virid_messageType,
      __virid_target,
      payload,
    });
  });
}

export function processMessage(message: any) {
  const { __virid_target, __virid_source, __virid_messageType } = message;
  if (__virid_target === "main") return ReceiveMessages(message);
  else if (__virid_target === "all" || __virid_target === "*")
    return broadcastMessage(message);
  else return TransmitMessages(message);
}
