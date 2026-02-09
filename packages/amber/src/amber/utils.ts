/*
 * Copyright (c) 2026-present ShirahaYuki.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Amber
 */

export function serialization(instance: any): any {
  if (!instance || typeof instance !== "object") return instance;

  // 处理数组
  if (Array.isArray(instance)) {
    return instance.map((item) => serialization(item));
  }

  const snapshot: any = {};
  // 仅处理自有属性，避开原型链
  const keys = Object.keys(instance);

  for (const key of keys) {
    if (key.startsWith("_")) continue; // 过滤私有变量

    const value = instance[key];
    const type = typeof value;

    if (type === "function") continue; // 过滤方法

    // 递归处理嵌套对象
    snapshot[key] =
      type === "object" && value !== null ? serialization(value) : value;
  }
  return snapshot;
}
export function deserialization(instance: any, data: any) {
  if (!instance || !data) return;

  // 1. 清理实例上在 data 中不存在的属性（保持数据同步）
  Object.keys(instance).forEach((key) => {
    if (
      !key.startsWith("_") &&
      typeof instance[key] !== "function" &&
      !(key in data)
    ) {
      delete instance[key];
    }
  });

  // 2. 深度灌注数据
  Object.keys(data).forEach((key) => {
    const newValue = data[key];
    const oldValue = instance[key];

    if (
      newValue !== null &&
      typeof newValue === "object" &&
      !Array.isArray(newValue)
    ) {
      // 如果旧值也是对象，递归灌注，不要破坏 Proxy 引用
      if (oldValue && typeof oldValue === "object") {
        deserialization(oldValue, newValue);
      } else {
        instance[key] = newValue;
      }
    } else {
      // 基础类型或数组，直接覆盖
      instance[key] = newValue;
    }
  });
}
