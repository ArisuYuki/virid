/*
 * Copyright (c) 2026-present Ailrid.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Core
 */
import {
  BindInWhenOnFluentSyntax,
  BindWhenFluentSyntax,
  Container,
} from "inversify";
import {
  BaseMessage,
  ExecuteHook,
  MessageIdentifier,
  MessageWriter,
  Middleware,
  MessageInternal,
  TickHook,
} from "./core";
import { bindObservers } from "./decorators";
import { MessageRegistry } from "./core/registry";
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
  public container: Container = new Container();
  private messageInternal: MessageInternal = new MessageInternal();
  // Core 内部提供一个中间件数组
  private activationHooks: Array<(context: any, instance: any) => void> = [];
  public addActivationHook(hook: (context: any, instance: any) => void) {
    this.activationHooks.push(hook);
  }
  private bindBase<T>(identifier: new (...args: any[]) => T) {
    return this.container.bind<T>(identifier).toSelf();
  }
  get<T>(identifier: new (...args: any[]) => T): T {
    return this.container.get<T>(identifier);
  }

  bindController<T>(
    identifier: new (...args: any[]) => T,
  ): BindInWhenOnFluentSyntax<T> {
    return this.bindBase(identifier);
  }
  bindComponent<T>(
    identifier: new (...args: any[]) => T,
  ): BindWhenFluentSyntax<T> {
    return this.bindBase(identifier)
      .inSingletonScope()
      .onActivation((context, instance) => {
        if (instance) {
          // 执行 Core 自己的 Observer
          bindObservers(instance);
          // 执行所有插件注册进来的钩子
          this.activationHooks.forEach((hook) => {
            try {
              hook(context, instance);
            } catch (e) {
              // hook崩了不能影响核心流程
              MessageWriter.error(
                e,
                `[Virid Core] Activation hook failed: ${hook.name}`,
              );
            }
          });
        }
        return instance;
      });
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
