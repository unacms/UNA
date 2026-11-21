/** Where the device stands on push notifications for this app. */
export type PushPermission = 'granted' | 'denied' | 'default' | 'unsupported';

/** The member a device subscribes for. */
export type PushMember = { id: number | string; hash?: string };

/**
 * A push notification service (OneSignal, ...). NEO's own dialog (`PushPrompt`) asks the member,
 * then calls these; a provider never shows UI of its own.
 */
export interface PushProvider {
    /** Key in `pushProviders` and in `notifications.push_provider`. */
    name: string;
    /** Has the keys it needs in this build. */
    isConfigured(): boolean;
    /** Current permission. Cheap: it may answer before the SDK loads. */
    permission(): Promise<PushPermission>;
    /**
     * Loads the SDK, so `requestPermission` can run straight from the press that asks for it
     * (browsers drop a permission request that isn't part of a user gesture).
     */
    prepare(): Promise<void>;
    /** The system's permission request. Call it synchronously from a press handler. Resolves `true` when granted. */
    requestPermission(): Promise<boolean>;
    /** Links this device's subscription with the member, for UNA to send to them. */
    login(member: PushMember): Promise<void>;
    /** Unlinks the device on sign-out, so the next account isn't sent the previous one's notifications. */
    logout(): Promise<void>;
}
