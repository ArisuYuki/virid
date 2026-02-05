/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-01 15:31:35
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-05 20:28:19
 * @FilePath: /starry-project/packages/vue/constants.ts
 * @Description:字符串类型常量
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
/**
 * CCS 核心元数据键名
 */
export const STARRY_METADATA = {
  COMPONENT: "starry:component",
  CONTROLLER: "starry:controller",
  PROJECT: "starry:project_metadata",
  WATCH: "starry:watch_metadata",
  MESSAGE: "starry:message",
  RESPONSIVE: "starry:responsive",
  LIFE_CRICLE: "starry:life_cricle",
  USE_HOOKS: "starry:use_hooks",
  CONTROLLER_LISTENERS: "starry:controller_listeners",
  INHERIT: "starry:inherit",
  ATTR: "starry:attr",
} as const;
