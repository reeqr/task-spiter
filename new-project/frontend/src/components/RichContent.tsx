import React from 'react';

interface RichContentProps {
  content: string;
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('$') && token.endsWith('$')) {
      nodes.push(
        <span key={`${match.index}-math`} className="math-inline">
          {token}
        </span>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export default function RichContent({ content }: RichContentProps) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let codeBlock: string[] = [];
  let inCodeBlock = false;

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(React.createElement(
        ListTag,
        { key: `list-${elements.length}` },
        listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))
      ));
      listItems = [];
      listType = null;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlock.length > 0) {
      elements.push(
        <pre key={`code-${elements.length}`}>
          <code>{codeBlock.join('\n')}</code>
        </pre>
      );
      codeBlock = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlock.push(line);
      return;
    }

    if (!trimmed) {
      flushList();
      return;
    }

    if (/^---+$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={`hr-${index}`} />);
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const Tag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements;
      elements.push(<Tag key={`heading-${index}`}>{renderInline(text)}</Tag>);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (orderedMatch || unorderedMatch) {
      const nextType = orderedMatch ? 'ol' : 'ul';
      if (listType && listType !== nextType) {
        flushList();
      }
      listType = nextType;
      listItems.push((orderedMatch || unorderedMatch)![1]);
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${index}`}>
        {renderInline(line)}
      </p>
    );
  });

  flushList();
  flushCodeBlock();

  return <div className="rich-content">{elements}</div>;
}
