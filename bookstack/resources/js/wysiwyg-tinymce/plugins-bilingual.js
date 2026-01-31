/**
 * @param {Editor} editor
 */
function register(editor) {
    editor.ui.registry.addIcon('bilingual', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h8v2H3V5zm0 4h8v2H3V9zm0 4h6v2H3v-2zm10-8h8v2h-8V5zm0 4h8v2h-8V9zm0 4h6v2h-6v-2z"/><path d="M1 3v18h10v-2H3V5h18v14h-8v2h10V3H1z" opacity="0.5"/></svg>');

    editor.ui.registry.addButton('bilingual', {
        icon: 'bilingual',
        tooltip: 'Insert bilingual block',
        onAction() {
            editor.execCommand('InsertBilingualBlock');
        },
    });

    editor.addCommand('InsertBilingualBlock', () => {
        const id = `bilingual-${Math.random().toString(36).substr(2, 9)}`;
        const content = `
            <div class="bilingual-editor-container" data-lexical-bilingual="true" id="${id}" contenteditable="false" data-mce-contenteditable="false">
                <div class="bilingual-editor-header">
                    <div class="bilingual-editor-header-zh">中文</div>
                    <div class="bilingual-editor-header-en">ENGLISH</div>
                </div>
                <div class="bilingual-editor-content">
                    <div class="bilingual-editor-column bilingual-editor-zh">
                        <textarea class="bilingual-editor-textarea" placeholder="在此输入中文内容...\n\n每个段落用空行分隔。"></textarea>
                    </div>
                    <div class="bilingual-editor-column bilingual-editor-en">
                        <textarea class="bilingual-editor-textarea" placeholder="Enter English content here...\n\nSeparate paragraphs with blank lines."></textarea>
                    </div>
                </div>
            </div>
            <p>&nbsp;</p>
        `;
        editor.insertContent(content);
        
        // Setup event listeners for the new block
        setTimeout(() => {
            const container = editor.dom.select(`#${id}`)[0];
            if (container) {
                setupBilingualBlock(editor, container);
            }
        }, 0);
    });

    // Handle existing blocks on init
    editor.on('SetContent', () => {
        const blocks = editor.dom.select('.bilingual-editor-container');
        blocks.forEach(block => setupBilingualBlock(editor, block));
    });

    // Ensure content is serialized correctly for saving
    editor.on('PreInit', () => {
        editor.serializer.addNodeFilter('div', (nodes) => {
            nodes.forEach(node => {
                if (node.attr('data-lexical-bilingual') === 'true') {
                    // Logic for serializer filter if strictly needed
                }
            });
        });
    });

    // Handle hydration from source code format
    editor.on('BeforeSetContent', (e) => {
        if (e.content && (e.content.includes('{{&lt; bilingual &gt;}}') || e.content.includes('{{< bilingual >}}'))) {
            const div = document.createElement('div');
            div.innerHTML = e.content;
            
            // Allow checking for both encoded and unencoded variations
            const isStartMarker = (text) => text === '{{< bilingual >}}' || text === '{{&lt; bilingual &gt;}}';
            const isEndMarker = (text) => text === '{{< /bilingual >}}' || text === '{{&lt; /bilingual &gt;}}';
            
            // Find all start markers
            // We iterate through children.
            const children = Array.from(div.children);
            let i = 0;
            
            while (i < children.length) {
                const child = children[i];
                const text = child.textContent?.trim() || '';
                
                if (isStartMarker(text)) {
                    // Found start. Scan ahead.
                    let j = i + 1;
                    let zhContent = [];
                    let enContent = [];
                    let state = 'zh_wait'; // zh_wait, zh, en_wait, en, done
                    let foundEnd = false;
                    
                    const nodesToRemove = [child];
                    
                    while (j < children.length) {
                        const nextChild = children[j];
                        const nextText = nextChild.textContent?.trim() || '';
                        nodesToRemove.push(nextChild);
                        
                        if (state === 'zh_wait') {
                            if (nextText === '::zh::') state = 'zh';
                        } else if (state === 'zh') {
                            if (nextText === '::en::') state = 'en';
                            else zhContent.push(nextChild.innerHTML); 
                        } else if (state === 'en') {
                            if (isEndMarker(nextText)) {
                                foundEnd = true;
                                break;
                            } else {
                                enContent.push(nextChild.innerHTML);
                            }
                        }
                        j++;
                    }
                    
                    if (foundEnd) {
                        // Construct the editor block
                        const id = `bilingual-${Math.random().toString(36).substr(2, 9)}`;
                        const zhHtml = zhContent.join('\n\n'); // Textareas need newlines for paragraphs
                        const enHtml = enContent.join('\n\n');
                        
                        // We need to decode HTML entities for the textarea value
                        const decodeHtml = (html) => {
                            const txt = document.createElement("textarea");
                            txt.innerHTML = html;
                            return txt.value;
                        };

                        const block = document.createElement('div');
                        block.className = 'bilingual-editor-container';
                        block.setAttribute('data-lexical-bilingual', 'true');
                        block.setAttribute('id', id);
                        block.setAttribute('contenteditable', 'false');
                        block.setAttribute('data-mce-contenteditable', 'false');
                        block.innerHTML = `
                            <div class="bilingual-editor-header">
                                <div class="bilingual-editor-header-zh">中文</div>
                                <div class="bilingual-editor-header-en">ENGLISH</div>
                            </div>
                            <div class="bilingual-editor-content">
                                <div class="bilingual-editor-column bilingual-editor-zh">
                                    <textarea class="bilingual-editor-textarea" placeholder="在此输入中文内容...\n\n每个段落用空行分隔。">${decodeHtml(zhHtml)}</textarea>
                                </div>
                                <div class="bilingual-editor-column bilingual-editor-en">
                                    <textarea class="bilingual-editor-textarea" placeholder="Enter English content here...\n\nSeparate paragraphs with blank lines.">${decodeHtml(enHtml)}</textarea>
                                </div>
                            </div>
                        `;
                        
                        // Replace the range of nodes with this block
                        child.replaceWith(block);
                        // Remove consumed nodes (except child which was replaced)
                        nodesToRemove.slice(1).forEach(n => n.remove());
                        
                        // Update index to jump over consumed nodes
                        i = j;
                    }
                }
                i++;
            }
            
            e.content = div.innerHTML;
        }
    });

    // We need a custom GetContent handler to transform our format to the backend format
    editor.on('GetContent', (e) => {
        if (e.content.includes('class="bilingual-editor-container"')) {
            // Parse content to replace HTML blocks with markup
            const div = document.createElement('div');
            div.innerHTML = e.content;
            
            const blocks = div.querySelectorAll('.bilingual-editor-container');
            blocks.forEach(block => {
                const zhText = block.querySelector('.bilingual-editor-zh textarea')?.value || '';
                const enText = block.querySelector('.bilingual-editor-en textarea')?.value || '';
                
                const zhParagraphs = zhText.split('\n\n').filter(p => p.trim());
                const enParagraphs = enText.split('\n\n').filter(p => p.trim());

                let markup = '<p>{{&lt; bilingual &gt;}}</p>\n';
                markup += '<p>::zh::</p>\n';
                zhParagraphs.forEach(p => {
                    markup += `<p>${escapeHtml(p.trim())}</p>\n`;
                });
                markup += '<p>::en::</p>\n';
                enParagraphs.forEach(p => {
                    markup += `<p>${escapeHtml(p.trim())}</p>\n`;
                });
                markup += '<p>{{&lt; /bilingual &gt;}}</p>';
                
                const wrapper = document.createElement('div');
                wrapper.innerHTML = markup;
                block.replaceWith(...wrapper.childNodes);
            });
            
            e.content = div.innerHTML;
        }
    });
}

function setupBilingualBlock(editor, container) {
    const textareas = container.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        // Prevent editor from interfering with textarea interaction
        // specifically mouse events which cause the editor to select the container
        textarea.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        // Also stop click to be safe, but mousedown is usually the culprit for selection
        textarea.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Bind input to update internal state if needed
        textarea.addEventListener('input', () => {
            editor.setDirty(true);
        });
        
        // Restore values if they were lost during DOM manipulation
        const savedValue = textarea.getAttribute('data-value');
        if (savedValue && !textarea.value) {
            textarea.value = savedValue;
        }
        
        textarea.addEventListener('change', () => {
            textarea.setAttribute('data-value', textarea.value);
            textarea.innerHTML = escapeHtml(textarea.value); // Sync for serializer
        });
    });
}

function findTextarea(tinymceNode, selector) {
    // Helper to find node in TinyMCE's node structure
    // This is tricky because filter uses wrapper nodes
    // Simplified: we do the transformation in GetContent event which works on string/HTML
    return null; 
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * @return {register}
 */
export function getPlugin() {
    return register;
}
