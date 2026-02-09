import "reflect-metadata";
import {
  createVirid,
  Component,
  System,
  Message,
  EventMessage,
} from "@virid/core";
import { AmberPlugin, amberStore, Backup, VIRID_METADATA } from "@virid/amber";

// --- 1. 复杂状态定义 ---

@Component()
@Backup()
class StatsComponent {
  public level = 1;
  public attrs = { strength: 10, agility: 10 }; // 嵌套对象测试深拷贝
}

@Component()
@Backup()
class InventoryComponent {
  public slots: string[] = ["Rusty Sword"]; // 数组测试
}

class UpgradeMessage extends EventMessage {}

class ChaosSystem {
  @System()
  static onUpgrade(
    @Message(UpgradeMessage) _message: UpgradeMessage,
    stats: StatsComponent,
    inv: InventoryComponent,
  ) {
    stats.level += 1;
    stats.attrs.strength += 5; // 修改深层属性
    inv.slots.push(`Epic Shield +${stats.level}`); // 修改数组
  }
}

async function runChaosTest() {
  console.log("🔥 启动暴力混沌测试...");
  const app = createVirid();
  app.use(AmberPlugin, {});
  app.bindComponent(StatsComponent);
  app.bindComponent(InventoryComponent);

  const stats = app.get(StatsComponent);
  const inv = app.get(InventoryComponent);

  // --- 步骤 1: 验证深拷贝隔离性 ---
  console.log("\n[Step 1] 验证深拷贝隔离...");
  UpgradeMessage.send(); // 触发 V1
  await new Promise((r) => queueMicrotask(r));

  const v1_strength = stats.attrs.strength; // 15

  UpgradeMessage.send(); // 触发 V2
  await new Promise((r) => queueMicrotask(r));
  stats.attrs.strength = 999; // 暴力手动篡改 V2 的引用数据

  amberStore.seek(StatsComponent, 1);
  if (stats.attrs.strength === 15) {
    console.log("✅ 深拷贝隔离成功: 修改 V2 引用不影响 V1 快照");
  } else {
    console.error(
      "❌ 深拷贝失效: V1 的数据被 V2 污染了！值变成了:",
      stats.attrs.strength,
    );
  }

  // --- 步骤 2: 极限滑动窗口 & 内存压力 ---
  console.log("\n[Step 2] 极限滑动窗口压力测试 (1000次 Seal)...");
  // 假设 maxStackSize 为 100
  for (let i = 0; i < 1000; i++) {
    stats.level++;
    amberStore.seal(StatsComponent);
  }
  const currentV = Reflect.getMetadata(VIRID_METADATA.VERSION, StatsComponent);
  console.log(`当前逻辑版本已达: ${currentV}`);

  const canSeekOld = amberStore.seek(StatsComponent, currentV - 150);
  console.log(
    `尝试回滚到 150 个版本前 (预期失败): ${!canSeekOld ? "✅" : "❌"}`,
  );

  const canSeekBoundary = amberStore.seek(StatsComponent, currentV - 50);
  console.log(
    `尝试回滚到窗口内版本 (预期成功): ${canSeekBoundary ? "✅" : "❌"}`,
  );

  console.log("\n[Step 3] 跨组件同步回滚测试...");
  // 此时 Stats 和 Inventory 的版本可能不同步了，因为上面的循环只 seal 了 Stats
  const vStats = Reflect.getMetadata(VIRID_METADATA.VERSION, StatsComponent);
  const vInv = Reflect.getMetadata(VIRID_METADATA.VERSION, InventoryComponent);
  console.log(`Stats Version: ${vStats}, Inventory Version: ${vInv}`);

  // 暴力同步：同时修改两者
  UpgradeMessage.send();
  await new Promise((r) => queueMicrotask(r));

  const syncV_Stats = Reflect.getMetadata(
    VIRID_METADATA.VERSION,
    StatsComponent,
  );
  const syncV_Inv = Reflect.getMetadata(
    VIRID_METADATA.VERSION,
    InventoryComponent,
  );
  console.log(`同步后 - Stats V: ${syncV_Stats}, Inv V: ${syncV_Inv}`);

  console.log("\n✨ 暴力测试结束。");
}

runChaosTest();
