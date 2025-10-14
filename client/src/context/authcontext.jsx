import React, {createContext, useState, useContext} from "react";

//Create autenthication context for global state management
const auth = createContext();


//Auth provider component to wrap around the app and provide auth state
export const AuthProv = ({ children }) => {
    //Global state to track if user is authenticated
    const [isAuth, setIsAuth] = useState(false);

    //Functions to login and logout by updating auth state
    const login = () => setIsAuth(true);
    const logout = () => setIsAuth(false);

//Provide auth state and functions to children components
return (
    <auth.Provider value= {{isAuth, login, logout}}>
        {children}
    </auth.Provider>
);
};

//Custom hook to use auth context in components
export const useAuth = () => useContext(auth);