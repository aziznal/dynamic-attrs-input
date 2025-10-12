import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// - [ ] Clicking on input focuses last text segment
// - [ ] Given multiple entries for the same attribute, only the last one counts as the value and gets highlighted etc.

type AttributeDef = { regex: string | RegExp };
type AttributeValue = { value?: string };

type AttributeValuesOf<T extends Record<string, AttributeDef>> = {
  [K in keyof T]: AttributeValue;
};

type DynamicInputProps<TAttributes extends Record<string, AttributeDef>> = {
  value: {
    text?: string;
    attributes?: TAttributes;
  };

  onValueChange: (value: {
    text: string;
    attributes: AttributeValuesOf<TAttributes>;
  }) => void;

  className?: string;
};

type AttrSegment = {
  id: string;
  name: string;
  value: string;
  type: 'attribute';
  order: number;
};
type TextSegment = {
  id: string;
  value: string;
  type: 'text';
};
type Segment = AttrSegment | TextSegment;

export function DynamicInput<TAttributes extends Record<string, AttributeDef>>(
  props: DynamicInputProps<TAttributes>,
) {
  const [value, setValue] = useState<Array<Segment>>(
    props.value.text
      ? [
          {
            id: genSegmentId(),
            type: 'text',
            value: props.value.text,
          },
        ]
      : [],
  );

  const segments = value.map((entry) => {
    if (entry.type === 'text') {
      return (
        <DynamicWidthInput
          key={entry.id}
          value={entry.value}
          onValueChange={(newInputValue) =>
            setValue((prev) =>
              prev.map((e) =>
                e.id === entry.id ? { ...e, value: newInputValue } : e,
              ),
            )
          }
        />
      );
    } else {
      return (
        <div key={entry.id}>
          {entry.name}: {entry.value}
        </div>
      );
    }
  });

  useEffect(() => {
    // listen to all text inputs
  }, []);

  return (
    <div
      className={cn(
        'border rounded-md px-2 py-1 w-[300px] flex flex-wrap gap-1',
        props.className,
      )}
    >
      {segments}
    </div>
  );
}

type Props = {
  value: string;
  onValueChange: (v: string) => void;
};

function DynamicWidthInput({ value, onValueChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const [width, setWidth] = useState<number>();

  const recalculateWidth = () => {
    const input = inputRef.current;
    const span = spanRef.current;
    if (!input || !span) return;

    const inputStyle = getComputedStyle(input);
    span.style.font = inputStyle.font;
    span.style.letterSpacing = inputStyle.letterSpacing;

    const safe =
      (value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/ /g, '\u00A0') || '\u00A0';
    span.innerHTML = safe;

    const textW = span.getBoundingClientRect().width;

    const paddingLeft = parseFloat(inputStyle.paddingLeft);
    const paddingRight = parseFloat(inputStyle.paddingRight);
    const borderLeft = parseFloat(inputStyle.borderLeftWidth);
    const borderRight = parseFloat(inputStyle.borderRightWidth);

    setWidth(
      Math.ceil(textW + paddingLeft + paddingRight + borderLeft + borderRight),
    );
  };

  /** Update input width to exactly match its content */
  useLayoutEffect(() => {
    const span = document.createElement('span');
    spanRef.current = span;
    Object.assign(span.style, {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'pre',
      top: '0',
      left: '-9999px',
    });
    document.body.appendChild(span);
    return () => span.remove();
  }, []);

  useLayoutEffect(recalculateWidth, [value]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="pe-1 border wrap-break-word"
      style={{ width: `${width}px` }}
    />
  );
}

function genSegmentId() {
  return Math.random().toString();
}
