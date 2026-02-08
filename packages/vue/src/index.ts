/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 20:08:55
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-08 12:42:49
 * @FilePath: /virid/packages/vue/src/index.ts
 * @Description:vue 插件
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { ViridPlugin, type ViridApp } from "@virid/core";
export * from "./adapters";
export * from "./decorators";
import { activateApp } from "./app";
export const VuePlugin: ViridPlugin<{}> = {
  name: "@virid/vue",
  install(app: ViridApp, _options) {
    activateApp(app);
  },
};
