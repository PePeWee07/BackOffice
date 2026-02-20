import { createReducer, on } from '@ngrx/store';
import { Register, RegisterFailure, RegisterSuccess, login, loginFailure, loginSuccess, logout, logoutSuccess} from './authentication.actions';
import { AuthResponse } from './auth.models';

export interface AuthenticationState {
    isLoggedIn: boolean;
    user: AuthResponse | null;
    error: string | null;
}

const initialState: AuthenticationState = {
    isLoggedIn: false,
    user: null,
    error: null,
};

export const authenticationReducer = createReducer(
    initialState,
    on(Register, (state) => ({ ...state, error: null })),
    on(RegisterSuccess, (state, { user }) => ({ ...state, isLoggedIn: true, user, error: null, })),
    on(RegisterFailure, (state, { error }) => ({ ...state, error })),

    on(login, (state) => ({ ...state, error: null })),
    on(loginSuccess, (state, { user }) => ({ ...state, isLoggedIn: true, user, error: null, })),
    on(loginFailure, (state, { error }) => ({ ...state, error })),

    on(logout, (state) => ({ ...state, user: null })),
    on(logoutSuccess, (state) => ({ ...state, isLoggedIn: false, user: null, error: null }))
);
