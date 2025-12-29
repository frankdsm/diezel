import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  lang?: string;
  filename?: string;
}

export async function CodeBlock({
  code,
  lang = "typescript",
  filename,
}: CodeBlockProps) {
  const html = await codeToHtml(code.trim(), {
    lang,
    theme: "monokai",
  });

  return (
    <div className="rounded-2xl border border-border bg-zinc-900/50 overflow-hidden">
      {filename && (
        <div className="flex items-center justify-center px-4 py-3 relative">
          <div className="flex gap-2 absolute left-4">
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
          </div>
          <span className="text-xs text-zinc-500 font-medium">{filename}</span>
        </div>
      )}
      <div
        className="p-5 text-sm overflow-x-auto [&_pre]:!bg-transparent [&_code]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
