/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 21:28:16
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-08 14:41:00
 * @FilePath: /virid/packages/electron-main/src/main/types.ts
 * @Description: 类型定义
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { EventMessage } from "@virid/core";
import { type App } from "electron";
export { type CCSSystemContext } from "@virid/core";
/**
 * description: 来自渲染进程的消息
 */
export abstract class FromRenderMessage extends EventMessage {
  //我来自哪？
  public __virid_source: string = "unknow";

  /** 我的目的地是哪儿？
   * 'main': 发给主进程处理
   * 'all': 广播给所有窗口（经过主进程中转）
   * string: 指定某个窗口的 ID (windowId)
   */
  public __virid_target: string = "unknow";

  //我应该在目的地转变成什么消息？
  public __virid_messageType: string = "unknow";
  public senderWindow: Electron.BrowserWindow = null as any;
}

/**
 * description: 要发送给渲染进程的消息
 */
export abstract class ToRenderMessage extends EventMessage {
  // 我来自哪？
  public static __virid_source = "main";
  /** 我的目的地是哪儿？
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
  electronApp: App;
  messageMap:
    | Record<string, new (...args: any[]) => FromRenderMessage>
    | Map<string, new (...args: any[]) => FromRenderMessage>;
}
