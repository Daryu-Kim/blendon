export const preserveMarkdownBlankLines = (markdown: string) => {
  const parts = markdown.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);

  return parts
    .map((part) => {
      if (part.startsWith("```") || part.startsWith("~~~")) return part;

      return part.replace(/\n{3,}/g, (match) => {
        const blankParagraphCount = Math.max(1, match.length - 2);
        return `\n\n${Array.from({ length: blankParagraphCount }, () => "&nbsp;").join("\n\n")}\n\n`;
      });
    })
    .join("");
};
