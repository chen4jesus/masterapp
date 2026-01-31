import {
    DecoratorNode,
    DOMConversion,
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';

export type SerializedBibleVerseNode = Spread<{
    reference: string;
}, SerializedLexicalNode>;

export class BibleVerseNode extends DecoratorNode<null> {
    __reference: string;

    static getType(): string {
        return 'bible-verse';
    }

    static clone(node: BibleVerseNode): BibleVerseNode {
        return new BibleVerseNode(node.__reference, node.__key);
    }

    constructor(reference: string, key?: NodeKey) {
        super(key);
        this.__reference = reference;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        span.className = 'bible-verse';
        span.dataset.reference = this.__reference;
        span.textContent = this.__reference;
        return span;
    }

    updateDOM(prevNode: BibleVerseNode, dom: HTMLElement): boolean {
        if (prevNode.__reference !== this.__reference) {
            dom.dataset.reference = this.__reference;
            dom.textContent = this.__reference;
        }
        return false;
    }

    setReference(reference: string): void {
        const writable = this.getWritable();
        writable.__reference = reference;
    }

    getReference(): string {
        return this.getLatest().__reference;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (node: HTMLElement): DOMConversion | null => {
                if (node.classList.contains('bible-verse') && node.dataset.reference) {
                    return {
                        conversion: convertBibleVerseElement,
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    exportDOM(): DOMExportOutput {
        const span = document.createElement('span');
        span.className = 'bible-verse';
        span.dataset.reference = this.__reference;
        span.textContent = this.__reference;
        return {element: span};
    }

    exportJSON(): SerializedBibleVerseNode {
        return {
            reference: this.__reference,
            type: 'bible-verse',
            version: 1,
        };
    }

    static importJSON(serializedNode: SerializedBibleVerseNode): BibleVerseNode {
        return $createBibleVerseNode(serializedNode.reference);
    }

    decorate(): null {
        return null;
    }

    isInline(): boolean {
        return true;
    }
}

function convertBibleVerseElement(domNode: HTMLElement): DOMConversionOutput | null {
    const reference = domNode.dataset.reference;
    if (reference) {
        const node = $createBibleVerseNode(reference);
        return {node};
    }
    return null;
}

export function $createBibleVerseNode(reference: string): BibleVerseNode {
    return new BibleVerseNode(reference);
}

export function $isBibleVerseNode(node: LexicalNode | null | undefined): node is BibleVerseNode {
    return node instanceof BibleVerseNode;
}
