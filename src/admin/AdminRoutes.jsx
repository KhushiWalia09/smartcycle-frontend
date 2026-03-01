import { Navigate } from "react-router-dom";

const AdminRoute = ({ role, children }) => {
  if (role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute;
