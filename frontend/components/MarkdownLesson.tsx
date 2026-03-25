"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function MarkdownLesson({ content }: Props) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 text-zinc-100">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2 text-zinc-200">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 text-zinc-300">{children}</h3>,
          p: ({ children }) => <p className="my-2 text-zinc-300 leading-relaxed">{children}</p>,
          li: ({ children }) => <li className="text-zinc-300">{children}</li>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            return isBlock ? (
              <code className="tab-content block p-3 bg-zinc-900 rounded my-3 overflow-x-auto">{children}</code>
            ) : (
              <code className="bg-zinc-800 px-1 rounded text-zinc-200 font-mono text-sm">{children}</code>
            );
          },
          input: ({ type, checked }) =>
            type === "checkbox" ? (
              <input type="checkbox" defaultChecked={checked} className="mr-2 accent-zinc-400" />
            ) : null,
        }}
      />
    </div>
  );
}
