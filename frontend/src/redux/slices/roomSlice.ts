import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserDetails } from "../../types/User";
interface RoomState {
  users: UserDetails[];
}

const initialState: RoomState = {
  users: [],
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<UserDetails[]>) {
      state.users = action.payload;
    },
    addUser(state, action: PayloadAction<UserDetails>) {
      if (!state.users.some(user=> user.inferredName === action.payload.inferredName)) {
        state.users.push(action.payload);
      }
    },
    clearUsers(state) {
      state.users = [];
      localStorage.removeItem("roomUsers");
    },
    toggleUserReady(state, action: PayloadAction<string>){
      const user = state.users.find(user=>user.inferredName === action.payload);
      if(user){
        user.isReady = !user.isReady;
      }
    }
  },
});

export const { setUsers, addUser, clearUsers, toggleUserReady } = roomSlice.actions;
export const roomReducer = roomSlice.reducer;