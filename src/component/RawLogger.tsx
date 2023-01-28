import React, { ReactNode, useContext, useEffect } from "react";
import Anser, { AnserJsonEntry } from "anser";
import { escapeCarriageReturn } from "escape-carriage";
import { Partical } from "../utils/matcher";
import { ErrorMatcher, ErrorMatcherPattern } from "../utils/errorMatcher";

import { ErrorContext } from "../model/ErrorContext";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles<{ error: boolean }>()((_theme, { error }) => ({
  logLine: {
    position: "relative",
    minHeight: "19px",
    margin: "0",
    padding: "0 15px 0 62px",
    color: `${error && "#f97583"}`,
    "&:hover, &:hover::before": {
      backgroundColor: "#444",
    },
  },
  lineNumLink: {
    position: "absolute",
    display: "inline-block",
    minWidth: "40px",
    marginLeft: "calc(-40px - 1em)",
    paddingRight: "1em",
    color: "#666",
    textAlign: "right",
    textDecoration: "none",
    cursor: "pointer",
  },
}));

export interface RawLoggerProps {
  partical: Partical;
  errorMatcher: ErrorMatcher;
  index: number;
  // foldable?: boolean;
  useClasses?: boolean;
  linkify?: boolean;
  linker: (matchedURL: string) => React.ReactNode;
}

const LINK_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

/**
 * Create a class string.
 * @name createClass
 * @function
 * @return {String} class name(s)
 * @param bundle
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
 * @return {Object} returns the style object
 * @param bundle
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
  key: number,
  linker: (href: string) => React.ReactNode
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
          {<React.Fragment key={index}>{linker(matchedUrl)}</React.Fragment>}
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
  // foldable = false,
  useClasses = false,
  linkify = false,
  linker,
  forwardRef,
}: RawLoggerProps & { forwardRef?: React.ForwardedRef<any> }) {
  const { setErrorRefs } = useContext(ErrorContext);

  const line = React.useMemo(() => {
    return ansiToJSON(partical.content).reduce(
      (prev, bundle, index) => {
        const content = convertBundleIntoReact(
          useClasses,
          linkify,
          bundle,
          index,
          linker
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

  return (
    <div ref={forwardRef} key={`line-${index}`} data-index={index}>
      <Line
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
  const { classes, cx } = useStyles({ error: errors.length > 0 });

  useEffect(() => {
    if (errors.length && ref.current && saveRef) {
      saveRef(errors, ref.current);
    }
  }, [ref.current, errors]);

  return (
    <div className={cx(classes.logLine)} key={`${index}-line-wrap`} ref={ref}>
      <a className={cx(classes.lineNumLink)} key={`lineNo-${index}`}>
        {index}
      </a>
      {line}
    </div>
  );
}

export default React.forwardRef(
  (props: RawLoggerProps, ref: React.ForwardedRef<any>) => (
    <RawLogger
      forwardRef={ref}
      partical={props.partical}
      errorMatcher={props.errorMatcher}
      index={props.index}
      // foldable={props.foldable}
      useClasses={props.useClasses}
      linkify={props.linkify}
      linker={props.linker}
    />
  )
);
