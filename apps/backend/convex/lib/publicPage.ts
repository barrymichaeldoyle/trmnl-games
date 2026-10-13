/**
 * D144: hero and angler pages are public unless the owner hid them. A missing flag means public, so only an
 * explicit Hide (`publicProfile: false`) keeps a page private.
 */
export const pagePublic = (subject: { publicProfile?: boolean } | null | undefined): boolean => subject != null && subject.publicProfile !== false
