/*
 * Copyright (c) 2026-present Ailrid.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Core
 */
import { ViridContainer } from "./container";
import {
  BaseMessage,
  ExecuteHook,
  MessageIdentifier,
  MessageWriter,
  Middleware,
  MessageInternal,
  TickHook,
  Newable,
} from "./core";
import { bindObservers } from "./decorators";
import { initializeGlobalSystems } from "./utils";

export interface ViridPlugin<T = any> {
  name: string;
  install: (app: ViridApp, options?: T) => void;
}

// 维护一个已安装插件的列表，防止重复安装
const installedPlugins = new Set<string>();
/**
 * 创建 virid 核心实例
 */
export class ViridApp {
  public container: ViridContainer = new ViridContainer();
  private messageInternal: MessageInternal = new MessageInternal();
  // Core 内部提供一个中间件数组
  private activationHooks: Array<(context: any, instance: any) => void> = [];
  public addActivationHook(hook: (context: any, instance: any) => void) {
    this.activationHooks.push(hook);
  }

  public get<T>(identifier: Newable<T>): T {
    if (identifier.length > 0) {
      MessageWriter.error(
        new Error(
          `[Virid Container] Violation: Component "${identifier.name}" should not have constructor arguments. Dependency Injection is only allowed in Systems.`,
        ),
      );
    }
    return this.container.get(identifier, (ins) => this.handleActivation(ins));
  }
  // 统一的激活逻辑处理
  private handleActivation<T>(instance: T): T {
    if (instance) {
      bindObservers(instance); // 执行 Core 的 Observer
      this.activationHooks.forEach((hook) => {
        try {
          // 这里的 context 传入 null 或模拟对象，因为我们不再依赖 Inversify 的 context
          hook(null, instance);
        } catch (e) {
          MessageWriter.error(e, `[Virid Core] Activation hook failed`);
        }
      });
    }
    return instance;
  }
  /**
   * 绑定多例 (Controller 通常是多例)
   */
  bindController<T>(identifier: Newable<T>) {
    this.container.bind(identifier).toSelf();
    // 保持链式调用风格，即便现在后面没接东西
    return { inSingletonScope: () => ({ onActivation: () => {} }) };
  }

  /**
   * 绑定单例 (Component 是单例)
   */
  bindComponent<T>(identifier: Newable<T>) {
    this.container.bind(identifier).toSelf().inSingletonScope();
    return { onActivation: () => {} };
  }
  useMiddleware(mw: Middleware, front = false) {
    this.messageInternal.useMiddleware(mw, front);
  }
  onBeforeExecute<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: ExecuteHook<T>,
    front = false,
  ) {
    this.messageInternal.onBeforeExecute(type, hook, front);
  }
  onAfterExecute<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: ExecuteHook<T>,
    front = false,
  ) {
    this.messageInternal.onAfterExecute(type, hook, front);
  }
  onBeforeTick(hook: TickHook, front = false) {
    this.messageInternal.onBeforeTick(hook, front);
  }
  onAfterTick(hook: TickHook, front = false) {
    this.messageInternal.onAfterTick(hook, front);
  }
  register(
    eventClass: any,
    systemFn: (...args: any[]) => any,
    priority: number = 0,
  ): () => void {
    return this.messageInternal.register(eventClass, systemFn, priority);
  }
  use<T>(plugin: ViridPlugin<T>, options: T): this {
    if (installedPlugins.has(plugin.name)) {
      MessageWriter.warn(
        `[Virid Plugin] Plugin ${plugin.name} has already been installed.`,
      );
      return this;
    }
    try {
      plugin.install(this, options);
      installedPlugins.add(plugin.name);
    } catch (e) {
      MessageWriter.error(
        e as Error,
        `[Virid Plugin]: Install Faild: ${plugin.name}`,
      );
    }
    return this;
  }
}

export const viridApp = new ViridApp();

initializeGlobalSystems(viridApp);
