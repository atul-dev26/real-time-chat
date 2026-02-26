import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "@/components/ui/full-screen-loader";

const REDIRECT_DELAY_MS = 3000;

const LoginLoading = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/");
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <FullScreenLoader />
  );
};

export default LoginLoading;
