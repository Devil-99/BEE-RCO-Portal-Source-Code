import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user_id: '',
    entity_id: '',
    entity_registration_number: '',
    username: '',
    full_name: '',
    address: '',
    state: '',
    payment_flag: null,
    document_flag: null,
    session_id: '',
    session_token: '',
    role_code: '', 
    entity_type : '',
    org_name : '',
    sector_type : '',
    created_at: '',
    updated_at: '',
    is_password_reset: '',
};

export const loginSlice = createSlice({
    name: "login",
    initialState,
    reducers: {
        trackStatus: (state, action) => {
            state.entity_id = action.payload.entity_id;
            state.user_id = action.payload.user_id;
            state.entity_type = action.payload.entity_type;
            state.sector_type = action.payload.sector_type;
            state.username = action.payload.username;
            state.payment_flag = action.payload.payment_flag;
            state.document_flag = action.payload.document_flag;
            state.created_at = action.payload.created_at;
            state.updated_at = action.payload.updated_at;
            state.session_id = action.payload.session_id;
        },
        loginSuccess: (state, action) => {
            state.user_id = action.payload.user_id;
            state.username = action.payload.username;
            state.full_name = action.payload.full_name;
            state.session_token = action.payload.session_token || '';
            state.session_id = action.payload.session_id || '';
            state.role_code = action.payload.role_code || '';
            state.entity_id = action.payload.entity_id;
            state.entity_registration_number = action.payload.entity_reg_no;
            state.address = action.payload.address;
            state.org_name = action.payload.org_name;
            state.sector_type = action.payload.sector_type;
            state.state = action.payload.state;
            state.entity_type = action.payload.entity_type;
            state.is_password_reset = action.payload.is_password_reset || false;
        },
        logout: (state) => {
            state.user_id = '';
            state.entity_id = '';
            state.entity_registration_number = '';
            state.username = '';
            state.full_name = '';
            state.address = '';
            state.state = '';
            state.payment_flag = null;
            state.document_flag = null;
            state.session_token = '';
            state.session_id = '';
            state.role_code = '';
            state.entity_type = ''; // Reset the entity type    
            state.is_password_reset = '';
        },
        passwordChange: (state) => {
            state.is_password_reset = true;
        }
    },
});

export const { trackStatus, loginSuccess, logout, passwordChange } = loginSlice.actions;
export default loginSlice.reducer;