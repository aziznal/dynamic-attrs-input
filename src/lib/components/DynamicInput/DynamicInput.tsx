import {
  createRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RefObject } from 'react';
import { cn } from '@/lib/utils';

// - [x] Clicking on input focuses last text segment
// - [ ] Given multiple entries for the same attribute, only the last one counts as the value and gets highlighted etc.

type AttributeDef = { regex: RegExp };
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
  ref: RefObject<HTMLDivElement | null>;
};
type TextSegment = {
  id: string;
  value: string;
  type: 'text';
  ref: RefObject<HTMLInputElement | null>;
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
            ref: createRef<HTMLInputElement>(),
          },
        ]
      : [],
  );

  const segments = value.map((entry) => {
    if (entry.type === 'text') {
      const ref = createRef<HTMLInputElement>();

      return {
        ...entry,
        ref,
        component: (
          <TextSegmentRender
            inputRef={ref}
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
        ),
      } as const;
    } else {
      const ref = createRef<HTMLDivElement>();

      return {
        ...entry,
        ref,
        component: (
          <AttributeSegmentRender
            key={entry.id}
            ref={ref}
            value={entry.value}
          />
        ),
      } as const;
    }
  });

  const anyInputValue = useMemo(
    () =>
      segments
        .filter((s) => s.type === 'text')
        .map((s) => s.value)
        .reduce((acc, next) => acc + next, ''),
    [segments],
  );

  // listen to current text input to create new attrs if they match
  useEffect(() => {
    // no attrs provided
    if (!props.value.attributes) return;

    // nothing is focused
    if (!document.activeElement) return;

    const focusedTextSegment = segments.find(
      (segment) =>
        segment.type === 'text' &&
        segment.ref.current === document.activeElement,
    );

    if (!focusedTextSegment || !focusedTextSegment.ref.current) return;

    const currentValue =
      'value' in focusedTextSegment.ref.current
        ? focusedTextSegment.ref.current.value
        : undefined;

    if (!currentValue) return;

    // test all attr regexes, stop at first matching and create new attr segment
    for (const [attrName, attrDef] of Object.entries(props.value.attributes)) {
      const matches = attrDef.regex.test(currentValue);

      if (matches) {
        createNewAttributeSegment({
          attributeName: attrName,
          attributeValue: currentValue,
          replaceSegmentId: focusedTextSegment.id,
        });
        break;
      }
    }
  }, [anyInputValue]);

  const createNewAttributeSegment = (args: {
    attributeName: AttrSegment['name'];
    attributeValue: AttrSegment['value'];
    replaceSegmentId: Segment['id'];
  }) => {
    setValue((prev) => {
      const updated = prev.map((e) =>
        e.id === args.replaceSegmentId
          ? ({
              type: 'attribute',
              id: genSegmentId(),
              name: args.attributeName,
              value: args.attributeValue,
              ref: createRef<HTMLDivElement>(),
            } satisfies AttrSegment)
          : e,
      );

      const newTextSegment = {
        type: 'text',
        id: genSegmentId(),
        value: '',
        ref: createRef<HTMLInputElement>(),
      } satisfies TextSegment;

      return [...updated, newTextSegment];
    });
  };

  const focusLastTextSegment = () => {
    const lastTextSegment = segments.findLast(
      (segment) => segment.type === 'text',
    );

    if (!lastTextSegment || !lastTextSegment.ref.current) return;

    const isFocused = lastTextSegment.ref.current === document.activeElement;
    if (isFocused) return;

    lastTextSegment.ref.current.focus();

    // set cursor to end
    lastTextSegment.ref.current.selectionStart =
      lastTextSegment.ref.current.selectionEnd = lastTextSegment.value.length;
  };

  return (
    <div
      className={cn(
        'border rounded-md px-2 py-1 w-[300px] flex flex-wrap gap-1 cursor-text',
        'hover:border-neutral-500 focus-within:border-neutral-500',
        props.className,
      )}
      onClick={focusLastTextSegment}
    >
      {segments.map((segment) => segment.component)}
    </div>
  );
}

type TextSegmentProps = {
  value: string;
  onValueChange: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

function TextSegmentRender({
  value,
  onValueChange,
  inputRef,
}: TextSegmentProps) {
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
      autoFocus
      ref={inputRef}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="pe-1 wrap-break-word focus:outline-none"
      style={{ width: `${width}px` }}
    />
  );
}

type AttributeSegmentProps = {
  ref: RefObject<HTMLDivElement | null>;
  value: string;
};

function AttributeSegmentRender(props: AttributeSegmentProps) {
  return (
    <div
      ref={props.ref}
      className="px-1 py-0.5 rounded-md bg-rose-500 text-white font-medium"
    >
      {props.value}
    </div>
  );
}

function genSegmentId() {
  return Math.random().toString();
}
