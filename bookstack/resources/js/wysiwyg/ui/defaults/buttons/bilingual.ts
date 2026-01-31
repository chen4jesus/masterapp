import {EditorButtonDefinition} from "../../framework/buttons";
import {EditorUiContext} from "../../framework/core";
import {$getSelection, $insertNodes} from "lexical";
import bilingualIcon from "@icons/editor/bilingual.svg";
import {$createBilingualNode, $isBilingualNode} from "@lexical/rich-text/LexicalBilingualNode";
import {$insertNewBlockNodeAtSelection, $selectionContainsNodeType} from "../../../utils/selection";

export const bilingual: EditorButtonDefinition = {
    label: 'Insert bilingual block',
    icon: bilingualIcon,
    action(context: EditorUiContext) {
        context.editor.update(() => {
            const bilingualNode = $createBilingualNode();
            $insertNewBlockNodeAtSelection(bilingualNode, true);
        });
    },
    isActive(selection): boolean {
        return $selectionContainsNodeType(selection, $isBilingualNode);
    }
};
