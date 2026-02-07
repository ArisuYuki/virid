/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 19:33:53
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 20:45:43
 * @FilePath: /virid/packages/core/index.ts
 * @Description:主入口
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
export * from "./decorators";
export * from "./message";
import { viridApp, type ViridApp } from "./app";
export { type ViridApp, type ViridPlugin } from "./app";

export function createVirid(): ViridApp {
  return viridApp;
}
