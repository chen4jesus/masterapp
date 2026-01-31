import {Component} from './component';

/**
 * BilingualContent Component
 * Handles interactive highlighting for bilingual content blocks.
 * When a paragraph in either column is clicked, both the Chinese and English
 * versions are highlighted together for easy reading.
 */
export class BilingualContent extends Component {
    setup() {
        this.container = this.$el;
        this.rows = this.container.querySelectorAll('.bilingual-row');
        this.activeRow = null;

        this.setupClickHandlers();
    }

    setupClickHandlers() {
        this.rows.forEach(row => {
            row.addEventListener('click', (e) => {
                this.handleRowClick(row);
            });
        });

        // Click outside to deselect
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.activeRow) {
                this.clearHighlight();
            }
        });
    }

    handleRowClick(row) {
        // If clicking the same row, toggle off
        if (this.activeRow === row) {
            this.clearHighlight();
            return;
        }

        // Clear previous highlight
        this.clearHighlight();

        // Highlight the new row
        row.classList.add('highlighted');
        this.activeRow = row;
    }

    clearHighlight() {
        if (this.activeRow) {
            this.activeRow.classList.remove('highlighted');
            this.activeRow = null;
        }
    }
}
