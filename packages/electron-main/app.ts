/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 21:53:13
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 20:52:39
 * @FilePath: /virid/packages/electron-main/app.ts
 * @Description:存储一个代理壳子
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
const VIRID_CHANNEL = "VIRID_INTERNAL_BUS";
import { type ViridApp, MessageWriter } from "@virid/core";
import { BrowserWindow, ipcMain } from "electron";
import { middleWare, processMessage, PluginOption, WINDOWS_MAP } from "./main";
export function activateApp(app: ViridApp, options: PluginOption) {
  if (!options?.electronApp || !options?.registerMap) {
    MessageWriter.error(
      new Error(
        `[Virid Electron-Main] Missing Initialization Parameters:\nelectronApp:${options?.electronApp}\nregisterMap${options?.registerMap}.`,
      ),
    );
  }
  //绑定electron主进程回调
  ipcMain.on(VIRID_CHANNEL, (event, message) => {
    const { __virid_target, __virid_source, __virid_messageType } = message;
    if (!__virid_target || !__virid_source || !__virid_messageType) {
      MessageWriter.error(
        new Error(
          `[Virid Electron-Main] Incomplete Message: The message is incomplete and requires __virid_target${__virid_target}, __virid_source${__virid_source}, __virid_messageType${__virid_messageType}`,
        ),
      );
      return;
    }
    // 捕获注册消息
    if (__virid_messageType === "VIRID_INTERNAL_REGISTER") {
      // 通过 event.sender 拿到物理实例，并与逻辑 ID 绑定
      const win = BrowserWindow.fromWebContents(event.sender);
      //如果已经存在了，报错
      if (WINDOWS_MAP.has(__virid_source)) {
        MessageWriter.error(
          new Error(
            `[Virid Electron-Main] Duplicate Registration: This ID has already been registered: ${__virid_source}`,
          ),
        );
        return;
      }
      // 存入注册表
      WINDOWS_MAP.set(__virid_source, win);
      // 关闭时自动删除自己
      win.once("closed", () => {
        WINDOWS_MAP.delete(__virid_source);
        console.log(
          `[Virid Electron-Main] Window unregistered: ${__virid_source}`,
        );
      });
      console.log(`[Virid Electron-Main] Window registered: ${__virid_source}`);
      return;
    }
    processMessage(message);
  });
  //注册自己的中间件函数，把MainMessage拦截发往指定的渲染进程
  app.useMiddleware(middleWare);
}
