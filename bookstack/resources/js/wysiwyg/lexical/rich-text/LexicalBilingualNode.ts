import {
    DOMConversion,
    DOMConversionMap,
    DOMConversionOutput,
    DecoratorNode,
    LexicalEditor,
    LexicalNode,
    SerializedLexicalNode,
    Spread,
    EditorConfig,
    DOMExportOutput,
    NodeKey,
} from 'lexical';

export type SerializedBilingualNode = Spread<{
    id: string;
    zhContent: string;
    enContent: string;
}, SerializedLexicalNode>

/**
 * BilingualNode - A custom Lexical DecoratorNode for bilingual content editing.
 * Stores Chinese and English content separately and renders as a two-column layout.
 * Content is saved in the markup format that the backend parser understands.
 */
export class BilingualNode extends DecoratorNode<null> {
    __id: string = '';
    __zhContent: string = '';
    __enContent: string = '';

    static getType(): string {
        return 'bilingual';
    }

    static clone(node: BilingualNode): BilingualNode {
        const clone = new BilingualNode(node.__key);
        clone.__id = node.__id;
        clone.__zhContent = node.__zhContent;
        clone.__enContent = node.__enContent;
        return clone;
    }

    constructor(key?: NodeKey) {
        super(key);
        this.__id = 'bilingual-' + Math.random().toString(36).substr(2, 9);
    }

    setId(id: string): void {
        const self = this.getWritable();
        self.__id = id;
    }

    getId(): string {
        return this.getLatest().__id;
    }

    setZhContent(content: string): void {
        const self = this.getWritable();
        self.__zhContent = content;
    }

    getZhContent(): string {
        return this.getLatest().__zhContent;
    }

    setEnContent(content: string): void {
        const self = this.getWritable();
        self.__enContent = content;
    }

    getEnContent(): string {
        return this.getLatest().__enContent;
    }

    createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
        const container = document.createElement('div');
        container.className = 'bilingual-editor-container';
        container.setAttribute('data-lexical-bilingual', 'true');
        container.setAttribute('id', this.__id);

        this._renderEditor(container, editor);

