import { defaultKeymap, history, historyKeymap, indentLess, insertTab } from '@codemirror/commands';
import { HighlightStyle, LanguageSupport, indentService, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { tags } from '@lezer/highlight';

import { uqlLanguage } from '../../grammars/uql';

// The default CodeMirror syntax highlighting only covers a few tokens, this
// "HighlightStyle" adds support for all of the tokens that the LS languages use
// with default styles.
const syntaxHighlightingStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#0778d4' },
  { tag: tags.name, fontStyle: 'italic' },
  { tag: tags.paren, color: '#a56c82' },
  { tag: tags.separator, color: '#ff81b2' },
  { tag: tags.operator, color: '#d78000' },
  { tag: tags.operatorKeyword, color: '#c655e2' },
  { tag: tags.string, color: '#00b6b6' },
  { tag: tags.unit, color: '#25acac' },
  { tag: tags.comment, color: '#828ca1' },
  { tag: tags.self, fontStyle: 'italic', color: '#77abd3' },
]);

type CreateEditorView = (params: {
  editorEl: HTMLDivElement;
  initialText: string;
  onRunQuery: () => void;
  onQueryChange: (newQuery: string) => void;
}) => EditorView;

/**
 * Encapsulation of the CodeMirror Editor creation logic, including:
 *
 * 1. Syntax highlighting
 * 2. UQL grammar for AST
 * 3. Indentation
 */
export const createEditorView: CreateEditorView = ({ editorEl, initialText, onRunQuery, onQueryChange }) => {
  return new EditorView({
    parent: editorEl,
    state: EditorState.create({
      doc: initialText,
      extensions: [
        placeholder('Enter a query (Run with Shift + Enter)'),

        // --- UQL Language support
        syntaxHighlighting(syntaxHighlightingStyle),
        new LanguageSupport(uqlLanguage, [
          /* ...custom tql language extensions */
        ]),

        // --- LINE FORMATTING
        lineNumbers(),
        EditorView.lineWrapping,

        // --- INDENTATION
        // Overwrite indent to use tabs
        indentUnit.of('\t'),
        // extension called when new lines are added, used to provide simple
        // flat indentation support across new lines
        indentService.of(() => {
          // A return value of null indicates no indentation can be determined,
          // and the line should inherit the indentation of the one above it
          // - https://codemirror.net/docs/ref/#language.indentService
          //
          // We currently only provide a basic smart indentation that matches
          // the previous line's indentation, returning null shortcuts without
          // having to write complex indentation calculation logic
          return null;
        }),

        // --- KEYPRESS HANDLING
        history(),
        keymap.of([
          { key: 'Tab', run: insertTab, shift: indentLess },
          ...defaultKeymap,
          ...historyKeymap,
          ...lintKeymap,
          {
            key: 'Shift-Enter',
            run: (view: EditorView): boolean => {
              onRunQuery();
              return true;
            },
          },
        ]),

        // --- EVENT LISTENERS
        EditorView.domEventHandlers({
          blur(event, view) {
            onRunQuery();
          },
        }),

        // --- QUERY CHANGE LISTENERS
        EditorView.updateListener.of((update) => {
          // We only want to fire the update action when the query has changed
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            onQueryChange(newValue);
            // Uncomment to log the current syntax tree. Invaluable for debugging!
            // logTree(syntaxTree(update.state), newValue);
          }
        }),
      ],
    }),
  });
};
