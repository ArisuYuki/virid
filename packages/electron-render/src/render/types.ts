/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 21:28:16
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-08 14:44:11
 * @FilePath: /virid/packages/electron-render/src/render/types.ts
 * @Description: 类型定义
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { EventMessage } from "@virid/core";
export { type CCSSystemContext } from "@virid/core";
/**
 * RenderMessage: 由主进程发来的消息
 */
export abstract class FromMainMessage extends EventMessage {
  /** 我来自哪？
   */
  public __virid_source: string = "unknow";
  /** 我的目的地是哪儿？
   * 'main': 发给主进程处理
   * 'all': 广播给所有窗口（经过主进程中转）
   * string: 指定某个窗口的 ID (windowId)
   */
  public __virid_target: string = "unknow";
  /**
   * 我应该在目的地转变成什么消息？
   */
  public __virid_messageType: string = "unknow";
}

/**
 * RenderMessage: 由渲染进程发起，目标是主进程或其他窗口
 */
export abstract class ToMainMessage extends EventMessage {
  /** 我来自哪？
   */
  public static __virid_source: string;

  /** 我的目的地是哪儿？
   * 'main': 发给主进程处理
   * 'all': 广播给所有窗口（经过主进程中转）
   * string: 指定某个窗口的 ID (windowId)
   */
  public __virid_target: string = "unknow";

  /**
   * 我应该在目的地转变成什么消息？
   */
  public __virid_messageType: string = "unknow";
}

export interface PluginOption {
  /**
   * 窗口的 ID
   */
  windowId: string;
  messageMap:
    | Record<string, new (...args: any[]) => FromMainMessage>
    | Map<string, new (...args: any[]) => FromMainMessage>;
}
