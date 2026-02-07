/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 20:08:55
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 21:16:10
 * @FilePath: /virid/packages/electron-render/index.ts
 * @Description:render 插件
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { ViridPlugin, type ViridApp } from "@virid/core";
export { RenderRequestMessage, MainResponseMessage } from "./render";
import { activateApp } from "./app";
import { type PluginOption } from "./render";
export const RenderPlugin: ViridPlugin<PluginOption> = {
  name: "@virid/electron-render",
  install(app: ViridApp, options: PluginOption) {
    activateApp(app, options);
  },
};
