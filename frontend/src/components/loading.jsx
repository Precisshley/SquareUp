import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/flowerGuy.png';

const Loading = () => {
  return (
    <section className="min-h-screen bg-gradient-to-r from-orange-200 to-purple-300 flex flex-col gap-5 justify-center items-center p-5">
      <h1 className="text-6xl font-bold mb-4">Hold On...</h1>
      <p className="text-xl">We're stitching the pictures together!</p>
      
      {/* Image with tilting animation */}
      <img
        className="h-25 w-auto rounded-lg animate-[tilt_2s_ease-in-out_infinite]"
        src={logo}
        alt="Little Square Man logo"
      />
    </section>
  );
};

export default Loading;
