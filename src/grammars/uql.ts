import { LRLanguage } from '@codemirror/language';
import { styleTags, tags } from '@lezer/highlight';

import { parser } from './generated/uql';

// CodeMirror langauge provider for UQL
export const uqlLanguage = LRLanguage.define({
  name: 'uql',
  languageData: {
    commentTokens: { line: '#' },
  },
  parser: parser.configure({
    props: [
      // styleTags maps the tokens defined by the UQL grammar to the CodeMirror
      // generic syntax highlighting tokens
      styleTags({
        'bottom constant delta filter point_filter group_by join latest logs metric point rate reduce spans top with time_shift spans_sample assemble trace_filter summarize_by':
          tags.keyword,
        'min mean max sum count count_unadjusted percentile defined undefined abs ceil floor round timestamp distribution dist_sum dist_count std_dev count_nonzero fraction_true phrase_match contains':
          tags.operatorKeyword,
        'left right value': tags.self,
        Separator: tags.separator,
        BooleanOperator: tags.operator,
        Duration: tags.unit,
        Identifier: tags.name,
        Comment: tags.comment,
        String: tags.string,
        '( )': tags.paren,
        '&& ||': tags.operator,
      }),
    ],
  }),
});
