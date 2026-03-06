import { ActionReducerMap } from "@ngrx/store";
import { LayoutState, layoutReducer } from "./layout/layout-reducers";
import { EcommerceReducer, EcommerceState } from "./Ecommerce/ecommerce-reducer";
import { HRManagementReducer, HRManagementState } from "./HR/hr-reducer";
import { NotesReducer, NotesState } from "./Note/notes-reducer";
import { SocialReducer, SocialState } from "./Social/social-reducer";
import { UserReducer, UserState } from "./User/user-reducer";
import { CalendarState, calendarReducer } from "./Calendar/calendar.reducer";


export interface RootReducerState {
    layout: LayoutState,
    Ecommerce: EcommerceState,
    HR: HRManagementState,
    Notes: NotesState,
    Social: SocialState,
    User: UserState,
    Calendar: CalendarState,
}

export const rootReducer: ActionReducerMap<RootReducerState> = {
    layout: layoutReducer,
    Ecommerce: EcommerceReducer,
    HR: HRManagementReducer,
    Notes: NotesReducer,
    Social: SocialReducer,
    User: UserReducer,
    Calendar: calendarReducer
}
