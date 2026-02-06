# 🌌 virid

[中文说明](file://.README.zh.md)
**The Sovereign Logic Engine & Reactive Projection System**

**Deconstructing UI Sovereignty, Reshaping Logic Boundaries.**

`virid` is a lightweight, message-driven engine inspired by **Rust Bevy ECS** and **NestJS**. It is designed to liberate business logic from being a "subservient" part of UI frameworks, building a deterministic, testable, and cross-platform core.

---

### 🧠 Core Architecture: Logic Sovereignty

In the world of `virid`, business logic is the "first-class citizen," while the UI is merely a **"temporary projection"** of that logic. This architecture is known as **CCS**.

- **Logic Autonomy**: Core business runs within `@virid/core`, completely independent of DOM/BOM APIs, supporting cross-platform reuse.
- **Physical Isolation**: UI frameworks (like Vue) are downgraded to pure state projectors, losing the authority to modify state directly.
- **Causality-Driven**: All state changes must be requested via a `Message` and adjudicated by a `System`, creating a closed-loop chain of causality.

---

### 📦 Modules

| **Module**        | **Role**                  | **Key Features**                                                                       |
| ----------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| **`@virid/core`** | **The Brain (Logic Hub)** | Deterministic Tick mechanism, double-buffered message pools, and Dependency Injection. |
| **`@virid/vue`**  | **The Neuron (Adapter)**  | Reactive Projection (Deep Shield), Dependency Tethering, and Lifecycle bridging.       |

---

### 🎯 Why virid?

- **High Consistency**: Based on a game-grade scheduling engine, avoiding logic jitter in complex UI interactions.
- **Zero-Mock Testing**: Business logic can be 100% covered by unit tests in a pure JS environment via "Message-in, State-out" assertions.
- **Secure Data Flow**: Enforces unidirectional data flow through a read-only projection shield, making logic changes 100% auditable.

---

### 🔗 Deep Dive

For implementation details and quick-start examples, please refer to the sub-package documentation:

- 👉 **[@virid/core](file://.packages/core/README.md)** – Learn about the CCS architecture, message scheduling, and state management.
- 👉 **[@virid/vue](file://.packages/vue/README.md)** – Learn how to project logic onto the Vue view layer.
