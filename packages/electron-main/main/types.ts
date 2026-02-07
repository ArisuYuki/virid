/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 21:28:16
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 20:21:30
 * @FilePath: /virid/packages/electron-main/main/types.ts
 * @Description: 类型定义
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { EventMessage } from "@virid/core";
import { type App } from "electron";
export { type CCSSystemContext } from "@virid/core";
/**
 * RenderMessage: 由渲染进程发起，目标是主进程或其他窗口
 */
export abstract class RenderResponseMessage extends EventMessage {
  /** 我来自哪？
   */
  public static __virid_source: string;

  /** 我的目的地是哪儿？
   * 'main': 发给主进程处理
   * 'all': 广播给所有窗口（经过主进程中转）
   * string: 指定某个窗口的 ID (windowId)
   */
  public readonly __virid_target: "main" | "all" | string = "main";

  /**
   * 我应该在目的地转变成什么消息？
   */
  public readonly __virid_messageType: string;
  public readonly senderWindow: Electron.BrowserWindow;
}

/**
 * MainMessage: 由主进程发起，发往渲染进程
 */
export abstract class MainRequestMessage extends EventMessage {
  /** 我来自哪？
   */
  public static __virid_source = "main";

  /** 我的目的地是哪儿？
   * 'main': 发给主进程处理
   * 'all': 广播给所有窗口（经过主进程中转）
   * string: 指定某个窗口的 ID (windowId)
   */
  public readonly __virid_target: "main" | "all" | string = "main";

  /**
   * 我应该在目的地转变成什么消息？
   */
  public readonly __virid_messageType: string;

  /** 触发该消息的窗口 (仅在主进程有效) */
  public sender?: Electron.WebContents;
}

export interface PluginOption {
  /**
   * 窗口的 ID
   */
  electronApp: App;
  registerMap: Map<string, any>;
}
