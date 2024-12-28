import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RoomState {
  users: string[];
}

const initialState: RoomState = {
  users: JSON.parse(localStorage.getItem("roomUsers") || "[]"),
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<string[]>) {
      state.users = action.payload;
      localStorage.setItem("roomUsers", JSON.stringify(state.users));
    },
    addUser(state, action: PayloadAction<string>) {
      if (!state.users.includes(action.payload)) {
        state.users.push(action.payload);
        localStorage.setItem("roomUsers", JSON.stringify(state.users));
      }
    },
    clearUsers(state) {
      state.users = [];
      localStorage.removeItem("roomUsers");
    },
  },
});

export const { setUsers, addUser, clearUsers } = roomSlice.actions;
export const roomReducer = roomSlice.reducer;