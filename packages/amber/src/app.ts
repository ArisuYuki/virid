/*
 * Copyright (c) 2026-present Ailrid.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Amber
 */
import { type ViridApp, MessageWriter, BaseMessage } from "@virid/core";
import {
  amberComponentStore,
  afterExecuteHooks,
  afterTickHooks,
  PluginOptions,
  activateConfig,
} from "./amber";
import { VIRID_METADATA } from "./decorators";
export interface IviridApp {
  get(identifier: any): any;
}

let activeApp: IviridApp | null = null;

export function activateApp(app: ViridApp, options: PluginOptions) {
  //注册钩子
  app.onAfterTick(afterTickHooks, true);
  app.onAfterExecute(BaseMessage, afterExecuteHooks, true);
  //看看用户提供的配置
  if (options) activateConfig(options);
  const amberInitHook = (_context, instance) => {
    if (
      instance &&
      Reflect.hasMetadata(VIRID_METADATA.VERSION, instance.constructor)
    ) {
      //实例化的时候，init第一个版本
      amberComponentStore.initComponent(instance);
    }
  };
  app.addActivationHook(amberInitHook);
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
