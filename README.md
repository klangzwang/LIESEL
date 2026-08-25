# Visual Prompt Builder

A node-based visual environment designed specifically for engineering high-quality, complex prompts for Text-to-Image AI models (like Midjourney, Stable Diffusion, and Nano Banana 2).

## Overview

Visual Prompt Builder allows you to construct detailed image generation prompts using a flow-based interface. Instead of writing long, tangled strings of text, you can visually organize your prompt into distinct, manageable components: Subject, Style, Setting, Lighting, Camera, and Parameters.

## Features

- **Visual Node Editor:** Built on top of React Flow, offering a smooth, infinite canvas for drag-and-drop prompt creation.
- **Modular Prompting:** Break down your prompt into categorized blocks.
- **The Prompt Channel Node:** A central output node that acts as a template. It takes inputs from various categories and synthesizes them into a perfectly formatted, English-language prompt ready for your image generator.
- **Merge Nodes:** Combine multiple text strings before routing them into a specific category slot.
- **Reroute Nodes:** Keep your node graph clean and organized by routing connections clearly. Simply double-click on any connection line to create a reroute waypoint.
- **Context-Aware Properties Panel:** The right sidebar dynamically updates based on your current selection, allowing you to edit text content and node properties seamlessly.
- **Responsive Workspace:** Toggleable sidebars and snap-to-grid capabilities for a customized workflow.

## How to Use

1. **Add Nodes:** Drag and drop prompt nodes from the Left Sidebar into the workspace.
2. **Edit Content:** Select a node to edit its text content in the Right Sidebar.
3. **Connect the Flow:** Drag connections from your prompt nodes into the corresponding input slots on the **Prompt Channel Node** (Subject, Style, Setting, Lighting, Camera, Parameters).
4. **Organize:** Use **Merge Nodes** to combine multiple ideas into one slot, and **Reroute Nodes** (double-click a wire) to keep things tidy.
5. **Generate:** The Prompt Channel Node will automatically compile your inputs into a highly detailed, formatted prompt using Markdown.

## Tech Stack

- **React 18** (Vite)
- **TypeScript**
- **React Flow (@xyflow/react):** For the visual node graph and interactions.
- **Tailwind CSS:** For styling and layout.
- **Zustand:** For lightweight, fast state management across the application (Layout, Document, and Prompt stores).
- **React Markdown:** To render the generated prompt cleanly in the UI.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
