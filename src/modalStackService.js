ngapp.service('modalStackService', function() {
    class ModalStack {
        constructor(scope) {
            this.scope = scope;
            this.stack = [];
        }

        push(modalName, args) {
            this.stack.push({
                modalName: modalName,
                args: args
            });

            this.openTopModal();
        }

        pop() {
            this.stack.pop();

            if (this.stack.length > 0) {
                this.openTopModal();
            }
            else {
                this.closeModal();
            }
        }

        clear() {
            this.stack = [];
            this.closeModal();
        }

        // private
        openTopModal() {
            let modalContext = this.stack[this.stack.length - 1];
            this.scope.$emit('openModal', modalContext.modalName, {
                basePath: `${modulePath}/partials`,
                args: modalContext.args,
                modalStack: this
            });
        }

        closeModal() {
            this.scope.$emit('closeModal');
        }
    }
    
    this.new = function(scope) {
        return new ModalStack(scope);
    }
});
