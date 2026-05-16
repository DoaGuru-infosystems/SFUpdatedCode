import React from 'react';
import { Link } from 'react-router-dom';
import NotFoundImage from '../assets/images/not-found-cartoon.png'; // Add a cartoon image here

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <img src={NotFoundImage} alt="Page Not Found" className=" mb-8" />
      <h1 className="text-5xl font-bold text-gray-800">Oops!</h1>
      <p className="text-gray-600 mt-4 text-center">
        The page you're looking for isn't here.
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 bg-blue-500 text-white text-lg font-medium rounded-md hover:bg-blue-600 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
