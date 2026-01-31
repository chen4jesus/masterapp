import {LexicalEditor, ParagraphNode} from "lexical";
import {$createBilingualNode} from "../lexical/rich-text/LexicalBilingualNode";

export function registerBilingualHandling(editor: LexicalEditor) {
    return editor.registerNodeTransform(ParagraphNode, (node) => {
        const textContent = node.getTextContent();
        
        // Check for start marker
        // Note: HTML entities for < and > are decoded in text content,
        // so checking for "{{< bilingual >}}" is correct.
        if (textContent.trim() !== '{{< bilingual >}}') {
            return;
        }

        // Found start marker.
        // Look ahead for siblings to construct the bilingual block.
        const nodesToProcess: ParagraphNode[] = [node];
        let nextNode = node.getNextSibling();
        
        // We will collect content until we find the end marker
        // If we don't find it within reasonable limits or hit end of doc, we abort to avoid eating content
        
        let zhContent: string[] = [];
        let enContent: string[] = [];
        let state: 'start' | 'zh' | 'between' | 'en' | 'end' = 'start';
        let foundEnd = false;
        
        const nodesToRemove = [];

        // Safety limit to prevent freezing on large docs if end is missing
        let limit = 200; 

        while (nextNode && limit > 0) {
            if (!(nextNode instanceof ParagraphNode)) {
                 // Optimization: if we encounter non-paragraph, simplistic parser might fail.
                 // But let's assume standard import structure.
            }
            
            const text = nextNode.getTextContent().trim();
            nodesToRemove.push(nextNode);
            
            if (state === 'start') { // Waiting for ::zh::
                if (text === '::zh::') {
                    state = 'zh';
                }
            } else if (state === 'zh') { // Collecting zh content
                if (text === '::en::') {
                    state = 'en';
                } else {
                    zhContent.push(text);
                }
            } else if (state === 'en') { // Collecting en content
                if (text.includes('{{< /bilingual >}}') || text.includes('{{&lt; /bilingual &gt;}}')) {
                    foundEnd = true;
                    break;
                } else {
                    enContent.push(text);
                }
            }
            
            nextNode = nextNode.getNextSibling();
            limit--;
        }

        if (foundEnd) {
            const bilingualNode = $createBilingualNode();
            bilingualNode.setZhContent(zhContent.join('\n\n'));
            bilingualNode.setEnContent(enContent.join('\n\n'));
            
            node.replace(bilingualNode);
            nodesToRemove.forEach(n => n.remove());
        }
    });
}
