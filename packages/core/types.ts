import { ViridApp } from "./app";

export interface ViridPlugin {
  name: string;
  install: (app: ViridApp, options?: any) => void;
}
