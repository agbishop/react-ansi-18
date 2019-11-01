import React from 'react';
import { Partical } from '../matcher';
import { RawLogger } from './RawLogger';
import styles from '../style/log.module.less';

export interface LogContent {
  particals: Partical[];
  style?: React.CSSProperties;
  linkify?: boolean;
}

export function LogContent({ particals, style, linkify }: LogContent) {
  return <pre id="log" className={styles.ansi} style={style}>
    {particals.map((partical, index) => {
      return (
        <RawLogger
          key={`logger-line-${index}`}
          foldable={partical.type === 'partical'}
          partical={partical}
          index={index}
          linkify={linkify}
        />
      );
    })}
  </pre>;
}