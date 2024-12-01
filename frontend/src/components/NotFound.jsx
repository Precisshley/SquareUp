import React, { useState } from 'react';
import {Link} from 'react-router-dom';
import logo from '../assets/littleGuy.png';

const NotFound = () => {

  return (
    <section className="min-h-screen bg-gradient-to-r from-orange-200 to-purple-300 flex flex-col gap-5 justify-center items-center p-5">
    <h1 className="text-6xl font-bold mb-4">404 Not Found</h1>
    <p className="text-xl mb-5">Whoops! This page does not exist</p>
    <img
          className="h-25 w-auto rounded-lg"
          src={logo}
          alt="Little Square Man logo"
        />
    <Link
      to="/"
      className="text-white bg-slate-950 hover:bg-indigo-900 rounded-md px-3 py-2 mt-4"
      
      >Go Back</Link
    >
  </section>

  );
};
  
export default NotFound;
