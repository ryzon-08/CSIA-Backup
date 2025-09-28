import React from 'react';
import './Login.css';
import { FaRegCircleUser, FaKey } from "react-icons/fa6";
import logo from '../../assets/logo.png';
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../context/authcontext";
import {useState} from "react";

const LoginInterface = () => {
    const [userid, setUserid] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const {login}=useAuth();
    const navigate = useNavigate();

    const handleTryAgain = () => {
        setUserid("");
        setPassword("");
        setError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (userid === "6911" && password === "project19") {
            login()
            setError("");
            navigate("/dashboard");
        } else {
            setError("Invalid User ID or Password");
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