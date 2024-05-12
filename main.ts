import { Plugin, WorkspaceLeaf } from "obsidian";
import { MathmaidView, VIEW_TYPE } from "./view";

export default class ExamplePlugin extends Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE,
      (leaf) => new MathmaidView(leaf)
    );

    this.addRibbonIcon("pencil", "Activate view", () => {
      this.activateView();
    });
  }

  async onunload() {
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getRightLeaf(false);
    }

    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
      // "Reveal" the leaf in case it is in a collapsed sidebar
      workspace.revealLeaf(leaf);
    }
  }
}