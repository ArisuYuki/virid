/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 21:53:13
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-08 14:45:39
 * @FilePath: /virid/packages/electron-render/src/app.ts
 * @Description:插件定义
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */

import { MessageWriter, type ViridApp } from "@virid/core";
import {
  middleWare,
  convertToMainMessage,
  PluginOption,
  ToMainMessage,
  registerMessage,
} from "./render";
export function activateApp(app: ViridApp, options: PluginOption) {
  // 先检查预加载脚本是否已经加载
  if (!window.__VIRID_BRIDGE__) {
    MessageWriter.error(
      new Error(
        `[Virid Electron-Render] Preloading Failed: Please initialize in the preloaded script first.`,
      ),
    );
  }
  // 检查参数是否传递
  if (!options?.windowId || !options?.messageMap) {
    MessageWriter.error(
      new Error(
        `[Virid Electron-Render] Activate Failed:\nPlease provide the windowId:${options?.windowId} and messageMap${options?.messageMap} in options.`,
      ),
    );
  }
  //注册自己的id，以后所有发往主进程的消息都会携带自己的id
  ToMainMessage.__virid_source = options.windowId;
  //注册Map,知道如何把主进程的消息转换成自己的Message
  registerMessage(options.messageMap);
  //主动向主进程发一个注册消息来注册自己
  window.__VIRID_BRIDGE__.post({
    __virid_source: options.windowId,
    __virid_target: "main",
    __virid_messageType: "VIRID_INTERNAL_REGISTER",
    payload: {
      windowId: options.windowId,
    },
  });
  // 订阅ipc通道，所有返回的消息，全部转换按照注册表转换成自己的消息类型
  window.__VIRID_BRIDGE__.subscribe(convertToMainMessage);
  //注册自己的中间件函数，把ToMainMessage类型的消息拦截发往electron主进程
  app.useMiddleware(middleWare);
}
