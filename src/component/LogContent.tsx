import React, { useCallback } from "react";
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
  ListRowRenderer,
} from "react-virtualized";
import { Partical } from "../matcher";
import RawLogger from "./RawLogger";
import { ErrorMatcher } from "../errorMatcher";

import styled from "@emotion/styled";

export interface LogContent {
  virtual?: boolean;
  particals: Partical[];
  style?: React.CSSProperties;
  linkify?: boolean;
  errorMatcher: ErrorMatcher;
  autoScroll?: boolean;
}

const measurementCache = new CellMeasurerCache({
  fixedWidth: true,
  defaultHeight: 25,
});

export function VirtualLogContent({
  particals,
  style,
  linkify,
  errorMatcher,
  autoScroll,
}: LogContent) {
  const rowRenderer: ListRowRenderer = useCallback(
    ({ key, index, style, parent }) => {
      const partical = particals[index];
      return (
        <CellMeasurer
          cache={measurementCache}
          columnIndex={0}
          rowIndex={index}
          key={key}
          parent={parent}
        >
          <RawLogger
            partical={partical}
            key={`logger-line-${index}`}
            foldable={partical.type === "partical"}
            index={index}
            linkify={linkify}
            errorMatcher={errorMatcher}
            style={style}
          />
        </CellMeasurer>
      );
    },
    [particals, linkify, errorMatcher]
  );

  return (
    <AnsiLogLine id="log" style={style}>
      <AutoSizer>
        {({ width, height }) => (
          <List
            rowCount={particals.length}
            rowRenderer={rowRenderer}
            width={width}
            height={height}
            deferredMeasurementCache={measurementCache}
            rowHeight={measurementCache.rowHeight}
            overscanRowCount={10}
            scrollToAlignment={autoScroll ? "end" : "auto"}
          />
        )}
      </AutoSizer>
    </AnsiLogLine>
  );
}

export function ClassicLogContent({
  particals,
  style,
  linkify,
  errorMatcher,
}: LogContent) {
  return (
    <AnsiLogLine id="log" style={style}>
      {particals.map((partical, index) => {
        return (
          <RawLogger
            key={`logger-line-${index}`}
            foldable={partical.type === "partical"}
            partical={partical}
            index={index}
            linkify={linkify}
            errorMatcher={errorMatcher}
          />
        );
      })}
    </AnsiLogLine>
  );
}

const AnsiLogLine = styled.pre`
  min-height: 42px;
  margin-top: 0;
  margin-bottom: -45px;
  padding: 15px 0 2em 0;
  color: #f1f1f1;
  font-size: 1em;
  font-family: "RobotoMono", Monaco, "Courier New", monospace;
  line-height: 1.58;
  white-space: pre-wrap;
  word-wrap: break-word;
  counter-reset: line-numbering;
`;

export default function LogContent(props: LogContent) {
  if (props.virtual) {
    return <VirtualLogContent {...props} />;
  }

  return <ClassicLogContent {...props} />;
}
