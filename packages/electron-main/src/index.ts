/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 20:08:55
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-08 13:32:47
 * @FilePath: /virid/packages/electron-main/src/index.ts
 * @Description:electron-main 插件
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { ViridPlugin, type ViridApp } from "@virid/core";
import { type PluginOption } from "./main";
export * from "./main";
import { activateApp } from "./app";
export const MainPlugin: ViridPlugin<PluginOption> = {
  name: "@virid/electron-main",
  install(app: ViridApp, options: PluginOption) {
    activateApp(app, options);
  },
};
