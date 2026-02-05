/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 19:33:53
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-05 23:13:48
 * @FilePath: /starry-project/packages/core/index.ts
 * @Description:主入口
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
export * from "./decorators";
export * from "./message";
import { starryApp, type StarryApp } from "./app";
export { type StarryApp } from "./app";
export { type StarryPlugin } from "./types";
export function createStarry(): StarryApp {
  return starryApp;
}
