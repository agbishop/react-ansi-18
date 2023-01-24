/**
 * An foldable ansi logger for react
 * Inspired by ansi-to-react: https://github.com/nteract/nteract/blob/master/packages/ansi-to-react
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import produce, { enableMapSet } from "immer";
import { _ } from "./utils/i18n";
import { defaultMatchers, Spliter } from "./model/Spliter";
import styled from "@emotion/styled";

import { Matcher } from "./matcher";
import {
  defaultErrorMatchers,
  ErrorMatcher,
  ErrorMatcherPattern,
  ErrorMatcherPatterns,
} from "./errorMatcher";
import LogContent from "./component/LogContent";
import { ErrorContext, errorRefs } from "./model/ErrorContext";

enableMapSet();

const MemorizedLogContent = React.memo(LogContent);

export { Matcher, ErrorContext, errorRefs };

export interface FoldableLoggerProps {
  log: string | string[];
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  logStyle?: React.CSSProperties;
  matchers?: Matcher[];
  errorMatchers?: ErrorMatcherPatterns;
  autoScroll?: boolean;
  showHeader?: boolean;
  linkify?: boolean;
  virtual?: boolean;
  children?: ({
    hasError,
    errors,
  }: {
    hasError: boolean;
    errors: Map<HTMLDivElement, ErrorMatcherPattern[]>;
  }) => JSX.Element;
}

const FoldableLogger: React.FC<FoldableLoggerProps> = (props) => {
  const {
    style,
    bodyStyle,
    logStyle = {},
    log,
    children,
    matchers = defaultMatchers,
    errorMatchers = defaultErrorMatchers,
    autoScroll = false,
    showHeader = false,
    linkify = true,
    virtual = false,
  } = props;
  const [autoScrollFlag, setAutoScrollFlag] = useState(autoScroll);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [spliter] = useState(new Spliter(matchers));
  const [errorMatcher] = useState(new ErrorMatcher(errorMatchers));
  //const spliter = React.useMemo(() => , [matchers]);
  //const errorMatcher = React.useMemo(() => new ErrorMatcher(errorMatchers), [errorMatchers]);
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

  const foldedLogger = React.useMemo(
    () => spliter.execute(logArray),
    [spliter, log]
  );

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

  return (
    <ErrorContext.Provider value={{ setErrorRefs }}>
      <LogMain error={errors.size > 0} style={style}>
        {showHeader ? (
          <LogHeader>
            <button>{_("rawLog")}</button>
          </LogHeader>
        ) : null}

        <LogBody style={bodyStyle} ref={bodyRef}>
          {/* <Search defaultSearch /> */}
          <MemorizedLogContent
            particals={foldedLogger}
            style={logStyle}
            linkify={linkify}
            errorMatcher={errorMatcher}
            virtual={virtual}
            autoScroll={autoScrollFlag}
          />
        </LogBody>
        <LogFooter onClick={scrollBodyToTop}>
          <BackToTopLink>{_("top")}</BackToTopLink>
        </LogFooter>
      </LogMain>
      {errors.size && children
        ? children({ hasError: !!errors.size, errors })
        : null}
    </ErrorContext.Provider>
  );
};

type LogMainProps = {
  error: boolean;
};

const LogMain = styled.div<LogMainProps>`
  display: block;
  padding-right: ${(props) => props.error && "240px"};
`;

const LogHeader = styled.div({
  height: "28px",
  padding: "0.7em 0.8em 0.6em",
  textAlign: "right",
  background: "#444",
});

const LogBody = styled.div({
  position: "relative",
  backgroundColor: "#222",
});

const LogFooter = styled.div({
  height: "20px",
  padding: "0 8px",
  color: "#f1f1f1",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "right",
  background: "#222",
});
const BackToTopLink = styled.a({
  paddingRight: "12px",
  color: "#f1f1f1",
  background:
    "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iNSIgd2lkdGg9IjEwIiB2aWV3Qm94PSIwIDAgMTAgNSI+CjxwYXRoIGZpbGw9IiNjMmMyYzIiIGQ9Ik0xMCw1LDUsMCwwLDV6Ii8+Cjwvc3ZnPgo=) right 5px no-repeat #2b2b2b",
});

export default FoldableLogger;
