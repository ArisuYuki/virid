/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-07 16:53:09
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-08 13:51:05
 * @FilePath: /virid/packages/electron-render/src/render/middleWare.ts
 * @Description:中间件
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { type Middleware, MessageWriter } from "@virid/core";
import { ToMainMessage } from "./types";
export const middleWare: Middleware = (message, next) => {
  //如果消息继承自ToMainMessage，拦截并发往主进程
  if (message instanceof ToMainMessage) {
    const { __virid_target, __virid_messageType, ...payload } = message;
    //禁止发给自己
    if (__virid_target == ToMainMessage.__virid_source) {
      MessageWriter.warn(
        `[Virid Electron-Render] Prohibit Sending To Oneself: ${__virid_target} is not allowed in ToRenderMessage.`,
      );
    }
    window.__VIRID_BRIDGE__.post({
      __virid_source: ToMainMessage.__virid_source,
      __virid_target: __virid_target,
      __virid_messageType: __virid_messageType,
      payload: payload, // 展开实例上的所有属性
    });
  } else {
    next();
  }
};
