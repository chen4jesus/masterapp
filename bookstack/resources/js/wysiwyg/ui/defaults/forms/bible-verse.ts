import {EditorFormDefinition, EditorFormField} from "../../framework/forms";
import {EditorUiContext} from "../../framework/core";
import {$createBibleVerseNode, $isBibleVerseNode, BibleVerseNode} from "@lexical/rich-text/LexicalBibleVerseNode";
import {$getSelection, $insertNodes} from "lexical";
import {$getNodeFromSelection} from "../../../utils/selection";

export function $showBibleVerseForm(node: BibleVerseNode | null, context: EditorUiContext): void {
    const modal = context.manager.createModal('bible-verse');
    const formDefaults = node ? { reference: node.getReference() } : {};
    modal.show(formDefaults);
}

export const bibleVerse: EditorFormDefinition = {
    submitText: 'Apply',
    async action(formData, context: EditorUiContext) {
        context.editor.update(() => {
            const selection = $getSelection();
            const node = $getNodeFromSelection(selection, $isBibleVerseNode);
            const reference = (formData.get('reference') || '').toString().trim();

            if ($isBibleVerseNode(node)) {
                if (reference) {
                    node.setReference(reference);
                } else {
                    // If empty reference, maybe remove? For now, do nothing if empty.
                }
            } else {
                if (reference) {
                    const newNode = $createBibleVerseNode(reference);
                    $insertNodes([newNode]);
                }
            }
        });
        return true;
    },
    fields: [
        {
            label: 'Bible Verse Reference',
            name: 'reference',
            type: 'text',
        },
    ],
};
