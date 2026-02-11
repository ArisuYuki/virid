/*
 * Copyright (c) 2026-present Ailrid.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Core
 */
import { handleResult } from "./ccs";
import { VIRID_METADATA } from "./constants";

/**
 * @Observer 递归处理依赖树中的属性监听
 * 只有标记了 @Observer 的属性会被劫持，但会递归扫描子对象以确保嵌套监听生效
 */
export function bindObservers(instance: any) {
  // 基础检查与防止死循环
  if (!instance || typeof instance !== "object") return;

  // 检查是否处理过
  if (
    Object.prototype.hasOwnProperty.call(
      instance,
      "__virid_observer_processed__",
    )
  ) {
    return;
  }

  // 标记已处理（使用不可枚举属性，保持对象整洁）
  Object.defineProperty(instance, "__virid_observer_processed__", {
    value: true,
    enumerable: false,
    configurable: true,
  });

  // 劫持当前层级打过标记的属性
  const observerConfigs: any[] =
    Reflect.getMetadata(VIRID_METADATA.OBSERVER, instance.constructor) || [];

  observerConfigs.forEach(({ propertyKey, callback }) => {
    // 获取当前描述符，防止重复劫持
    const descriptor = Object.getOwnPropertyDescriptor(instance, propertyKey);
    if (descriptor && (descriptor.get || descriptor.set)) return;

    let internalValue = instance[propertyKey];

    Object.defineProperty(instance, propertyKey, {
      get: () => internalValue,
      set: (newVal: any) => {
        const oldVal = internalValue;
        if (newVal === oldVal) return; // 脏检查

        internalValue = newVal;

        // 【关键点】如果新赋的值是对象，需要递归处理其内部可能存在的 Observer
        if (newVal && typeof newVal === "object") {
          bindObservers(newVal);
        }

        // 执行回调
        const result = callback.call(instance, oldVal, newVal);

        handleResult(result);
      },
      enumerable: true,
      configurable: true,
    });

    // 初始扫描：如果当前属性的初始值就是对象，递归进去
    if (internalValue && typeof internalValue === "object") {
      bindObservers(internalValue);
    }
  });

  // 扫描所有属性，处理那些没被劫持但可能是子组件的对象
  Reflect.ownKeys(instance).forEach((key) => {
    if (key === "__virid_observer_processed__") return;

    // 避开上面已经定义好的 getter，防止触发逻辑
    const desc = Object.getOwnPropertyDescriptor(instance, key);
    if (desc && desc.get) return;

    const val = instance[key];
    if (val && typeof val === "object") {
      bindObservers(val);
    }
  });
}
