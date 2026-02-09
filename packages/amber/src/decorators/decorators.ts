/*
 * Copyright (c) 2026-present ShirahaYuki.
 * Licensed under the Apache License, Version 2.0.
 * Project: Virid Amber
 */
import { VIRID_METADATA } from "./constants";

/**
 * @description: 标记Backup身份
 */
export function Backup() {
  return (target: any) => {
    // 打上需要备份的标签
    Reflect.defineMetadata(VIRID_METADATA.BACKUP, true, target);
    // 打上版本号
    Reflect.defineMetadata(VIRID_METADATA.VERSION, 0, target);
  };
}
