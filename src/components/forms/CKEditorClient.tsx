"use client";

/**
 * CKEditor 5 instance, isolated in its own module so it can be loaded with
 * `ssr: false`. CKEditor reaches for browser globals at import time, so this file
 * must never be evaluated on the server — always reach it through
 * RichTextEditorField, which dynamic-imports it.
 *
 * CKEditor 5 is dual-licensed (GPL 2+ or commercial). `licenseKey: "GPL"` selects
 * the open-source terms; swap in a commercial key from CKSource if this project
 * ships under a proprietary licence.
 */

import { useMemo } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Alignment,
  Autoformat,
  AutoLink,
  BlockQuote,
  Bold,
  Essentials,
  GeneralHtmlSupport,
  Heading,
  HorizontalLine,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  SourceEditing,
  Strikethrough,
  Table,
  TableToolbar,
  TextTransformation,
  Underline,
  type EventInfo,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";

export interface CKEditorClientProps {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

const looksLikeHtml = (value: string): boolean => /<[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * CKEditor loads HTML. Records written before this editor existed hold plain
 * text, where paragraphs are blank lines — handing that straight over would
 * collapse it all into one run-on paragraph and destroy the structure on the
 * next save. Plain text is converted to paragraphs first; real HTML is passed
 * through untouched.
 */
export function toEditorHtml(value: string): string {
  if (!value) return "";
  if (looksLikeHtml(value)) return value;

  return value
    .split(/\r?\n[ \t]*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
}

export default function CKEditorClient({
  value,
  onChange,
  onBlur,
  placeholder,
}: CKEditorClientProps) {
  const initialData = useMemo(() => toEditorHtml(value || ""), [value]);

  const config = useMemo(
    () => ({
      licenseKey: "GPL",
      plugins: [
        Essentials,
        Paragraph,
        Heading,
        Bold,
        Italic,
        Underline,
        Strikethrough,
        Link,
        AutoLink,
        List,
        BlockQuote,
        Table,
        TableToolbar,
        Alignment,
        Indent,
        IndentBlock,
        HorizontalLine,
        RemoveFormat,
        Autoformat,
        TextTransformation,
        // Normalises markup pasted from Word, Google Docs and Outlook.
        PasteFromOffice,
        // Without this, pasted markup CKEditor has no plugin for is silently
        // discarded. Keeping it permissive is what makes copy-paste faithful.
        GeneralHtmlSupport,
        SourceEditing,
      ],
      toolbar: {
        items: [
          "undo",
          "redo",
          "|",
          "heading",
          "|",
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "removeFormat",
          "|",
          "link",
          "bulletedList",
          "numberedList",
          "blockQuote",
          "insertTable",
          "horizontalLine",
          "|",
          "alignment",
          "outdent",
          "indent",
          "|",
          "sourceEditing",
        ],
        shouldNotGroupWhenFull: false,
      },
      htmlSupport: {
        allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
      },
      table: {
        contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
      },
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: "https://",
      },
      placeholder: placeholder || "Write the full story here…",
    }),
    [placeholder]
  );

  return (
    <CKEditor
      editor={ClassicEditor}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config={config as any}
      data={initialData}
      onChange={(_event: EventInfo, editor: ClassicEditor) => {
        onChange(editor.getData());
      }}
      onBlur={() => onBlur?.()}
    />
  );
}
