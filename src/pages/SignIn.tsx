import { useNavigate } from 'react-router-dom';
import { SignInForm } from '../components/auth/SignInForm';

export const SignIn = () => {
  const navigate = useNavigate();

  const handleSignIn = (email: string, password: string) => {
    // Add authentication logic here
    console.log('Signing in with:', email, password);
    navigate('/categories');
  };

  return (
    <div className="signin-container">
      <SignInForm onSignIn={handleSignIn} />
    </div>
  );
};