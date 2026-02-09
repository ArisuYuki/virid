/*
 * Copyright (c) 2026-present ShirahaYuki.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Amber
 */
import { type ViridApp, MessageWriter, BaseMessage } from "@virid/core";
import { amberStore, afterExecuteHooks, afterTickHooks } from "./amber";
export interface IviridApp {
  get(identifier: any): any;
}

let activeApp: IviridApp | null = null;

export function activateApp(app: ViridApp) {
  //注册钩子
  app.onAfterTick(afterTickHooks);
  app.onAfterExecute(BaseMessage, afterExecuteHooks);
  // 缓存原始方法并绑定上下文，防止 this 指向丢失
  const originalMethod = app.bindComponent.bind(app);
  // 劫持 bindComponent
  app.bindComponent = <T>(identifier: new (...args: any[]) => T) => {
    const binding = originalMethod(identifier);
    // @ts-ignore: 注入钩子
    return binding.onActivation((_context, instance) => {
      if (instance) {
        //最终后悔药，实例化的时候，seal第一个版本
        amberStore.seal(instance.constructor, instance);
      }
      return instance;
    });
  };
  activeApp = app;
}

/**
 * viridApp 代理
 */
export const viridApp: IviridApp = new Proxy({} as IviridApp, {
  get(_, prop: keyof IviridApp) {
    return (...args: any[]) => {
      // 检查实例是否存在
      if (!activeApp) {
        MessageWriter.warn(
          `[Virid Vue] App method "${String(prop)}" called before initialization.`,
        );
        return null;
      }
      // 正常转发调用
      // 使用 Reflect 确保 this 指向正确，或者直接从 activeApp 调用
      const targetMethod = activeApp[prop];
      if (typeof targetMethod === "function") {
        // @ts-ignore
        return targetMethod.apply(activeApp, args);
      }
    };
  },
});
