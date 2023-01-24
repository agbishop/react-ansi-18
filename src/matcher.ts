export interface MatcherOptions {
  defaultFold?: boolean;
}

export type Partical = {
  label?: string;
  content: string;
  type: "partical" | "text";
  fold: boolean;
};

export interface Matcher {
  regexStart: RegExp;
  regexEnd: RegExp;
  label: string;
  matcherOptions: MatcherOptions;
}
