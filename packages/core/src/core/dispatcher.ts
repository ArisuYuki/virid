/*
 * Copyright (c) 2026-present ShirahaYuki.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Core
 */
/**
 * @description: 事件调度器
 */
import { MessageWriter } from "./io";
import {
  SingleMessage,
  EventMessage,
  BaseMessage,
  Hook,
  HookContext,
  SystemTask,
  MessageIdentifier,
  SystemContext,
} from "./types";
import { EventHub } from "./eventHub";

export class ExecutionTask {
  constructor(
    public fn: (...args: any[]) => any,
    public priority: number,
    public message: any, // 运行时可能是 T 或 T[]
    public hookContext: HookContext,
  ) {}

  private triggerHooks(
    hooks: Array<{ type: MessageIdentifier<any>; handler: Hook<any> }>,
  ) {
    const sample = Array.isArray(this.message) ? this.message[0] : this.message;
    if (!sample) return;

    for (const hook of hooks) {
      if (sample instanceof hook.type) {
        try {
          const result = hook.handler(this.message, this.hookContext);
          if (result instanceof Promise) {
            result.catch((e) =>
              MessageWriter.error(
                e,
                `[Virid Hook] Async Hook Error:\n${hook.type.name}`,
              ),
            );
          }
        } catch (e) {
          MessageWriter.error(
            e as Error,
            `[Virid Hook] Hook Execute Failed:\nTriggered by: ${sample.constructor.name}\n Registered type: ${hook.type.name}`,
          );
        }
      }
    }
  }

  public execute(
    beforeExecuteHooks: Array<{
      type: MessageIdentifier<any>;
      handler: Hook<any>;
    }>,
    afterExecuteHooks: Array<{
      type: MessageIdentifier<any>;
      handler: Hook<any>;
    }>,
  ): any {
    //执行前置钩子
    this.triggerHooks(beforeExecuteHooks);
    const runAfter = () => this.triggerHooks(afterExecuteHooks);

    try {
      const result = this.fn(this.message);

      if (result instanceof Promise) {
        // 异步模式利用 .finally 确保钩子执行
        return result.finally(() => runAfter());
      }
      // 如果是同步，直接后置钩子执行并返回
      runAfter();
      return result;
    } catch (e) {
      // 如果报错了，也执行后置钩子
      runAfter();
      throw e; // 抛给 Dispatcher 的 try-catch 处理
    }
  }
}

