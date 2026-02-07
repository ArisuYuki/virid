/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 21:53:13
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 21:16:05
 * @FilePath: /virid/packages/electron-render/app.ts
 * @Description:插件定义
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */

import { type ViridApp } from "@virid/core";
import {
  middleWare,
  convertToMainMessage,
  PluginOption,
  RenderRequestMessage,
  register,
} from "./render";
export function activateApp(app: ViridApp, options: PluginOption) {
  if (!window.__VIRID_BRIDGE__) {
    console.warn(
      `[Virid Electron-Render] Preloading Failed: Please initialize in the preloaded script first.`,
    );
  }
  if (!options?.windowId || !options?.registerMap) {
    console.warn(
      `[Virid Electron-Render] Activate Failed:\nPlease provide the windowId:${options?.windowId} and registerMap${options?.registerMap} in options.`,
    );
  }
  //注册自己的id
  RenderRequestMessage.__virid_source = options.windowId;
  //注册Map
  register(options.registerMap);
  //向主进程发消息注册自己
  window.__VIRID_BRIDGE__.post({
    __virid_source: options.windowId,
    __virid_target: "main",
    __virid_messageType: "VIRID_INTERNAL_REGISTER",
    payload: {
      windowId: options.windowId,
    },
  });
  // 所有返回的消息，全部转换成对应的MainMessage消息类型
  window.__VIRID_BRIDGE__.subscribe(convertToMainMessage);
  //注册自己的中间件函数，把RenderMessage拦截发往electron主进程
  app.useMiddleware(middleWare);
}
