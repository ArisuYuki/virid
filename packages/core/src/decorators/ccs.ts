/*
 * Copyright (c) 2026-present ShirahaYuki.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Core
 */
import { viridApp } from "../app";
import { BaseMessage, MessageWriter } from "../core";
import { VIRID_METADATA } from "./constants";
import { injectable } from "inversify";
import { SystemContext, EventMessage, SingleMessage } from "../core/types";
import "reflect-metadata";
/**
 * @description: 系统装饰器
 * @param priority 优先级，数值越大越早执行
 */
export function System(priority: number = 0) {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const types = Reflect.getMetadata("design:paramtypes", target, key) || [];
    if (types.length === 0) {
      const error = new Error(
        `[Virid System] System Parameter Loss:\nUnable to recognize system parameters, please confirm if import "reflection-metadata" was introduced at the beginning!`,
      );
      MessageWriter.error(error);
      return;
    }
    // 检查是否有参数类型丢失
    if (types.some((t: any) => t === undefined)) {
      const error =
        new Error(`[Virid System] Parameter Metadata Loss in "${key}": 
  One or more parameters have 'undefined' types. 
  This usually happens when you forget to add a type annotation to a decorated parameter.
  Check parameter at index: ${types.indexOf(undefined)}`);

      MessageWriter.error(error);
      return;
    }
    const readerConfigs: { index: number; eventClass: any; single: boolean }[] =
      Reflect.getMetadata(VIRID_METADATA.MESSAGE, target, key) || [];
    //不允许有多个Configs,只能由一种Message触发
    if (readerConfigs.length > 1) {
      MessageWriter.warn(
        `[Virid System] Multiple Messages Are Not Allowed: ${key} has multiple @Message() decorators!`,
      );
      return;
    }
    const wrappedSystem = function (currentMessage: any) {
      const args = types.map((type: any, index: number) => {
        // 先看看这个参数是不是标记过的Event
        const config = readerConfigs.find((c: any) => c.index === index);
        if (config) {
          const { eventClass, single } = config;
          // 基础校验：判断当前投递的消息实例是否属于装饰器声明的类或其子类
          const sample = Array.isArray(currentMessage)
            ? currentMessage[0]
            : currentMessage;
          if (!(sample instanceof eventClass)) {
            // 如果类型不匹配，说明 Dispatcher 路由逻辑或元数据配置有问题
            MessageWriter.error(
              new Error(
                `[Virid System] Type Mismatch: Expected ${eventClass.name}, but received ${sample?.constructor.name}`,
              ),
            );
            return null;
          }
          // 处理 SingleMessage (合并且批处理类型)
          if (sample instanceof SingleMessage) {
            // 如果用户标记了 single: true，则只取最后一条（最新的一条）
            if (single) {
              return Array.isArray(currentMessage)
                ? currentMessage[currentMessage.length - 1]
                : currentMessage;
            }
            // 否则默认返回整个数组（批处理模式）
            return Array.isArray(currentMessage)
              ? currentMessage
              : [currentMessage];
          }

          // 处理 EventMessage (顺序单发类型)
          if (sample instanceof EventMessage) {
            // Event 消息本身就是单体投递的，直接返回
            // 即便用户传了 single: true 也是它本身
            return currentMessage;
          }

          // 回退处理（处理 BaseMessage 这种模糊基类）
          return currentMessage;
        }
        // 处理普通的依赖注入
        const param = viridApp.get(type);
        if (!param)
          MessageWriter.error(
            new Error(
              `[Virid System] Unknown Inject Data Types: ${type.name} is not registered in the container!`,
            ),
          );
        return param;
      });

      // 执行业务逻辑
      const result = originalMethod(...args);

      // 统一处理返回值：System 可以直接 return 一个消息来实现“链式反应”
      const handleResult = (res: any) => {
        if (!res) return;
        const messages = Array.isArray(res) ? res : [res];
        messages.forEach((m) => {
          if (m instanceof BaseMessage) {
            MessageWriter.write(m);
          }
        });
      };

      return result instanceof Promise
        ? result.then(handleResult)
        : handleResult(result);
    };
    // 给包装后的函数挂载上下文信息（供 Dispatcher 读取）
    const systemContext: SystemContext = {
      params: types,
      targetClass: target,
      methodName: key,
      originalMethod: originalMethod,
    };
    (wrappedSystem as any).systemContext = systemContext;
    // 修改方法定义
    descriptor.value = wrappedSystem;
    // 注册到调度中心：每个监听的消息类都要关联这个包装函数
    readerConfigs.forEach((config: any) => {
      viridApp.register(config.eventClass, wrappedSystem, priority);
    });
  };
}

/**
 * @description: 标记参数为 MessageReader 并锁定其消息类型
 */
export function Message<T extends BaseMessage>(
  eventClass: new (...args: any[]) => T,
  single = true,
) {
  return (target: any, key: string, index: number) => {
    const configs =
      Reflect.getMetadata(VIRID_METADATA.MESSAGE, target, key) || [];
    // 存储元数据：哪个参数索引，对应哪个消息类
    configs.push({ index, eventClass, single });
    Reflect.defineMetadata(VIRID_METADATA.MESSAGE, configs, target, key);
  };
}

/**
 * @description: 标识controller或者组件的方法是否是安全的，可被其他controller直接调用
 */
export function Safe() {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    // 标识这个方法是“只读安全”的
    // 只需要标记这个 key
    const safeMethods =
      Reflect.getMetadata(VIRID_METADATA.SAFE, target) || new Set<string>();
    safeMethods.add(key);
    // 存回到 prototype
    Reflect.defineMetadata(VIRID_METADATA.SAFE, safeMethods, target);
  };
}

/**
 * @description: 标记Controller身份
 */
export function Controller() {
  return (target: any) => {
    // 1. 依然要保持它可被依赖注入
    injectable()(target);
    // 2. 打上身份标签
    Reflect.defineMetadata(VIRID_METADATA.CONTROLLER, true, target);
  };
}
/**
 * @description: 标记Component身份
 */
export function Component() {
  return (target: any) => {
    injectable()(target);
    // 打上组件标签
    Reflect.defineMetadata(VIRID_METADATA.COMPONENT, true, target);
  };
}
