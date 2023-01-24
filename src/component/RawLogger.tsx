import React, { ReactNode, useContext, useEffect, useState } from "react";
import Anser, { AnserJsonEntry } from "anser";
import { escapeCarriageReturn } from "escape-carriage";
import { Partical } from "../matcher";
import { ErrorMatcher, ErrorMatcherPattern } from "../errorMatcher";

import { ErrorContext } from "../model/ErrorContext";
import styled from "@emotion/styled";

export interface RawLoggerProps {
  partical: Partical;
  errorMatcher: ErrorMatcher;
  index: number;
  foldable?: boolean;
  useClasses?: boolean;
  linkify?: boolean;
  style?: React.CSSProperties;
}

const LINK_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

/**
 * Create a class string.
 * @name createClass
 * @function
 * @param {AnserJsonEntry}.
 * @return {String} class name(s)
 */
function createClass(bundle: AnserJsonEntry) {
  let classNames: string = "";

  if (!bundle.bg && !bundle.fg) {
    return "";
  }
  if (bundle.bg) {
    classNames += bundle.bg + " ";
  }
  if (bundle.fg) {
    classNames += bundle.fg + " ";
  }

  classNames = classNames.substring(0, classNames.length - 1);
  return classNames;
}

/**
 * Create the style attribute.
 * @name createStyle
 * @function
 * @param {AnserJsonEntry}.
 * @return {Object} returns the style object
 */
function createStyle(bundle: AnserJsonEntry) {
  const style: { backgroundColor?: string; color?: string } = {};
  if (bundle.bg) {
    style.backgroundColor = `rgb(${bundle.bg})`;
  }
  if (bundle.fg) {
    style.color = `rgb(${bundle.fg})`;
  }

  return style;
}

function isEmpty(style: null | object) {
  return !style || Object.keys(style).length === 0;
}

function ansiToJSON(input: string, useClasses = false) {
  input = escapeCarriageReturn(input);
  return Anser.ansiToJson(input, {
    json: true,
    remove_empty: true,
    use_classes: useClasses,
  });
}

function convertBundleIntoReact(
  useClasses: boolean,
  linkify: boolean,
  bundle: AnserJsonEntry,
  key: number
) {
  const style = useClasses ? null : createStyle(bundle);
  const className = useClasses ? createClass(bundle) : "";

  let content: ReactNode[] | string = bundle.content;
  if (linkify) {
    content = bundle.content.split(/(\s+)/).reduce((words, word, index) => {
      if (index % 2 === 1) {
        words.push(word);
        return words;
      }

      const matches = LINK_REGEX.exec(word);
      if (!matches) {
        words.push(word);
        return words;
      }

      const matchedUrl = matches[0];
      words.push(
        <>
          {word.substring(0, matches.index)}
          <a
            key={index}
            href={matchedUrl}
            target="_blank"
            rel="noopener noreferer"
          >
            {matchedUrl}
          </a>
          {word.substring(matches.index + matchedUrl.length)}
        </>
      );

      return words;
    }, [] as React.ReactNode[]);
  }

  if (!isEmpty(style) || className) {
    return (
      <span style={style || {}} key={key}>
        {content}
      </span>
    );
  }

  return content;
}

export function RawLogger({
  partical,
  errorMatcher,
  index = 0,
  foldable = false,
  useClasses = false,
  linkify = false,
  forwardRef,
  style,
}: RawLoggerProps & { forwardRef?: React.ForwardedRef<any> }) {
  const { setErrorRefs } = useContext(ErrorContext);
  const lineProps = { useClasses, linkify, errorMatcher };
  const [fold, setFold] = useState(partical.fold);

  const line = React.useMemo(() => {
    return ansiToJSON(partical.content).reduce(
      (prev, bundle, index) => {
        const content = convertBundleIntoReact(
          useClasses,
          linkify,
          bundle,
          index
        );
        const errors = errorMatcher.match(bundle);
        return {
          content: prev.content.concat([content]),
          errors: prev.errors.concat(errors),
        };
      },
      {
        content: [] as any,
        errors: [] as ErrorMatcher["patterns"],
      }
    );
  }, [partical, useClasses, linkify, errorMatcher]);

  if (foldable) {
    return (
      <FoldLineDiv fold={fold} ref={forwardRef} style={style}>
        <FoldLineLogLineDiv
          key={`folder-placeholder-${index}`}
          onClick={() => setFold(!fold)}
        >
          {partical.label
            ? ansiToJSON(partical.label).map(
                convertBundleIntoReact.bind(null, useClasses, linkify)
              )
            : null}
        </FoldLineLogLineDiv>
        <Line
          {...lineProps}
          line={line.content}
          errors={line.errors}
          index={index}
          saveRef={setErrorRefs}
        />
      </FoldLineDiv>
    );
  }

  return (
    <div ref={forwardRef} style={style} key={`line-${index}`}>
      <Line
        {...lineProps}
        line={line.content}
        errors={line.errors}
        index={index}
        saveRef={setErrorRefs}
      />
    </div>
  );
}

export function Line({
  line,
  errors,
  index,
  saveRef,
}: {
  line: string;
  errors: ErrorMatcher["patterns"];
  index: number;
  saveRef: (errors: ErrorMatcherPattern[], ref: HTMLDivElement) => void;
}) {
  const ref = React.createRef<HTMLDivElement>();

  useEffect(() => {
    if (errors.length && ref.current && saveRef) {
      saveRef(errors, ref.current);
    }
  }, [ref.current, errors]);

  return (
    <LogLineDiv error={errors.length > 0} key={`${index}-line-wrap`} ref={ref}>
      <LineNoLink key={`lineNo-${index}`}>{index}</LineNoLink>
      {line}
    </LogLineDiv>
  );
}

const FoldLineLogLineDiv = styled.div`
  color: #ffff91;
  cursor: pointer;

  &::before {
    position: absolute;
    top: 4px;
    left: 8px;
    width: 10px;
    height: 10px;
    background: url("../media/arrow.svg") 8px 3px no-repeat #2b2b2b;
    background-position: center;
    transition: transform cubic-bezier(0.785, 0.135, 0.15, 0.86) 0.3s;
    content: " ";
  }
`;

interface FoldLineDivProps {
  fold: boolean;
}

const FoldLineDiv = styled.div<FoldLineDivProps>`
  ${(props) =>
    props.fold
      ? `
     height: auto;
     &:before: {
        transform: rotate(90deg);
     }
    `
      : `
    position: relative;
    height: 19px;
    overflow: hidden;
    cursor: pointer;
    `}
`;

const LineNoLink = styled.a`
  position: absolute;
  display: inline-block;
  min-width: 40px;
  margin-left: calc(-40px - 1em);
  padding-right: 1em;
  color: #666;
  text-align: right;
  text-decoration: none;
  cursor: pointer;
`;

interface LogLineDivProps {
  error: boolean;
}

const LogLineDiv = styled.div<LogLineDivProps>`
  position: relative;
  min-height: 19px;
  margin: 0;
  padding: 0 15px 0 62px;

  &:hover,
  &:hover::before {
    background-color: #444 !important;
  }

  color: ${(props) => props.error && "#f97583"};
`;
export default React.forwardRef(
  (props: RawLoggerProps, ref: React.ForwardedRef<any>) => (
    <RawLogger {...props} forwardRef={ref} />
  )
);
