/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-05 21:53:13
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-05 22:08:47
 * @FilePath: /virid-project/packages/vue/vue.ts
 * @Description:存储一个代理壳子
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
export interface IviridApp {
  register(
    eventClass: any,
    systemFn: (...args: any[]) => any,
    priority: number,
  ): () => void;
  get(identifier: any): any;
}

let activeApp: IviridApp | null = null;

/**
 * 激活真正的 App 实例
 */
export function activateApp(instance: IviridApp) {
  activeApp = instance;
}

/**
 * viridApp 代理
 */
export const viridApp: IviridApp = new Proxy({} as IviridApp, {
  get(_, prop: keyof IviridApp) {
    return (...args: any[]) => {
      // 检查实例是否存在
      if (!activeApp) {
        console.warn(
          `[Virid Vue] App method "${String(prop)}" called before initialization.`,
        );

        // 针对 register 这种有返回值的函数做特殊处理
        if (prop === "register") {
          return () => {
            console.warn(
              "[Virid Vue] Cleanup ignored: source listener was never registered.",
            );
          };
        }
        return undefined;
      }

      // 正常转发调用
      // 使用 Reflect 确保 this 指向正确，或者直接从 activeApp 调用
      const targetMethod = activeApp[prop];
      if (typeof targetMethod === "function") {
        // @ts-ignore
        return targetMethod.apply(activeApp, args);
      }
    };
  },
});
