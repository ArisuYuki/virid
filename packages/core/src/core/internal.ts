/*
 * Copyright (c) 2026-present ShirahaYuki.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Core
 */
import { Dispatcher } from "./dispatcher";
import { EventHub } from "./eventHub";
import {
  BaseMessage,
  ExecuteHook,
  TickHook,
  MessageIdentifier,
  Middleware,
} from "./types";
import { MessageRegistry } from "./registry"; // 假设 Registry 存储了全局 Map
import { MessageWriter, activatInstance } from "./io";

export class MessageInternal {
  readonly eventHub = new EventHub();
  readonly dispatcher = new Dispatcher(this.eventHub);
  readonly registry = new MessageRegistry();
  readonly middlewares: Middleware[] = [];

  constructor() {
    // 修改
    activatInstance(this);
  }

  useMiddleware(mw: Middleware) {
    this.middlewares.push(mw);
  }
  onBeforeExecute<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: ExecuteHook<T>,
  ) {
    this.dispatcher.addBeforeExecute(type, hook);
  }
  onAfterExecute<T extends BaseMessage>(
    type: MessageIdentifier<T>,
    hook: ExecuteHook<T>,
  ) {
    this.dispatcher.addAfterExecute(type, hook);
  }
  onBeforeTick(hook: TickHook) {
    this.dispatcher.addBeforeTick(hook);
  }
  onAfterTick(hook: TickHook) {
    this.dispatcher.addAfterTick(hook);
  }

  /**
   * 消息进入系统的唯一入口
   */
  dispatch(message: BaseMessage) {
    // 不是继承自BaseMessage就报错
    if (!(message instanceof BaseMessage)) {
      MessageWriter.error(
        new Error(
          `[Virid Dispatch] Type Error: Message must be an instance of BaseMessage,message:${message}`,
        ),
      );
      return;
    }
    // 运行中间件管道
    this.pipeline(message, () => {
      //看看这个消息的处理函数在this.interestMap里有吗？没有就报错
      if (!this.registry.interestMap.has(message.constructor)) {
        MessageWriter.error(
          new Error(
            `[Virid Dispatch] No handler for message: ${message.constructor.name}`,
          ),
        );
        return;
      }
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
