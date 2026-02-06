/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 19:45:29
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-06 11:26:53
 * @FilePath: /starry-project/packages/core/app.ts
 * @Description:app实例
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */

import {
  BindInWhenOnFluentSyntax,
  BindWhenOnFluentSyntax,
  Container,
} from "inversify";
import { MessageInternal } from "./message/internal";
import {
  AtomicModifyMessage,
  BaseMessage,
  CCSSystemContext,
  ErrorMessage,
  Hook,
  MessageIdentifier,
  MessageWriter,
  Middleware,
  WarnMessage,
} from "./message";
import { StarryPlugin } from "./types";

// 维护一个已安装插件的列表，防止重复安装
const installedPlugins = new Set<string>();
/**
 * 创建 Starry 核心实例
 */

export class StarryApp {
  public container: Container = new Container();
  private messageInternal: MessageInternal = new MessageInternal();
  private bindBase<T>(identifier: new (...args: any[]) => T) {
    return this.container.bind<T>(identifier).toSelf();
  }
  public get(identifier: any) {
    return this.container.get(identifier);
  }

  bindController<T>(
    identifier: new (...args: any[]) => T,
  ): BindInWhenOnFluentSyntax<T> {
    return this.bindBase(identifier);
  }
  bindComponent<T>(
    identifier: new (...args: any[]) => T,
  ): BindWhenOnFluentSyntax<T> {
    return this.bindBase(identifier).inSingletonScope();
  }
  useMiddleware(mw: Middleware) {
    this.messageInternal.useMiddleware(mw);
  }
  onBeforeExecute<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: Hook<T>,
  ) {
    this.messageInternal.onBeforeExecute(type, hook);
  }
  onAfterExecute<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: Hook<T>,
  ) {
    this.messageInternal.onAfterExecute(type, hook);
  }
  register(
    eventClass: any,
    systemFn: (...args: any[]) => any,
    priority: number = 0,
  ): () => void {
    return this.messageInternal.registry.register(
      eventClass,
      systemFn,
      priority,
    );
  }
  use(plugin: StarryPlugin, options: any) {
    if (installedPlugins.has(plugin.name)) {
      MessageWriter.warn(
        `[Starry Plugin] Plugin ${plugin.name} has already been installed.`,
      );
      return this;
    }
    try {
      plugin.install(this, options);
      installedPlugins.add(plugin.name);
    } catch (e) {
      MessageWriter.error(e as Error, `[Starry Plugin] ${plugin.name}`);
    }
    return this;
  }
}

export const starryApp = new StarryApp();

//---------------------------------------------注册几个默认的处理函数---------------------------------------

/**
 * 助手函数：为全局处理器包装上下文
 */
function withContext(
  params: any,
  fn: (...args: any[]) => any,
  methodName: string,
) {
  const context: CCSSystemContext = {
    params: params, // 参数类型
    targetClass: Object, // 指向全局 Object 或特定标记类
    methodName: methodName,
    originalMethod: fn,
  };
  (fn as any).ccsContext = context;
  return fn;
}

/**
 * 简单的色彩辅助函数 (零依赖)
 */
const clr = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

/**
 * 注册全局默认错误处理系统
 */
const globalErrorHandler = (err: ErrorMessage) => {
  const header = `${clr.red}${clr.bold} ✖ [Starry Error] ${clr.reset}`;
  const context = `${clr.magenta}${err.context}${clr.reset}`;

  console.error(
    `${header}${clr.gray}Global Error Caught:${clr.reset}\n` +
      `  ${clr.red}Context:${clr.reset} ${context}\n` +
      `  ${clr.red}Details:${clr.reset}`,
    err.error || "Unknown Error",
  );
};

starryApp.register(
  ErrorMessage,
  withContext(ErrorMessage, globalErrorHandler, "GlobalErrorHandler"),
  -999,
);

/**
 * 注册全局默认警告处理系统
 */
const globalWarnHandler = (warn: WarnMessage) => {
  const header = `${clr.yellow}${clr.bold} ⚠ [Starry Warn] ${clr.reset}`;
  const context = `${clr.cyan}${warn.context}${clr.reset}`;

  console.warn(
    `${header}${clr.gray}Global Warn Caught:${clr.reset}\n` +
      `  ${clr.yellow}Context:${clr.reset} ${context}`,
  );
};

starryApp.register(
  WarnMessage,
  withContext(WarnMessage, globalWarnHandler, "GlobalWarnHandler"),
  -999,
);

/**
 * 注册全局原子修改处理器
 * 它是整个架构中唯一允许直接操作 raw 数据的“合法特权区”
 */
const atomicModifyHandler = (modifications: AtomicModifyMessage<any>) => {
  // 从 Registry 拿到未经 Proxy 劫持的原始对象 (Raw)
  const rawComponent = starryApp.container.get(modifications.ComponentClass);

  if (!rawComponent) {
    console.error(
      `[Starry Modify] Component Not Found:\n Component ${modifications.ComponentClass.name} not found in Registry.`,
    );
    return;
  }
  // 执行修改逻辑
  try {
    modifications.recipe(rawComponent);
    // 记录显式的审计日志
    MessageWriter.warn(
      `[Starry Modify] Successfully:\nModify on ${modifications.ComponentClass.name}\nlabel: ${modifications.label}`,
    );
  } catch (e) {
    MessageWriter.error(
      e as Error,
      `[Starry Error] Modify Failed:\n${modifications.label}`,
    );
  }
};

starryApp.register(
  AtomicModifyMessage,
  withContext(
    AtomicModifyMessage<any>,
    atomicModifyHandler,
    "GlobalAtomicModifier",
  ),
  1000, // 修改器优先级通常极高，确保状态第一时间更新
);
