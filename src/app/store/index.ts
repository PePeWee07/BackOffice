import { ActionReducer, ActionReducerMap, INIT, MetaReducer, UPDATE } from "@ngrx/store";
import { LayoutState, layoutReducer } from "./layout/layout-reducers";
import { EcommerceReducer, EcommerceState } from "./Ecommerce/ecommerce-reducer";
import { HRManagementReducer, HRManagementState } from "./HR/hr-reducer";
import { NotesReducer, NotesState } from "./Note/notes-reducer";
import { SocialReducer, SocialState } from "./Social/social-reducer";
import { CalendarState, calendarReducer } from "./Calendar/calendar.reducer";
import { hydrateLayoutState, persistLayoutState } from "./layout/layout-storage";


export interface RootReducerState {
    layout: LayoutState,
    Ecommerce: EcommerceState,
    HR: HRManagementState,
    Notes: NotesState,
    Social: SocialState,
    Calendar: CalendarState,
}

export const rootReducer: ActionReducerMap<RootReducerState> = {
    layout: layoutReducer,
    Ecommerce: EcommerceReducer,
    HR: HRManagementReducer,
    Notes: NotesReducer,
    Social: SocialReducer,
    Calendar: calendarReducer
}

export const metaReducers: MetaReducer<RootReducerState>[] = [
    (reducer: ActionReducer<RootReducerState>): ActionReducer<RootReducerState> =>
        (state, action) => {
            const nextState = reducer(state, action);
            const finalState = action.type === INIT || action.type === UPDATE
                ? { ...nextState, layout: hydrateLayoutState() }
                : nextState;

            persistLayoutState(finalState.layout);

            return finalState;
        }
];
