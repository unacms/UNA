import { Chat } from './chat';

declare global {
    interface Window {
        una: {
            Chat: typeof Chat;
        };
    }
}

window.una = {
    Chat,
};

export {};
