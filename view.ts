import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import mermaid from 'mermaid';

export const VIEW_TYPE = "view";

export class MathmaidView extends ItemView {
  private lastRenderedSVG: string | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Mathmaid";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Mathmaid" });
    container.createEl("p", { text: "Enter Mermaid syntax below to render diagrams." });

    const textArea = container.createEl("textarea", {
      placeholder: "Enter Mermaid syntax here...",
      cls: "mermaid-input",
      attr: { rows: 10, style: "width: 100%;" }
    });

    const renderButton = container.createEl("button", { text: "Render Diagram" });
    renderButton.onclick = () => this.renderMermaid(textArea.value, container as HTMLElement);

    const insertButton = container.createEl("button", { text: "Insert SVG into Note" });
    insertButton.onclick = () => this.insertSVGIntoNote(this.lastRenderedSVG || "", container as HTMLElement);
    insertButton.disabled = true;
  }

  async renderMermaid(mermaidCode: string, container: HTMLElement) {
    const diagramContainer = container.querySelector(".mermaid-output");
    diagramContainer?.remove();

    // Wrap in a mermaid div and render
    const diagramDiv = container.createEl("div", {
      cls: "mermaid mermaid-output"
    });
    mermaid.initialize({ startOnLoad: false });
    try {
      const { svg } = await mermaid.render("mermaid-diagram", mermaidCode);
      diagramDiv.innerHTML = svg;
      this.createDownloadButton(svg, container);
      this.lastRenderedSVG = svg;  // Store the SVG content
      const insertButton = container.querySelector("button:nth-of-type(2)") as HTMLButtonElement;
      if (insertButton) {
        insertButton.disabled = false;
      }
    } catch (error) {
      diagramDiv.createEl("p", { text: "Failed to render diagram. Please check your syntax." });
      console.error("Mermaid rendering error:", error);
      const existingButton = container.querySelector(".download-btn");
      existingButton?.remove();
    }
  }

  createDownloadButton(svgContent: string, container: HTMLElement) {
    const existingButton = container.querySelector(".download-btn");
    existingButton?.remove();

    const cleanedSvgContent = svgContent.replace(/<br>/g, '<br/>').replace(/<\/br>/g, '<br/>');
    
    const downloadButton = container.createEl("button", {
      cls: "download-btn",
      text: "Download SVG"
    });

    downloadButton.onclick = () => {
      const blob = new Blob([cleanedSvgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mermaid-diagram.svg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      new Notice("SVG downloaded successfully!");
    };
  }

  async insertSVGIntoNote(svgContent: string, container: HTMLElement) {
    if (!this.lastRenderedSVG) {
      new Notice("No diagram to insert.");
      return;
    }

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No active note to insert into.");
      return;
    }

    const cleanedSvgContent = svgContent.replace(/<br>/g, '<br/>').replace(/<\/br>/g, '<br/>');

    const fileName = `Diagram-${Date.now()}.svg`;
    const file = new Blob([cleanedSvgContent], { type: "image/svg+xml;charset=utf-8" });
    await this.app.vault.createBinary(fileName, await file.arrayBuffer());

    const fileContents = await this.app.vault.read(activeFile);
    const svgLink = `![](${fileName})\n`;
    const newContents = fileContents + svgLink;
    await this.app.vault.modify(activeFile, newContents);
    new Notice("SVG diagram inserted into note.");
  }


  async onClose() {
    // Nothing to clean up.
  }
}
