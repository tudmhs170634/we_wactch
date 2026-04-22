import AuthForm from '@/src/components/AuthForm';
import AvatarServer from '@/src/components/AvatarServer';

const LoginPage = () => {
  return <AuthForm initialMode="login" avatarNode={<AvatarServer />} />;
};

export default LoginPage;
