import {EditorButtonDefinition} from "../../framework/buttons";
import {EditorUiContext} from "../../framework/core";
import bibleVerseIcon from "@icons/editor/bible-verse.svg";
import {$showBibleVerseForm} from "../forms/bible-verse";
import {$getSelection} from "lexical";
import {$getNodeFromSelection, $selectionContainsNodeType} from "../../../utils/selection";
import {$isBibleVerseNode, BibleVerseNode} from "@lexical/rich-text/LexicalBibleVerseNode";

export const bibleVerse: EditorButtonDefinition = {
    label: 'Insert/Edit Bible Verse',
    icon: bibleVerseIcon,
    action(context: EditorUiContext) {
        context.editor.getEditorState().read(() => {
            const selection = $getSelection();
            const node = $getNodeFromSelection(selection, $isBibleVerseNode) as BibleVerseNode | null;
            $showBibleVerseForm(node, context);
        });
    },
    isActive: (selection) => $selectionContainsNodeType(selection, $isBibleVerseNode),
};
