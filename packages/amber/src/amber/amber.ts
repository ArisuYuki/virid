/*
 * Copyright (c) 2026-present ShirahaYuki.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Amber
 */
import { viridApp } from "../app";
import { VIRID_METADATA } from "../decorators";
import { serialization, deserialization } from "./utils";

class AmberStore {
  private history = new Map<any, any[]>();
  // 记录每个组件“消失的历史”总数
  private baseVersions = new Map<any, number>();
  private maxStackSize = 100;

  public seal(compClass: any, initInstance?: any) {
    const instance = initInstance ?? viridApp.get(compClass);
    if (!instance) return;

    if (!this.history.has(compClass)) {
      this.history.set(compClass, []);
      this.baseVersions.set(compClass, 0);
    }

    const stack = this.history.get(compClass)!;
    const baseVersion = this.baseVersions.get(compClass)!;
    const currentLogicalVersion =
      Reflect.getMetadata(VIRID_METADATA.VERSION, compClass) || 0;
    // 处理撤销后的覆盖逻辑
    // 如果当前版本小于最新逻辑版本，说明在回退状态下产生了新修改
    const latestLogicalVersion = baseVersion + stack.length - 1;
    if (currentLogicalVersion < latestLogicalVersion) {
      const keepCount = currentLogicalVersion - baseVersion + 1;
      stack.splice(keepCount); // 切断未来的物理分支
    }

    // 存入新快照
    stack.push(serialization(instance));

    // 这里的逻辑很关键：处理溢出
    if (stack.length > this.maxStackSize) {
      stack.shift(); // 丢掉物理索引 0
      // 丢掉了一个旧版本，基准偏移量必须 +1
      this.baseVersions.set(compClass, baseVersion + 1);
    }

    // 更新元数据：逻辑版本 = 基准偏移 + 物理长度 - 1
    const newLogicalVersion =
      this.baseVersions.get(compClass)! + stack.length - 1;

    Reflect.defineMetadata(
      VIRID_METADATA.VERSION,
      newLogicalVersion,
      compClass,
    );
  }

  public seek(compClass: any, targetVersion: number): boolean {
    const stack = this.history.get(compClass);
    const baseVersion = this.baseVersions.get(compClass) || 0;

    if (!stack) return false;

    // 物理索引转换
    const physicalIndex = targetVersion - baseVersion;

    // 边界检查：如果要找的版本已经被 shift 掉了，或者超出了范围
    if (physicalIndex < 0 || physicalIndex >= stack.length) {
      return false;
    }

    const instance = viridApp.get(compClass);
    deserialization(instance, stack[physicalIndex]);

    // 更新元数据
    Reflect.defineMetadata(VIRID_METADATA.VERSION, targetVersion, compClass);
    return true;
  }
}

export const amberStore = new AmberStore();
