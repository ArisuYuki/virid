/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 20:08:55
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 17:04:22
 * @FilePath: /virid/packages/electron-bridge/index.ts
 * @Description: 安装virid 的electron-bridge
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
const VIRID_CHANNEL = "VIRID_INTERNAL_BUS";

export function injectViridBridge() {
  contextBridge.exposeInMainWorld("__VIRID_BRIDGE__", {
    /**
     * 发送原始 Packet 到主进程
     */
    post: (packet: any) => {
      ipcRenderer.send(VIRID_CHANNEL, packet);
    },

    /**
     * 订阅主进程发来的原始数据
     */
    subscribe: (callback: (packet: any) => void) => {
      const internalHandler = (_event: IpcRendererEvent, packet: any) => {
        callback(packet);
      };
      ipcRenderer.on(VIRID_CHANNEL, internalHandler);
      return () => {
        ipcRenderer.removeListener(VIRID_CHANNEL, internalHandler);
      };
    },
  });
}
