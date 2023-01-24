---
hero:
title: 🖥️ React Ansi
desc: A foldable and searchable ansi log viewer for React.
actions:
  - text: Getting Started
    link: /usage
    footer: Open-source MIT Licensed | Copyright © 2020<br />Powered by [dumi](https://d.umijs.org)
---

![log](https://user-images.githubusercontent.com/566097/67918532-b1245700-fbd7-11e9-9e9b-ed129b49d377.gif)

## Highlights

- Fast and smooth
- Foldable logs
- Automatic scrolling
- Errors detecting and fast navigator
- Regex search

## Install

```bash
npm install --save @agbishop/react-ansi-18
```

## Usage

```
import * as React from 'react'

import ReactAnsi from 'react-ansi'

function Example() {
  return (
    <ReactAnsi log={"hello world"} />
  )
}
```

## License

MIT © [agbishop](https://github.com/agbishop)
