import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
    email: string | null,

}

const initialState: UserState = {
    email: null,

}

const userSlice = createSlice({
    name:'user',
    initialState,
    reducers:{
        setUserEmail: (state, action: PayloadAction<string | null>) =>{
            state.email = action.payload;
        },
    },
});

export const {setUserEmail} = userSlice.actions;

export const userReducer = userSlice.reducer;