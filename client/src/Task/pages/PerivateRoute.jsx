import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element: Component, isAuthenticated, ...rest }) => {
    return isAuthenticated ? <Component {...rest} /> : <Navigate to="/task/login" />;
};

export default PrivateRoute;
