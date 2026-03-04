import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
        <p className="text-gray-600 mb-6">You do not have permission to access this page.</p>
        <Link
          to="/login"
          className="inline-block bg-indigo-600 text-white px-5 sm:px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
