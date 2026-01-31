import {Component} from './component';
import {getLoading, htmlToDom} from '../services/dom';
import {buildForInput} from '../wysiwyg-tinymce/config';

export class BookReviews extends Component {

    setup() {
        this.elem = this.$el;
        this.bookId = Number(this.$opts.bookId);

        // Element references
        this.container = this.$refs.reviewContainer;
        this.reviewCountBar = this.$refs.reviewCountBar;
        this.reviewsTitle = this.$refs.reviewsTitle;
        this.addButtonContainer = this.$refs.addButtonContainer;
        this.replyToRow = this.$refs.replyToRow;
        this.formContainer = this.$refs.formContainer;
        this.form = this.$refs.form;
        this.formInput = this.$refs.formInput;
        this.formReplyLink = this.$refs.formReplyLink;
        this.addreviewButton = this.$refs.addreviewButton;
        this.hideFormButton = this.$refs.hideFormButton;
        this.removeReplyToButton = this.$refs.removeReplyToButton;

        // WYSIWYG options
        this.wysiwygLanguage = this.$opts.wysiwygLanguage;
        this.wysiwygTextDirection = this.$opts.wysiwygTextDirection;
        this.wysiwygEditor = null;

        // Translations
        this.createdText = this.$opts.createdText;
        this.countText = this.$opts.countText;

        // Internal State
        this.parentId = null;
        this.formReplyText = this.formReplyLink?.textContent || '';

        this.setupListeners();
    }

    setupListeners() {
        this.elem.addEventListener('book-review-delete', () => {
            setTimeout(() => this.updateCount(), 1);
            this.hideForm();
        });

        this.elem.addEventListener('book-review-reply', event => {
            this.setReply(event.detail.id, event.detail.element);
        });

        if (this.form) {
            this.removeReplyToButton.addEventListener('click', this.removeReplyTo.bind(this));
            this.hideFormButton.addEventListener('click', this.hideForm.bind(this));
            this.addreviewButton.addEventListener('click', this.showForm.bind(this));
            this.form.addEventListener('submit', this.savereview.bind(this));
        }
    }

    savereview(event) {
        event.preventDefault();
        event.stopPropagation();

        const loading = getLoading();
        loading.classList.add('px-l');
        this.form.after(loading);
        this.form.toggleAttribute('hidden', true);

        const reqData = {
            html: this.wysiwygEditor.getContent(),
            parent_id: this.parentId || null,
        };

        window.$http.post(`/review/${this.bookId}`, reqData).then(resp => {
            const newElem = htmlToDom(resp.data);

            if (reqData.parent_id) {
                this.formContainer.after(newElem);
            } else {
                this.container.append(newElem);
            }

            window.$events.success(this.createdText);
            this.hideForm();
            this.updateCount();
        }).catch(err => {
            this.form.toggleAttribute('hidden', false);
            window.$events.showValidationErrors(err);
        });

        this.form.toggleAttribute('hidden', false);
        loading.remove();
    }

    updateCount() {
        const count = this.getreviewCount();
        this.reviewsTitle.textContent = window.$trans.choice(this.countText, count, {count});
    }

    resetForm() {
        this.removeEditor();
        this.formInput.value = '';
        this.parentId = null;
        this.replyToRow.toggleAttribute('hidden', true);
        this.container.append(this.formContainer);
    }

    showForm() {
        this.removeEditor();
        this.formContainer.toggleAttribute('hidden', false);
        this.addButtonContainer.toggleAttribute('hidden', true);
        this.formContainer.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        this.loadEditor();
    }

    hideForm() {
        this.resetForm();
        this.formContainer.toggleAttribute('hidden', true);
        if (this.getreviewCount() > 0) {
            this.elem.append(this.addButtonContainer);
        } else {
            this.reviewCountBar.append(this.addButtonContainer);
        }
        this.addButtonContainer.toggleAttribute('hidden', false);
    }

    loadEditor() {
        if (this.wysiwygEditor) {
            this.wysiwygEditor.focus();
            return;
        }

        const config = buildForInput({
            language: this.wysiwygLanguage,
            containerElement: this.formInput,
            darkMode: document.documentElement.classList.contains('dark-mode'),
            textDirection: this.wysiwygTextDirection,
            translations: {},
            translationMap: window.editor_translations,
        });

        window.tinymce.init(config).then(editors => {
            this.wysiwygEditor = editors[0];
            setTimeout(() => this.wysiwygEditor.focus(), 50);
        });
    }

    removeEditor() {
        if (this.wysiwygEditor) {
            this.wysiwygEditor.remove();
            this.wysiwygEditor = null;
        }
    }

    getreviewCount() {
        return this.container.querySelectorAll('[component="book-review"]').length;
    }

    setReply(reviewLocalId, reviewElement) {
        const targetFormLocation = reviewElement.closest('.review-branch').querySelector('.review-branch-children');
        targetFormLocation.append(this.formContainer);
        this.showForm();
        this.parentId = reviewLocalId;
        this.replyToRow.toggleAttribute('hidden', false);
        this.formReplyLink.textContent = this.formReplyText.replace('1234', this.parentId);
        this.formReplyLink.href = `#review${this.parentId}`;
    }

    removeReplyTo() {
        this.parentId = null;
        this.replyToRow.toggleAttribute('hidden', true);
        this.container.append(this.formContainer);
        this.showForm();
    }

}
