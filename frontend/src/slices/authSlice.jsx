import { createSlice } from "@reduxjs/toolkit";
import { getStored } from "../utils/localStorage";

const initialState = {
    signupData: null,
    loading: false,
    token: getStored("token", null),
};

export const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        setSignupData(state, action) {  
            state.signupData = action.payload;
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setToken(state, action) {
            state.token = action.payload;
        }
    }
});

export const { setSignupData, setLoading, setToken } = authSlice.actions;
export default authSlice.reducer;
