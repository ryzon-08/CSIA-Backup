import React, {createContext, useState, useContext} from "react";

const auth = createContext();

export const AuthProv = ({ children }) => {
    const [isAuth, setIsAuth] = useState(false);
    const login = () => setIsAuth(true);
    const logout = () => setIsAuth(false);


return (
    <auth.Provider value= {{isAuth, login, logout}}>
        {children}
    </auth.Provider>
);
};

export const useAuth = () => useContext(auth);