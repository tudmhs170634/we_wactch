import AuthForm from '@/src/components/AuthForm';
import AvatarServer from '@/src/components/AvatarServer';

const RegisterPage = () => {
  return <AuthForm initialMode="register" avatarNode={<AvatarServer />} />;
};

export default RegisterPage;
