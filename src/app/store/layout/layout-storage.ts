import { LayoutState, initialState } from './layout-reducers';

const LAYOUT_STORAGE_KEY = 'app-layout-settings';

function isBrowserStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStoredLayoutState(): Partial<LayoutState> | null {
    if (!isBrowserStorageAvailable()) {
        return null;
    }

    try {
        const rawValue = localStorage.getItem(LAYOUT_STORAGE_KEY);

        if (!rawValue) {
            return null;
        }

        return JSON.parse(rawValue) as Partial<LayoutState>;
    } catch {
        return null;
    }
}

function writeStoredLayoutState(state: LayoutState): void {
    if (!isBrowserStorageAvailable()) {
        return;
    }

    try {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Ignore quota/storage errors and keep the app working with in-memory state.
    }
}

export function hydrateLayoutState(): LayoutState {
    return {
        ...initialState,
        ...readStoredLayoutState(),
    };
}

export function persistLayoutState(state: LayoutState): void {
    writeStoredLayoutState(state);
}
