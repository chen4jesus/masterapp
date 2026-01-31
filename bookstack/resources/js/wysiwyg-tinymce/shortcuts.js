/**
 * @param {Editor} editor
 */
export function register(editor) {
    // Headers
    for (let i = 1; i < 5; i++) {
        editor.shortcuts.add(`meta+${i}`, '', ['FormatBlock', false, `h${i + 1}`]);
    }

    // Other block shortcuts
    editor.shortcuts.add('meta+5', '', ['FormatBlock', false, 'p']);
    editor.shortcuts.add('meta+d', '', ['FormatBlock', false, 'p']);
    editor.shortcuts.add('meta+6', '', ['FormatBlock', false, 'blockquote']);
    editor.shortcuts.add('meta+q', '', ['FormatBlock', false, 'blockquote']);
    editor.shortcuts.add('meta+7', '', ['codeeditor', false, 'pre']);
    editor.shortcuts.add('meta+e', '', ['codeeditor', false, 'pre']);
    editor.shortcuts.add('meta+8', '', ['FormatBlock', false, 'code']);
    editor.shortcuts.add('meta+shift+E', '', ['FormatBlock', false, 'code']);
    editor.shortcuts.add('meta+o', '', 'InsertOrderedList');
    editor.shortcuts.add('meta+p', '', 'InsertUnorderedList');

    // Save draft shortcut
    editor.shortcuts.add('meta+S', '', () => {
        window.$events.emit('editor-save-draft');
    });

    // Save page shortcut
    editor.shortcuts.add('meta+13', '', () => {
        window.$events.emit('editor-save-page');
    });

    // Loop through callout styles
    editor.shortcuts.add('meta+9', '', () => {
        const selectedNode = editor.selection.getNode();
        const callout = selectedNode ? selectedNode.closest('.callout') : null;

        const formats = ['info', 'success', 'warning', 'danger'];
        const currentFormatIndex = formats.findIndex(format => {
            return callout && callout.classList.contains(format);
        });
        const newFormatIndex = (currentFormatIndex + 1) % formats.length;
        const newFormat = formats[newFormatIndex];

        editor.formatter.apply(`callout${newFormat}`);
    });

    // Link selector shortcut
    editor.shortcuts.add('meta+shift+K', '', () => {
        /** @var {EntitySelectorPopup} * */
        const selectorPopup = window.$components.first('entity-selector-popup');
        const selectionText = editor.selection.getContent({format: 'text'}).trim();
        selectorPopup.show(entity => {
            if (editor.selection.isCollapsed()) {
                editor.insertContent(editor.dom.createHTML('a', {href: entity.link}, editor.dom.encode(entity.name)));
            } else {
                editor.formatter.apply('link', {href: entity.link});
            }

            editor.selection.collapse(false);
            editor.focus();
        }, {
            initialValue: selectionText,
            searchEndpoint: '/search/entity-selector',
            entityTypes: 'page,book,chapter,bookshelf',
            entityPermission: 'view',
        });
    });

    // Bible verse shortcut (Alt+v), select any valid verse(s) then press this hotkey to generate bible verse reference.
    editor.shortcuts.add('alt+v', '', () => {
        // Make sure we're in edit mode
        if (!editor.mode || editor.mode.get() !== 'design') {
            return;
        }
        
        const selectedText = editor.selection.getContent({format: 'text'}).trim();
        
        if (selectedText) {
            // Replace selected text with a Bible verse span
            const bibleVerseSpan = editor.dom.createHTML('span', {
                'class': 'bible-verse',
                'data-reference': selectedText
            }, editor.dom.encode(selectedText));
            
            editor.selection.setContent(bibleVerseSpan);
            editor.nodeChanged();
            
            // Show a quick notification to confirm
            editor.notificationManager.open({
                text: `Bible verse reference created: ${selectedText}`,
                type: 'success',
                timeout: 500
            });
        } else {
            // If no text is selected, show an error message
            editor.notificationManager.open({
                text: 'Please select text to convert to a Bible verse reference',
                type: 'warning',
                timeout: 500
            });
        }
    });
    
    // Bible verse remove shortcut (Alt+r), select a Bible verse reference then press this hotkey to remove formatting
    editor.shortcuts.add('alt+c', '', () => {
        // Make sure we're in edit mode
        if (!editor.mode || editor.mode.get() !== 'design') {
            return;
        }
        
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
            
            // Show a quick notification to confirm
            editor.notificationManager.open({
                text: 'Bible verse reference removed',
                type: 'success',
                timeout: 500
            });
        } else {
            // If no Bible verse reference is selected, show an error message
            editor.notificationManager.open({
                text: 'Please select a Bible verse reference to remove formatting',
                type: 'warning',
                timeout: 500
            });
        }
    });
}
