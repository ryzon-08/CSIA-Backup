import React from 'react';
import './Login.css';
import { FaRegCircleUser, FaKey } from "react-icons/fa6";
import logo from '../../assets/logo.png';
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../context/authcontext";
import {useState} from "react";


//stating variables for user id, password and errors
const LoginInterface = () => {
    const [userid, setUserid] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const {login}=useAuth();
    const navigate = useNavigate();


    //function to handle try again button and reset fields
    const handleTryAgain = () => {
        setUserid("");
        setPassword("");
        setError("");
    };

    //function to handle form submission and validate credentials
    const handleSubmit = (e) => {
        e.preventDefault();
        //Validating user id and password
        if (userid === "admin" && password === "stock123") {
            login() //update auth context on successful login
            setError("");
            navigate("/dashboard"); //redirect to dashboard on successful login
        } else {
            setError("Invalid User ID or Password"); //error message if validation failed
        }
    }

    return (
        <>    
            <img 
                src={logo} 
                alt="Logo" 
                className="logo"
            />
            
            <div className='loginbox'>
                <form onSubmit={handleSubmit}>
                    <div className="inputbox">
                        <input 
                            type="text" 
                            placeholder="User ID"
                            value={userid}
                            onChange={(e) => setUserid(e.target.value)}
                            required
                        />
                        <FaRegCircleUser className='icon' />
                    </div>

                    <div className="inputbox">
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value = {password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                        <FaKey className='icon' />
                    </div>

                    {error && <div className="error-message">
                        {error}
                        <button 
                            type="button"
                            onClick={handleTryAgain}
                            className="try-again-button">   
                         Try Again 
                        </button>
                    </div>}

                    <button type="submit">Login</button>
                </form>
            </div>
        </>
    );
};

export default LoginInterface;