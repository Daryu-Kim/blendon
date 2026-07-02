declare module "@toast-ui/editor" {
  const Editor: new (options: Record<string, unknown>) => {
    getMarkdown: () => string;
    setMarkdown: (value: string, cursorToEnd?: boolean) => void;
    destroy: () => void;
  };
  export default Editor;
}

declare module "@toast-ui/editor/dist/toastui-editor-viewer" {
  const Viewer: new (options: Record<string, unknown>) => {
    setMarkdown: (value: string) => void;
    destroy: () => void;
  };
  export default Viewer;
}
