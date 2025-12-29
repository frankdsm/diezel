/// <reference types="vite/client" />
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";

export async function hydrate() {
  // Dynamic import glob must be in user's code, so we use a different approach:
  // The data-diezel-island elements contain the module path relative to project root
  const islands = document.querySelectorAll<HTMLElement>("[data-diezel-island]");

  for (const island of islands) {
    const modulePath = island.dataset.diezelIsland;
    const componentName = island.dataset.diezelComponent;
    const propsJson = island.dataset.diezelProps;

    if (!modulePath || !componentName) continue;

    try {
      // Use dynamic import with the full path
      const mod = await import(/* @vite-ignore */ modulePath);
      const Component = mod[componentName] || mod.default;

      if (!Component) {
        console.warn(`[Diezel] Component ${componentName} not found in ${modulePath}`);
        continue;
      }

      const props = propsJson ? JSON.parse(propsJson) : {};
      hydrateRoot(island, createElement(Component, props));
    } catch (e) {
      console.error(`[Diezel] Hydration failed for ${componentName}:`, e);
    }
  }
}

// Auto-run on load
if (typeof window !== "undefined") {
  hydrate();
}
