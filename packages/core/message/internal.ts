/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-03 09:34:30
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-05 22:15:36
 * @FilePath: /starry-project/packages/core/message/internal.ts
 * @Description:消息系统内部维护的一些状态
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { Dispatcher } from "./dispatcher";
import { EventHub } from "./eventHub";
import { BaseMessage, Hook, MessageIdentifier, Middleware } from "./types";
import { MessageRegistry } from "./registry"; // 假设 Registry 存储了全局 Map
import { MessageWriter, activatInstance } from "./io";

export class MessageInternal {
  readonly eventHub = new EventHub();
  readonly dispatcher = new Dispatcher(this.eventHub);
  readonly registry = new MessageRegistry();
  readonly middlewares: Middleware[] = [];

  constructor() {
    // 注入清理钩子
    this.dispatcher.setCleanupHook((processedTypes) => {
      // 清理 SIGNAL 类型的 activePool (按类型删)
      this.eventHub.clearSignals(processedTypes);
      // 清理已执行完的 EVENT 队列
      this.eventHub.clearEvents();
    });
    // 修改
    activatInstance(this);
  }

  useMiddleware(mw: Middleware) {
    this.middlewares.push(mw);
  }
  onBeforeExecute<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: Hook<T>,
  ) {
    this.dispatcher.addBefore(type, hook);
  }
  onAfterExecute<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: Hook<T>,
  ) {
    this.dispatcher.addAfter(type, hook);
  }

  /**
   * 消息进入系统的唯一入口
   */
  dispatch(message: BaseMessage) {
    //先看看这个消息的处理函数在this.interestMap里有吗？没有就报错
    if (!this.registry.interestMap.has(message.constructor)) {
      MessageWriter.error(
        new Error(
          `[Starry Dispatch] No handler for message:\n ${message.constructor.name}`,
        ),
      );
      return;
    }
    // 运行中间件管道
    this.pipeline(message, () => {
      // 存入 Hub (根据 Single/Event 策略存入不同池子)
      this.eventHub.push(message);

      // 标记 Dispatcher 为脏，并尝试触发 Tick
      this.dispatcher.markDirty(message);
      // 启动调度循环
      this.dispatcher.tick(this.registry.interestMap);
    });
  }

  private pipeline(message: BaseMessage, finalAction: () => void) {
    let index = 0;
    const next = () => {
      if (index < this.middlewares.length) {
        this.middlewares[index++](message, next);
      } else {
        finalAction();
      }
    };
    next();
  }
}
