ngapp.service('modalStackService', function() {
    class ModalStack {
        constructor(scope) {
            this.scope = scope;
            this.stack = [];
            // if a modal was opened and not registered with the modalStack, we want to reopen the top of the stack
            // when it closes
            this.unwatch = scope.$watch(
                scope => scope.$root.modalActive,
                (newVal, oldVal, scope) => {
                    //console.log(`modalActive ${oldVal} -> ${newVal}`);
                    if (oldVal === true && newVal === false) {
                        this.openTopModal();
                    }
                }
            );
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
                this.cleanup();
            }
        }

        clear() {
            this.stack = [];
            this.cleanup();
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

        cleanup() {
            this.unwatch();
            this.closeModal();
        }

        closeModal() {
            this.scope.$emit('closeModal');
        }
    }
    
    this.new = function(scope) {
        return new ModalStack(scope);
    }
});
