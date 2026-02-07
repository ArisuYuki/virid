/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-07 16:57:38
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 21:15:52
 * @FilePath: /virid/packages/electron-render/render/registerMap.ts
 * @Description: 转发中心
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { MessageWriter } from "@virid/core";
import { RenderRequestMessage } from "./types";
let REGISTER_MAP = new Map<string, any>();

export function register(renderMap: Map<string, any>) {
  REGISTER_MAP = renderMap;
}

export function convertToMainMessage(ipcMessage: any): void {
  // 解构
  const { __virid_source, __virid_target, __virid_messageType, payload } =
    ipcMessage;
  if (!__virid_messageType || !__virid_source || !__virid_target) {
    MessageWriter.error(
      new Error(
        `[Virid Electron-Render] Incomplete Data:\n__virid_source: ${__virid_source}\n__virid_target:${__virid_target}\n__virid_messageType: ${__virid_messageType}.`,
      ),
    );
    return;
  }
  // 找到对应的构造函数
  const MessageClass = REGISTER_MAP.get(__virid_messageType);
  if (!MessageClass) {
    MessageWriter.error(
      new Error(
        `[Virid Electron-Render] Unregistered type: ${__virid_messageType} `,
      ),
    );
    return;
  }

  // 实例化与注塑
  const instance = new (MessageClass as any)();
  // 不能套娃重新发送一个
  if (instance instanceof RenderRequestMessage) {
    MessageWriter.error(
      new Error(
        `[Virid Electron-Render] Prohibition Of Conversion:\nProhibit registering the type ${MessageClass} in the conversion table`,
      ),
    );
    return;
  }
  // 还原数据
  if (payload) {
    Object.assign(instance, payload);
  }

  // 显式赋值基类标识，确保实例的身份信息完整
  instance.__virid_source = __virid_source;
  instance.__virid_target = __virid_target;
  instance.__virid_messageType = __virid_messageType;

  // 重新分发
  MessageWriter.write(instance);
}
