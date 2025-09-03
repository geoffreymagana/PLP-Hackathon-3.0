
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Helper function to extract text content recursively
function extractTextContent(node: any): string {
  if (typeof node === 'string') {
    return node;
  }
  
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join('');
  }
  
  if (React.isValidElement(node)) {
    // Cast to React.ReactElement to safely access props (props may be typed as unknown)
    const element = node as React.ReactElement;
    const children = (element.props as any)?.children;
    return extractTextContent(children);
  }
  
  return '';
}

// Helper function to extract language from className
function extractLanguage(className: string | string[] | undefined): string {
  if (!className) return 'text';
  
  // Handle both string and array formats
  const classes = Array.isArray(className) ? className : [className];
  
  for (const cls of classes) {
    if (typeof cls !== 'string') continue;
    const match = cls.match(/^language-(.+)$/);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  
  return 'text';
}

// Helper function to check if children contain block elements
function hasBlockElements(children: any): boolean {
  if (!children) return false;
  
  const findBlockElement = (node: any): boolean => {
    if (!node) return false;
    
    if (Array.isArray(node)) {
      return node.some(findBlockElement);
    }
    
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement;
      const className = (element.props as any)?.className;
      const isNotProse = typeof className === 'string' && className.includes('not-prose');
      const isBlockElement = ['pre', 'div', 'section', 'article'].includes(
        typeof element.type === 'string' ? element.type : ''
      );
      
      if (isNotProse || isBlockElement) {
        return true;
      }
      
      return findBlockElement((element.props as any)?.children);
    }
    
    return false;
  };
  
  return findBlockElement(children);
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:font-heading prose-headings:leading-tight",
        "prose-p:leading-normal",
        "prose-code:font-mono prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:p-0 prose-pre:bg-transparent",
        className
      )}
      components={{
        // Handle paragraphs with potential block content
        p: (props: any) => {
          const children = props.children;
          if (hasBlockElements(children)) {
            return <>{React.Children.toArray(children)}</>;
          }
          return <p {...props}>{children}</p>;
        },

        // Let pre tags pass through - they'll be handled by code
        pre: (props: any) => <pre {...props} />,

        // Single point of code handling
        code: (props: any) => {
          const { node, inline, className, children } = props;

          // Extract text content consistently
          const content = extractTextContent(children).trim();
          if (!content) return null;

          // Always handle inline code with simple styling
          if (inline) {
            return (
              <code className={cn(
                "bg-muted px-1.5 py-0.5 rounded-sm font-mono text-sm",
                "before:content-none after:content-none"
              )}>
                {content}
              </code>
            );
          }

          // Everything else goes through CodeBlock
          try {
            const language = extractLanguage(className);
            return (
              <div className="not-prose my-4">
                <CodeBlock language={language} value={content} />
              </div>
            );
          } catch (error) {
            console.warn('Error in code block:', error);
            // Fallback to plain formatting
            return (
              <pre className="p-4 bg-muted rounded-lg" {...props}>
                <code {...props}>{content}</code>
              </pre>
            );
          }
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
