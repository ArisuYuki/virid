/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 20:08:55
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-05 23:12:55
 * @FilePath: /starry-project/packages/vue/index.ts
 * @Description:vue 插件
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { StarryPlugin, StarryApp } from "@starry/core";
export * from "./decorators";
export * from "./adapters";
import { activateApp } from "./app";
export const VuePlugin: StarryPlugin = {
  name: "@starry/vue",
  install(app: StarryApp, _options) {
    activateApp(app);
  },
};
