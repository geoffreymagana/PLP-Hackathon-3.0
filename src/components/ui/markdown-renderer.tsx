
"use client";

import React from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import { CodeBlock } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";
import type { CodeProps } from 'react-markdown/lib/ast-to-react';


export function MarkdownRenderer({ content, className }: { content: string, className?: string }) {
  return (
    <ReactMarkdown
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:leading-relaxed prose-p:my-4 first:prose-p:mt-0 last:prose-p:mb-0",
        "prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2",
        "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
        "prose-strong:font-semibold prose-strong:text-foreground",
        "prose-em:italic",
        "prose-code:font-mono prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md prose-code:text-xs",
        "prose-code:before:content-[''] prose-code:after:content-['']",
        "prose-pre:p-0 prose-pre:bg-transparent prose-pre:overflow-visible",
        "prose-li:my-1.5",
        "prose-ol:my-4 prose-ul:my-4",
        "prose-blockquote:border-l-4 prose-blockquote:border-muted prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80",
        className
      )}
      components={{
        pre: ({ node, ...props }) => {
          const codeNode = node?.children[0];
          if (codeNode && codeNode.type === 'element' && codeNode.tagName === 'code') {
            const className = codeNode.properties?.className || [];
            const language = (className as string[]).find(cls => cls.startsWith('language-'))?.replace('language-', '') || 'text';
            const codeContent = (codeNode.children[0] as any)?.value || '';
            
            return (
              <div className="not-prose my-4">
                <CodeBlock language={language} value={codeContent} />
              </div>
            );
          }
          return <pre {...props} className="bg-muted p-4 rounded-lg overflow-x-auto text-sm" />;
        },
        code: ({ node, className, children, ...props }: CodeProps & ExtraProps) => {
          const match = /language-(\w+)/.exec(className || "");
          return !props.inline && match ? (
            // This is now handled by the `pre` component override
            <code {...props} className={className}>
              {children}
            </code>
          ) : (
            <code
              {...props}
              className={cn(
                "font-mono bg-muted text-foreground px-1.5 py-0.5 rounded-md text-xs",
                className
              )}
            >
              {children}
            </code>
          );
        },
         h1: ({ children, ...props }) => (
          <h1 {...props} className="text-2xl font-semibold mt-6 mb-2">{children}</h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 {...props} className="text-xl font-semibold mt-6 mb-2">{children}</h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 {...props} className="text-lg font-semibold mt-6 mb-2">{children}</h3>
        ),
        strong: ({ children, ...props }) => (
          <strong {...props} className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children, ...props }) => (
          <em {...props} className="italic">{children}</em>
        ),
        ul: ({ children, ...props }) => (
          <ul {...props} className="list-disc list-inside my-4 space-y-1">{children}</ul>
        ),
        ol: ({ children, ...props }) => (
          <ol {...props} className="list-decimal list-inside my-4 space-y-1">{children}</ol>
        ),
        blockquote: ({ children, ...props }) => (
          <blockquote {...props} className="border-l-4 border-muted pl-4 italic my-4">{children}</blockquote>
        ),
        a: ({ children, href, ...props }) => (
          <a {...props} href={href} className="text-primary underline hover:text-primary/80">{children}</a>
        ),
        p: ({ children, ...props }) => (
          <p {...props} className="leading-relaxed my-4 first:mt-0 last:mb-0">{children}</p>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
