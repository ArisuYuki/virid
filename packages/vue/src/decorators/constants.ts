/*
 * @Author: ShirahaYuki  shirhayuki2002@gmail.com
 * @Date: 2026-02-01 15:31:35
 * @LastEditors: ShirahaYuki  shirhayuki2002@gmail.com
 * @LastEditTime: 2026-02-07 12:41:26
 * @FilePath: /virid/packages/vue/decorators/constants.ts
 * @Description:字符串类型常量
 *
 * Copyright (c) 2026 by ShirahaYuki, All Rights Reserved.
 */
/**
 * CCS 核心元数据键名
 */
export const VIRID_METADATA = {
  COMPONENT: "virid:component",
  CONTROLLER: "virid:controller",
  PROJECT: "virid:project_metadata",
  WATCH: "virid:watch_metadata",
  MESSAGE: "virid:message",
  RESPONSIVE: "virid:responsive",
  LIFE_CRICLE: "virid:life_cricle",
  USE_HOOKS: "virid:use_hooks",
  CONTROLLER_LISTENERS: "virid:controller_listeners",
  INHERIT: "virid:inherit",
  ATTR: "virid:attr",
  SAFE: "virid:safe",
} as const;
