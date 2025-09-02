"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { toast } from "@/hooks/use-toast";

interface CodeBlockProps {
  language: string;
  value: string;
  className?: string;
}

export function CodeBlock({
  language,
  value,
  className,
  ...props
}: CodeBlockProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Code has been copied to your clipboard",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="relative group" role="region" aria-label={`Code block: ${language}`}>
      <pre
        className={cn(
          "relative w-full rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto",
          // Use exact dark background color requested and light text
          "bg-[color:var(--code-bg,#090040)] text-[#e6f0ff]",
          className
        )}
        {...props}
      >
        <div className="absolute right-4 top-3 opacity-0 group-hover:opacity-100 transition">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCopy}
            aria-label="Copy code"
          >
            {hasCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="absolute top-2 left-4 text-xs font-sans text-[#c9ddff]">
          {language}
        </div>
        <code className={cn("relative block pt-4 whitespace-pre", className)}>
          {value}
        </code>
      </pre>
      <style jsx>{`
        /* Provide a CSS variable fallback and ensure exact background color */
        :root { --code-bg: #090040; }
      `}</style>
    </div>
  );
}
