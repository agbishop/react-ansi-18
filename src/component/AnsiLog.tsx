import produce, { enableMapSet } from "immer";
import { _ } from "../utils/i18n";
import { defaultMatchers, Spliter } from "../model/Spliter";
import { Matcher } from "../utils/matcher";
import {
  defaultErrorMatchers,
  ErrorMatcher,
  ErrorMatcherPattern,
  ErrorMatcherPatterns,
} from "../utils/errorMatcher";
import { ErrorContext, errorRefs } from "../model/ErrorContext";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { RawLogger } from "./RawLogger";
import { makeStyles } from "tss-react/mui-compat";

enableMapSet();

export { Matcher, ErrorContext, errorRefs };

const useStyles = makeStyles<{ error: boolean }>()((_theme, { error }) => ({
  logMain: {
    display: "block",
    paddingRight: `${error && "240px"}`,
  },
  logHeader: {
    height: "28px",
    padding: "0.7em 0.8em 0.6em",
    textAlign: "right",
    background: "#444",
  },
  logBody: {
    position: "relative",
    backgroundColor: "#222",
  },
  logFooter: {
    height: "20px",
    padding: "0 8px",
    color: "#f1f1f1",
    fontSize: "12px",
    lineHeight: "20px",
    textAlign: "right",
    background: "#222",
  },
  backToTopLink: {
    paddingRight: "12px",
    color: "#f1f1f1",
    background:
      "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iNSIgd2lkdGg9IjEwIiB2aWV3Qm94PSIwIDAgMTAgNSI+CjxwYXRoIGZpbGw9IiNjMmMyYzIiIGQ9Ik0xMCw1LDUsMCwwLDV6Ii8+Cjwvc3ZnPgo=) right 5px no-repeat #2b2b2b",
  },
  ansiLogLine: {
    minHeight: "42px",
    marginTop: "0",
    marginBottom: "-45px",
    padding: "15px 0 2em 0",
    color: "#f1f1f1",
    fontSize: "1em",
    fontFamily: '"RobotoMono", Monaco, "Courier New", monospace',
    lineHeight: 1.58,
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    counterReset: "line-numbering",
  },
}));

export interface AnsiLogProps {
  log: string | string[];
  matchers?: Matcher[];
  errorMatchers?: ErrorMatcherPatterns;
  autoScroll?: boolean;
  showHeader?: boolean;
  linkify?: boolean;
  linker?: (url: string) => React.ReactNode;
  children?: ({
    hasError,
    errors,
  }: {
    hasError: boolean;
    errors: Map<HTMLDivElement, ErrorMatcherPattern[]>;
  }) => JSX.Element;
}

const AnsiLog: React.FC<AnsiLogProps> = (props) => {
  const {
    log,
    children,
    matchers = defaultMatchers,
    errorMatchers = defaultErrorMatchers,
    autoScroll = false,
    showHeader = false,
    linkify = true,
    linker = defaultLink,
  } = props;
  const [autoScrollFlag, setAutoScrollFlag] = useState(autoScroll);
  const bodyRef = useRef<HTMLDivElement>(null);
  const splitter = React.useMemo(() => new Spliter(matchers), [matchers]);
  const errorMatcher = React.useMemo(
    () => new ErrorMatcher(errorMatchers),
    [errorMatchers]
  );
  const [errors, setErrors] = useState(
    new Map<HTMLDivElement, ErrorMatcherPattern[]>()
  );
  const logArray = useMemo(
    () => (Array.isArray(log) ? log : log.split(/\r?\n/)),
    [log]
  );

  const setErrorRefs = useCallback(
    (error: ErrorMatcherPattern[], ref: HTMLDivElement) => {
      setErrors((err) =>
        produce(err, (draft) => {
          draft.set(ref as any, error);
        })
      );
    },
    [setErrors]
  );

  const foldedLogger = React.useMemo(() => {
    return splitter.execute(logArray);
  }, [splitter, log]);

  useEffect(() => {
    if (autoScrollFlag && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [log, matchers, bodyRef.current]);

  // Event listener: if user scrolling log content, then pause auto scroll
  // resume: scroll to bottom
  const pauseOrResumeScrolling = React.useCallback(() => {
    if (!bodyRef.current) {
      return;
    }

    const { scrollHeight, scrollTop, offsetHeight } = bodyRef.current;
    setAutoScrollFlag(scrollHeight - (scrollTop + offsetHeight) < 50);
  }, [bodyRef.current]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.addEventListener("scroll", pauseOrResumeScrolling);
    }
    return () => {
      bodyRef.current &&
        bodyRef.current.removeEventListener("scroll", pauseOrResumeScrolling);
    };
  }, [bodyRef.current, pauseOrResumeScrolling]);

  function scrollBodyToTop() {
    if (!bodyRef.current) {
      return;
    }
    bodyRef.current.scrollTop = 0;
  }

  const virtualizer = useVirtualizer({
    count: foldedLogger.length,
    getScrollElement: () => bodyRef.current,
    estimateSize: () => 20,
    overscan: 5,
  });
  const { classes, cx } = useStyles({ error: errors.size > 0 });
  const items = virtualizer.getVirtualItems();
  return (
    <ErrorContext.Provider value={{ setErrorRefs }}>
      <div className={cx(classes.logMain)} ref={bodyRef}>
        {showHeader ? (
          <div className={cx(classes.logHeader)}>
            <button>{_("rawLog")}</button>
          </div>
        ) : null}
        <div className={cx(classes.logBody)}>
          {/* <Search defaultSearch /> */}
          <div className={cx(classes.ansiLogLine)} id="log">
            {items.map((virtualRow) => {
              return (
                <RawLogger
                  key={virtualRow.key}
                  partical={foldedLogger[virtualRow.index]}
                  // foldable={foldedLogger[virtualRow.index].type === "partical"}
                  index={virtualRow.index}
                  linkify={linkify}
                  linker={linker}
                  data-index={virtualRow.index}
                  forwardRef={virtualizer.measureElement}
                  errorMatcher={errorMatcher}
                />
              );
            })}
          </div>
        </div>
        <div className={cx(classes.logFooter)} onClick={scrollBodyToTop}>
          <a className={cx(classes.backToTopLink)}>{_("top")}</a>
        </div>
      </div>
      {errors.size && children
        ? children({ hasError: !!errors.size, errors })
        : null}
    </ErrorContext.Provider>
  );
};

const defaultLink = (url: string) => {
  return (
    <a href={url} target="_blank" rel="noopener noreferer">
      {url}
    </a>
  );
};
export default AnsiLog;
