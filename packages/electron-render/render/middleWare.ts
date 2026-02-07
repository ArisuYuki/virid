/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-07 16:53:09
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 21:15:46
 * @FilePath: /virid/packages/electron-render/render/middleWare.ts
 * @Description:中间件
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { Middleware } from "@virid/core";
import { RenderRequestMessage } from "./types";
export const middleWare: Middleware = (message, next) => {
  //如果消息是继承自RenderMessage，拦截并发往主进程
  if (message instanceof RenderRequestMessage) {
    window.__VIRID_BRIDGE__.post({
      __virid_source: RenderRequestMessage.__virid_source,
      __virid_target: (message as any).__virid_target,
      __virid_messageType: (message as any).__virid_messageType,
      payload: { ...message }, // 展开实例上的所有属性
    });
  } else {
    next();
  }
};
