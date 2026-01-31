/**
 * @param {Editor} editor
 */
function register(editor) {
    // Add a custom icon for the Bible verse button
    editor.ui.registry.addIcon('bibleverse', '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 22h15v-2H6.012C5.55 19.988 5 19.805 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3zM5 8V5c0-.805.55-.988 1-1h13v12H5V8z"/><path d="M8 6h9v2H8z"/><path d="M8 10h9v2H8z"/><path d="M8 14h9v2H8z"/></svg>');

    // Add a button to the toolbar
    editor.ui.registry.addButton('bibleverse', {
        icon: 'bibleverse',
        tooltip: 'Insert Bible Verse Reference (Alt+V to add, Alt+C to remove)',
        onAction() {
            editor.windowManager.open({
                title: 'Insert Bible Verse Reference',
                body: {
                    type: 'panel',
                    items: [
                        {
                            type: 'input',
                            name: 'reference',
                            label: 'Bible Verse Reference',
                            placeholder: 'e.g., 约 3:16 or 罗 8:28-30'
                        }
                    ]
                },
                buttons: [
                    {
                        type: 'cancel',
                        text: 'Cancel'
                    },
                    {
                        type: 'submit',
                        text: 'Insert',
                        primary: true
                    }
                ],
                onSubmit: (api) => {
                    const data = api.getData();
                    const reference = data.reference.trim();
                    
                    if (reference) {
                        // Insert the Bible verse reference as a span with a special class and data attribute
                        editor.insertContent(`<span class="bible-verse" data-reference="${reference}">${reference}</span>`);
                    }
                    
                    api.close();
                }
            });
        }
    });

    // Add a menu item under the Insert menu
    editor.ui.registry.addMenuItem('bibleverse', {
        icon: 'bibleverse',
        text: 'Bible Verse Reference',
        context: 'insert',
        onAction() {
            editor.execCommand('mceBibleVerse');
        }
    });

    // Add a command for inserting Bible verse references
    editor.addCommand('mceBibleVerse', () => {
        editor.execCommand('mceInsertBibleVerse');
    });
    
    // Add a command to remove Bible verse formatting
    editor.addCommand('mceRemoveBibleVerse', () => {
        // Check if selection contains or is within a Bible verse span
        const selectedNode = editor.selection.getNode();
        const bibleVerseSpan = selectedNode.nodeName === 'SPAN' && selectedNode.classList.contains('bible-verse') 
            ? selectedNode 
            : selectedNode.closest('.bible-verse');
        
        if (bibleVerseSpan) {
            // Get the text content of the Bible verse reference
            const referenceText = bibleVerseSpan.textContent;
            
            // Replace the Bible verse span with plain text
            const textNode = editor.getDoc().createTextNode(referenceText);
            editor.dom.replace(textNode, bibleVerseSpan);
            editor.nodeChanged();
        }
    });
    
    // Setup context menu for Bible verse references
    editor.ui.registry.addContextMenu('bibleverse', {
        update: (element) => {
            // Check if the element is or is within a Bible verse reference
            return element.nodeName === 'SPAN' && element.classList.contains('bible-verse') || 
                  element.closest('.bible-verse') ? 'removebibleverse' : '';
        }
    });
    
    // Add a context menu item to remove Bible verse formatting
    editor.ui.registry.addMenuItem('removebibleverse', {
        text: 'Remove Bible Verse Reference',
        icon: 'remove-formatting',
        onAction: () => {
            editor.execCommand('mceRemoveBibleVerse');
            
            // Show a quick notification to confirm
            editor.notificationManager.open({
                text: 'Bible verse reference removed',
                type: 'success',
                timeout: 500
            });
        }
    });
}

/**
 * @return {register}
 */
export function getPlugin() {
    return register;
} 