export class Dispatcher {
  private dirtySignalTypes = new Set<any>();
  private eventQueue: EventMessage[] = [];
  private isRunning = false;
  private tickCount = 0;
  private eventHub: EventHub;
  // 使用 MessageIdentifier 允许存入 BaseMessage, SingleMessage 等抽象类
  private beforeExecuteHooks: Array<{
    type: MessageIdentifier<any>;
    handler: Hook<any>;
  }> = [];
  private afterExecuteHooks: Array<{
    type: MessageIdentifier<any>;
    handler: Hook<any>;
  }> = [];
  constructor(eventHub: EventHub) {
    this.eventHub = eventHub;
  }
  // 添加执行钩子
  public addBefore<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: Hook<T>,
  ) {
    this.beforeExecuteHooks.push({ type, handler: hook as Hook<any> });
  }
  public addAfter<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: Hook<T>,
  ) {
    this.afterExecuteHooks.push({ type, handler: hook as Hook<any> });
  }
  private cleanupHook: (types: Set<any>) => void = () => {};

  public setCleanupHook(hook: (types: Set<any>) => void) {
    this.cleanupHook = hook;
  }

  /**
   * 标记脏数据：根据基类判断进入哪个池子
   */
  public markDirty(message: any) {
    if (message instanceof EventMessage) {
      // EventMessage：顺序追加，不合并
      this.eventQueue.push(message);
    } else if (message instanceof SingleMessage) {
      // SingleMessage：按类型合并
      this.dirtySignalTypes.add(message.constructor);
    }
  }

  public tick(interestMap: Map<any, SystemTask[]>) {
    if (
      this.isRunning ||
      (this.dirtySignalTypes.size === 0 && this.eventQueue.length === 0)
    )
      return;

    // 死循环防御
    if (this.tickCount > 100) {
      this.tickCount = 0;
      // 立即清空队列
      this.dirtySignalTypes.clear();
      this.eventQueue = [];
      this.eventHub.reset();
      MessageWriter.error(
        new Error("[Virid Dispatcher] Deadlock: Recursive loop detected."),
      );
      return;
    }

    this.isRunning = true;
    this.tickCount++;

    queueMicrotask(() => {
      try {
        // 交换双缓冲区，锁定当前 Tick 数据
        this.eventHub.flip();
        // 拍下当前待处理任务的快照
        const signalSnapshot = new Set(this.dirtySignalTypes);
        const eventSnapshot = [...this.eventQueue];
        // 立即清空队列，允许 System 在执行时产生新消息进入 staging
        this.dirtySignalTypes.clear();
        this.eventQueue = [];

        const tasks: ExecutionTask[] = [];

        // 收集 EVENT 任务 ,从前往后每一条消息执行所有关联 System
        for (const msg of eventSnapshot) {
          const systems = interestMap.get(msg.constructor) || [];
          systems.forEach((s) => {
            //拿到Context
            tasks.push(
              new ExecutionTask(s.fn, s.priority, msg, {
                context: (s.fn as any).systemContext as SystemContext,
                payload: {},
              }),
            );
          });
        }
        // 收集 SIGNAL 任务 (每个 System 针对该类型只跑一次)
        // 对 System 函数引用进行去重，防止同一个类型触发多次重复的 SIGNAL 处理
        const signalFnSet = new Set<any>();
        for (const type of signalSnapshot) {
          const systems = interestMap.get(type) || [];
          systems.forEach((s) => {
            if (!signalFnSet.has(s.fn)) {
              tasks.push(
                new ExecutionTask(
                  s.fn,
                  s.priority,
                  this.eventHub.peekSignal(type),
                  {
                    context: (s.fn as any).systemContext as SystemContext,
                    payload: {},
                  },
                ),
              );
              signalFnSet.add(s.fn);
            }
          });
        }
        // 无论消息类型，按照 System 定义的优先级排序
        tasks.sort((a, b) => b.priority - a.priority);
        // 执行任务流
        for (const task of tasks) {
          try {
            const result = task.execute(
              this.beforeExecuteHooks,
              this.afterExecuteHooks,
            );
            // 如果是 Promise，只管注册一个 catch 防止崩溃，不 await 它
            if (result instanceof Promise) {
              result.catch((e) =>
                MessageWriter.error(
                  e,
                  `[Virid Dispatcher] Async Error:\ntargetClass:${task.hookContext.context.targetClass}\nmethodName:${task.hookContext.context.methodName}
                `,
                ),
              );
            }
          } catch (e) {
            MessageWriter.error(
              e as Error,
              `[Virid Dispatcher] Sync Error:\ntargetClass:${task.hookContext.context.targetClass}\nmethodName:${task.hookContext.context.methodName}
                `,
            );
          }
        }
        // 立即进行清理
        const processedTypes = new Set(signalSnapshot);
        eventSnapshot.forEach((m) => processedTypes.add(m.constructor));
        this.cleanupHook(processedTypes);
        // 释放锁并尝试下一轮执行
        this.isRunning = false;
        if (this.dirtySignalTypes.size > 0 || this.eventQueue.length > 0) {
          // 此时 tick 立即进入下一轮，由于不需要异步返回的结果，直接不管就行
          this.tick(interestMap);
        } else {
          this.tickCount = 0;
        }
      } catch (e) {
        MessageWriter.error(e as Error, "[Virid Dispatcher] Unhandled Error");
      }
    });
  }
}
