import { StarryApp } from "./app";

export interface StarryPlugin {
  name: string;
  install: (app: StarryApp, options?: any) => void;
}