        return container;
    }

    private _renderEditor(container: HTMLElement, editor: LexicalEditor): void {
        container.innerHTML = '';

        // Create header
        const header = document.createElement('div');
        header.className = 'bilingual-editor-header';
        header.innerHTML = `
            <div class="bilingual-editor-header-zh">中文</div>
            <div class="bilingual-editor-header-en">ENGLISH</div>
        `;
        container.appendChild(header);

        // Create content area
        const contentArea = document.createElement('div');
        contentArea.className = 'bilingual-editor-content';

        // Chinese column with textarea
        const zhColumn = document.createElement('div');
        zhColumn.className = 'bilingual-editor-column bilingual-editor-zh';
        
        const zhTextarea = document.createElement('textarea');
        zhTextarea.className = 'bilingual-editor-textarea';
        zhTextarea.placeholder = '在此输入中文内容...\n\n每个段落用空行分隔。';
        zhTextarea.value = this.__zhContent;
        zhTextarea.addEventListener('input', (e) => {
            const target = e.target as HTMLTextAreaElement;
            editor.update(() => {
                this.setZhContent(target.value);
            });
        });
        // Prevent Lexical from handling keystrokes in the textarea
        zhTextarea.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
        zhColumn.appendChild(zhTextarea);

        // English column with textarea
        const enColumn = document.createElement('div');
        enColumn.className = 'bilingual-editor-column bilingual-editor-en';
        
        const enTextarea = document.createElement('textarea');
        enTextarea.className = 'bilingual-editor-textarea';
        enTextarea.placeholder = 'Enter English content here...\n\nSeparate paragraphs with blank lines.';
        enTextarea.value = this.__enContent;
        enTextarea.addEventListener('input', (e) => {
            const target = e.target as HTMLTextAreaElement;
            editor.update(() => {
                this.setEnContent(target.value);
            });
        });
        // Prevent Lexical from handling keystrokes in the textarea
        enTextarea.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
        enColumn.appendChild(enTextarea);

        contentArea.appendChild(zhColumn);
        contentArea.appendChild(enColumn);
        container.appendChild(contentArea);
    }

    updateDOM(prevNode: BilingualNode, dom: HTMLElement, config: EditorConfig): boolean {
        // Only update if content actually changed
        const zhTextarea = dom.querySelector('.bilingual-editor-zh textarea') as HTMLTextAreaElement;
        const enTextarea = dom.querySelector('.bilingual-editor-en textarea') as HTMLTextAreaElement;
        
        if (zhTextarea && zhTextarea.value !== this.__zhContent) {
            zhTextarea.value = this.__zhContent;
        }
        if (enTextarea && enTextarea.value !== this.__enContent) {
            enTextarea.value = this.__enContent;
        }
        
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div(node: HTMLElement): DOMConversion | null {
                if (node.getAttribute('data-lexical-bilingual') === 'true' ||
                    node.classList.contains('bilingual-container')) {
                    return {
                        conversion: (element: HTMLElement): DOMConversionOutput | null => {
                            const node = $createBilingualNode();
                            
                            if (element.id) {
                                node.setId(element.id);
                            }

                            // Extract content from rendered bilingual block
                            const zhCells = element.querySelectorAll('.bilingual-zh .bilingual-paragraph');
                            const enCells = element.querySelectorAll('.bilingual-en .bilingual-paragraph');
                            
                            const zhContent: string[] = [];
                            const enContent: string[] = [];
                            
                            zhCells.forEach((cell) => {
                                zhContent.push(cell.textContent || '');
                            });
                            
                            enCells.forEach((cell) => {
                                enContent.push(cell.textContent || '');
                            });
                            
                            node.setZhContent(zhContent.join('\n\n'));
                            node.setEnContent(enContent.join('\n\n'));

                            return { node };
                        },
                        priority: 4,
                    };
                }
                return null;
            },
        };
    }

    exportDOM(editor: LexicalEditor): DOMExportOutput {
        // Export as the markup format that the backend parser expects
        // Use plain text format without HTML tags around markers
        const element = document.createElement('div');
        
        const zhParagraphs = this.__zhContent.split('\n\n').filter(p => p.trim());
        const enParagraphs = this.__enContent.split('\n\n').filter(p => p.trim());
        
        // Build the export HTML with the bilingual markers exactly as requested
        // Note: We put the markers in text nodes/divs but they will be serialized
        // The goal is to produce:
        // {{< bilingual >}}
        // [zh]
        // Content
        // [/zh]
        // [en]
        // Content
        // [/en]
        // {{< /bilingual >}}
        
        // To ensure BookStack doesn't wrap lines in <p> tags when saving, we might need to use pre or particular structure
        // However, BookStack's HTML cleaner might still affect it.
        // Let's try to output as a single block that BookStack respects, or just sequential nodes.
        
        // Actually, the serializer expects an element. If we put text content, it gets escaped.
        // If we put <p> tags, they end up in the DB.
        // We want the DB to contain the raw shortcode text if possible, OR HTML that works.
        // But the user specifically asked for "source code" in the editor to look like the shortcode.
        // BookStack stores HTML. If we store `{{< bilingual >}}` directly in the HTML, 
        // it will likely be rendered as text.
        
        // Let's use the HTML output that we previously defined but WITHOUT the <p> wrappers for markers
        // The backend parser will then need to find these text nodes.
        
        let html = '{{< bilingual >}}\n';
        html += '[zh]\n';
        zhParagraphs.forEach(p => {
            html += `${this._escapeHtml(p.trim())}\n\n`;
        });
        html += '[/zh]\n';
        html += '[en]\n';
        enParagraphs.forEach(p => {
            html += `${this._escapeHtml(p.trim())}\n\n`;
        });
        html += '[/en]\n';
        html += '{{< /bilingual >}}';
        
        // We wrap it in a div that preserves whitespace to avoid auto-formatting messing it up
        // But BookStack might strip classes.
        element.innerHTML = html.replace(/\n/g, '<br>');
        
        // BETTER APPROACH:
        // Return a structure that mimics what the user typed in the screenshot example
        // The screenshot showed the raw text. 
        // If we want exact raw text in the DB, we might need to rely on the backend parser cleaning it up.
        
        // Let's stick to the previous <p> based approach but cleaner, or try to be minimal.
        // Users "Source Code" request implies the stored data.
        
        const output = [];
        output.push('<p>{{&lt; bilingual &gt;}}</p>');
        output.push('<p>::zh::</p>');
        zhParagraphs.forEach(p => {
            output.push(`<p>${this._escapeHtml(p.trim())}</p>`);
        });
        output.push('<p>::en::</p>');
        enParagraphs.forEach(p => {
            output.push(`<p>${this._escapeHtml(p.trim())}</p>`);
        });
        output.push('<p>{{&lt; /bilingual &gt;}}</p>');
        
        element.innerHTML = output.join('\n');

        return { element };
    }

    private _escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    exportJSON(): SerializedBilingualNode {
        return {
            type: 'bilingual',
            version: 1,
            id: this.__id,
            zhContent: this.__zhContent,
            enContent: this.__enContent,
        };
    }

    static importJSON(serializedNode: SerializedBilingualNode): BilingualNode {
        const node = $createBilingualNode();
        node.setId(serializedNode.id || '');
        node.setZhContent(serializedNode.zhContent || '');
        node.setEnContent(serializedNode.enContent || '');
        return node;
    }

    // DecoratorNode requires this method
    decorate(): null {
        return null;
    }

    isInline(): boolean {
        return false;
    }

    isIsolated(): boolean {
        return true;
    }
}

export function $createBilingualNode(): BilingualNode {
    return new BilingualNode();
}

export function $isBilingualNode(node: LexicalNode | null | undefined): node is BilingualNode {
    return node instanceof BilingualNode;
}
